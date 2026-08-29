# ACT System Template

这是 ACT × LLM Wiki 的公开系统壳子，只保存结构、规则、模板和检查工具，不保存任何使用者资料。

## 包含内容

- `10-Action/`：承诺、活跃任务与候选事项
- `20-Card/`：Wiki 索引、来源摘要与概念卡
- `30-Time/`：愿景、12 周、周记与日志结构
- `x/`：待分诊 Raw Source 入口
- `.claude/rules/`：Agent 写入与文件格式规则
- `.claude/skills/` 与 `.agents/skills/`：从零改写的入门、开收场、写作模板与收件箱工作流
- `40-storage/`：模板与 Obsidian Bases
- `.claude/scripts/act-schema-lint.mjs`：只读结构检查

## 不包含内容

本仓库刻意不包含 USER、MEMORY、日志、任务、知识卡、剪藏、图片、聊天、凭据、服务器地址和 Git 历史。它不能代替私人资料备份。

## 使用方式

1. 克隆到一个新的空目录。
2. 复制 `.env` 以外的本机私有配置，或重新配置 Obsidian 插件。
3. 在本地创建自己的 `USER.md`、记忆、日志、任务与知识卡。
4. 运行 `node .claude/scripts/act-schema-lint.mjs` 检查结构。
5. 私人数据使用本地加密备份或私有仓库保存，不要提交到本公开仓库。

公开前必须执行 `./scripts/privacy-audit.sh`，并人工阅读 [PRIVACY.md](PRIVACY.md)。

本模板采用 MIT License；详见 [LICENSE](LICENSE)。它不包含 Obsidian、任何社区插件或私人资料。
