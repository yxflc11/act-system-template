#!/bin/sh

set -u

audit_root="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
audit_hits=0

scan_files() {
  audit_label="$1"
  audit_pattern="$2"
  # Scan from the repo root so !scripts/privacy-audit.sh matches; absolute search paths ignore that glob.
  audit_result="$(
    CDPATH= cd -- "$audit_root" &&
    rg -l --hidden --glob '!.git/**' --glob '!scripts/privacy-audit.sh' "$audit_pattern" . 2>/dev/null || true
  )"
  if [ -n "$audit_result" ]; then
    printf '[FAIL] %s\n%s\n' "$audit_label" "$audit_result"
    audit_hits=1
  else
    printf '[PASS] %s\n' "$audit_label"
  fi
}

scan_files '高风险凭据格式' '(ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|sk-[A-Za-z0-9_-]{20,}|AIza[0-9A-Za-z_-]{30,}|xox[baprs]-[A-Za-z0-9-]{10,}|[0-9]{8,10}:[A-Za-z0-9_-]{30,})'
scan_files '私钥内容' 'BEGIN (RSA |OPENSSH |EC |DSA )?PRIVATE KEY'
scan_files '个人绝对路径' '/Users/[A-Za-z0-9._-]+|/home/[A-Za-z0-9._-]+|/root/'
scan_files '私人身份占位未清理' 'yxflc|wenshashabot|\bwen\b|雯'
scan_files '个人邮箱' '[A-Za-z0-9._%+-]+@(gmail|qq|163|126|outlook|icloud)\.[A-Za-z]{2,}'

audit_private_files="$(find "$audit_root" -type f \( -name '.env' -o -name '*.jsonl' -o -name 'state.db' -o -name '*.sqlite' -o -path '*/.claude/USER.md' -o -path '*/.claude/MEMORY.md' -o -path '*/.claude/memory/*' \) -print)"
if [ -n "$audit_private_files" ]; then
  printf '[FAIL] 不应公开的真实数据文件\n%s\n' "$audit_private_files"
  audit_hits=1
else
  printf '[PASS] 不应公开的真实数据文件\n'
fi

if [ "$audit_hits" -ne 0 ]; then
  printf '隐私扫描失败；不要发布。\n'
  exit 1
fi

printf '隐私扫描通过。仍需人工检查 Git diff、图片、许可证和完整历史。\n'
