# 项目开发与 Git 提交铁律 (Project Rules for AI Agents)

所有接手本项目的 AI Agent 必须无条件遵守以下核心规则：

## 1. 每次任务完成必须更新交接文档
在每次执行完用户的代码编写、调试、测试或配置任务后，必须同步更新：
👉 [`项目交接与全流程上下文总结.md`](file:///./项目交接与全流程上下文总结.md)
包含：新增状态、最新链上交易哈希（Tx Hash）、钱包余额变动与技术避坑经验。

## 2. GitHub 推送纯粹性原则（严禁上传冗杂代码）
向 GitHub 远程仓库推送代码时：
- ✅ **允许且必须上传**：核心业务源码（`api/`、`src/`、`server.js`）、Agent 客户端（`scripts/client.js`）、对账程序（`scripts/reconcile.js`）、启动脚本（`启动本地天气服务.bat`）、必要说明文档（`README.md`、`项目交接与全流程上下文总结.md`）及配置模版（`package.json`、`vercel.json`、`wallet.example.json`、`.env.example`）。
- 🚫 **绝对禁止上传**：
  - 严禁上传本地辅助生成报告脚本（如 `scripts/generate_docx.py` 等非核心业务 Python 脚本）；
  - 严禁上传任何 Word/PDF 二进制文档（`*.docx`、`*.pdf`）；
  - 严禁上传私钥文件（`wallet.json`）与敏感环境变量（`.env`）；
  - 严禁在代码与文档中暴露个人本地磁盘绝对路径（必须使用 `./` 相对路径）。
- 保持 GitHub 仓库语言纯度为 100% JavaScript (Node.js)。

## 3. 提交身份强制绑定
所有 Git 提交必须使用：
- 用户名：`zou999999999`
- 邮箱：`zoujiancheng2007@gmail.com`
