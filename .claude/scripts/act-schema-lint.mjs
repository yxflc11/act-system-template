#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const vaultRoot = path.resolve(scriptDir, "../..");
let passes = 0;
let failures = 0;

const absolute = (relative) => path.join(vaultRoot, relative);
const exists = (relative) => fs.existsSync(absolute(relative));
const read = (relative) => fs.readFileSync(absolute(relative), "utf8");

function pass(message) {
  passes += 1;
  console.log(`[PASS] ${message}`);
}

function fail(message) {
  failures += 1;
  console.log(`[FAIL] ${message}`);
}

function listFiles(root) {
  const start = absolute(root);
  if (!fs.existsSync(start)) return [];
  const results = [];
  const stack = [start];
  while (stack.length > 0) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      if ([".git", "node_modules"].includes(entry.name)) continue;
      const target = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(target);
      else if (entry.isFile()) results.push(target);
    }
  }
  return results.sort();
}

function frontmatterKeys(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) return [];
  return match[1]
    .split(/\r?\n/)
    .map((line) => line.match(/^([^\s:#][^:]*):(?:\s|$)/)?.[1]?.trim())
    .filter(Boolean);
}

console.log(`ACT Public Template Lint · ${vaultRoot}`);

const requiredDirectories = [
  "10-Action/11-Focus-聚焦承诺",
  "10-Action/12-Active-活跃跟进",
  "10-Action/13-Maybe-将来也许",
  "20-Card/21-IndexCard-索引卡",
  "20-Card/22-BibCard-阅读卡",
  "20-Card/23-MainCard-核心卡",
  "30-Time/31-Vision-愿景",
  "30-Time/32-12Week-十二周",
  "30-Time/33-Weekly-每周",
  "30-Time/34-Daily-日志",
  "40-storage/42-template-模板",
  "40-storage/44-base-数据视图",
  "x",
  "x-AI-Studio",
  "笔记同步助手",
];
const missingDirectories = requiredDirectories.filter((item) => !exists(item));
if (missingDirectories.length === 0) pass("ACT 目录骨架完整");
else fail(`缺少目录：${missingDirectories.join("、")}`);

const schemaFiles = ["AGENTS.md", ".claude/CLAUDE.md"];
const schemaMarkers = [
  "Karpathy 式知识层与权限",
  "30-Time/34-Daily-日志/",
  "`x/`",
  "`笔记同步助手/`",
  "`20-Card/`",
  "Wiki 由 LLM 维护",
  "**Ingest**",
  "**Query**",
  "**Lint**",
  "用户当前明确指令",
];
for (const schemaFile of schemaFiles) {
  if (!exists(schemaFile)) {
    fail(`缺少规则入口：${schemaFile}`);
    continue;
  }
  const missing = schemaMarkers.filter((marker) => !read(schemaFile).includes(marker));
  if (missing.length === 0) pass(`${schemaFile} 包含公开 Schema 标记`);
  else fail(`${schemaFile} 缺少：${missing.join("、")}`);
}
if (schemaFiles.every(exists) && read(schemaFiles[0]) === read(schemaFiles[1])) {
  pass("AGENTS.md 与 .claude/CLAUDE.md 一致");
} else {
  fail("两个 Agent 规则入口不一致");
}

const wikiControls = ["20-Card/index.md", "20-Card/overview.md", "20-Card/log.md"];
for (const file of wikiControls) {
  if (!exists(file)) {
    fail(`缺少 Wiki 控制文件：${file}`);
    continue;
  }
  const keys = frontmatterKeys(read(file));
  if (keys.includes("创建日期") && keys.includes("AI 备注")) pass(`${file} frontmatter 合规`);
  else fail(`${file} 缺少创建日期或 AI 备注`);
}

const publicReadmes = [
  "10-Action/README.md",
  "20-Card/README.md",
  "30-Time/README.md",
  "40-storage/README.md",
  "x-AI-Studio/README.md",
];
const missingExperience = publicReadmes.filter(
  (file) => !exists(file) || !read(file).includes("## Codex 经验积累"),
);
if (missingExperience.length === 0) pass("主要 README 保留局部规则区");
else fail(`README 缺少局部规则区：${missingExperience.join("、")}`);

const pairedSkills = [
  "getting-started",
  "writing-template",
  "daily-start",
  "daily-close",
  "inbox-triage",
  "inbox-archive",
];
for (const skill of pairedSkills) {
  const first = `.claude/skills/${skill}/SKILL.md`;
  const second = `.agents/skills/${skill}/SKILL.md`;
  if (exists(first) && exists(second) && read(first) === read(second)) {
    pass(`${skill} 双份安装一致`);
  } else {
    fail(`${skill} 双份安装缺失或漂移`);
  }
}

const forbiddenExactFiles = [
  ".env",
  ".claude/USER.md",
  ".claude/MEMORY.md",
];
const presentForbidden = forbiddenExactFiles.filter(exists);
if (presentForbidden.length === 0) pass("未包含 USER、MEMORY 或 .env");
else fail(`包含私人文件：${presentForbidden.join("、")}`);

const forbiddenNames = [/\.jsonl$/, /state\.db$/, /\.pem$/, /\.key$/];
const forbiddenData = listFiles(".")
  .map((file) => path.relative(vaultRoot, file))
  .filter((file) => forbiddenNames.some((pattern) => pattern.test(file)));
if (forbiddenData.length === 0) pass("未包含 journal、数据库或密钥文件");
else fail(`包含运行数据或密钥：${forbiddenData.join("、")}`);

const privateContentRoots = [
  "10-Action",
  "30-Time",
  "x",
  "x-AI-Studio",
  "笔记同步助手",
];
const unexpectedPrivateContent = privateContentRoots
  .flatMap(listFiles)
  .map((file) => path.relative(vaultRoot, file))
  .filter((file) => !/(^|\/)README\.md$/.test(file) && !/(^|\/)\.gitkeep$/.test(file));
if (unexpectedPrivateContent.length === 0) pass("私人内容目录仅含说明与占位文件");
else fail(`私人内容目录出现真实文件：${unexpectedPrivateContent.join("、")}`);

const contentFiles = listFiles(".").filter(
  (file) => !file.endsWith("privacy-audit.sh") && !file.endsWith("act-schema-lint.mjs"),
);
const forbiddenContentPatterns = [
  /\/Users\/[A-Za-z0-9._-]+/,
  /\/home\/[A-Za-z0-9._-]+/,
  /\/root\//,
  /(?:ghp_|github_pat_|sk-|AIza|xox[baprs]-)[A-Za-z0-9_-]{12,}/,
  /BEGIN (?:RSA |OPENSSH |EC |DSA )?PRIVATE KEY/,
];
const contentHits = [];
for (const file of contentFiles) {
  let content;
  try {
    content = fs.readFileSync(file, "utf8");
  } catch {
    continue;
  }
  if (forbiddenContentPatterns.some((pattern) => pattern.test(content))) {
    contentHits.push(path.relative(vaultRoot, file));
  }
}
if (contentHits.length === 0) pass("未发现绝对个人路径或高风险凭据格式");
else fail(`发现潜在隐私内容：${contentHits.join("、")}`);

console.log(`[SUMMARY] pass=${passes} fail=${failures}`);
process.exitCode = failures === 0 ? 0 : 1;
