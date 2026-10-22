---
name: x402-project-ops
description: >-
  Use this skill whenever working on, extending, or delivering tasks for the x402 weather service project.
  Enforces mandatory rules for updating the project handover context document, maintaining zero-leakage security,
  and strictly ensuring GitHub repository purity (core code and essential docs only, no clutter/word/auxiliary scripts).
---

# x402 项目工程运维与提交规范准则 (Project Ops Skill)

本 Skill 沉淀了本项目全生命周期的核心工程铁律。任何后续接手的 AI Agent 必须在每次执行任务时无条件遵循以下流程：

---

## 📌 准则一：任务结束必须更新交接文档 (Mandatory Context Update)

**核心要求**：
每当完成用户的任何开发、配置、测试、对账或维护任务后，**必须在回复用户前同步更新工程根目录下的交接文档**：
👉 [`项目交接与全流程上下文总结.md`](file:///./项目交接与全流程上下文总结.md)

**更新内容包括但不限于**：
1. **状态变更**：新增的功能、修复的缺陷、调整的配置；
2. **链上凭据**：凡发起链上交易，必须补充新的交易哈希（Tx Hash）、区块高度及双方最新钱包余额；
3. **技术经验**：遇到的新坑点与经过实测验证的底层解决方案。

---

## 🛡️ 准则二：GitHub 上传严格准则（核心代码纯粹原则）

向 GitHub 远程仓库（`origin main`）推送代码时，必须严格执行**“纯净代码准则”**：

### 1. 允许且必须上传的内容（Core & Essential Docs）
- **核心业务源码**：
  - `api/index.js`（Express 核心服务与 x402 中间件）
  - `src/config/wallet.js`（钱包多层级安全探测）
  - `src/providers/`（Open-Meteo 与高德天气提供器抽象层）
  - `server.js`（本地 3000 端口服务入口）
- **Agent 客户端与链上审计程序**：
  - `scripts/client.js`（Agent 未付款探测、安全核查与 EIP-3009 授权签名）
  - `scripts/reconcile.js`（直连 Base Sepolia 节点的只读对账审计）
- **必要且关键的项目说明与环境模板**：
  - `README.md`（项目使用、架构说明与 Agent 快速接入指南）
  - `package.json` & `package-lock.json`（核心依赖清单）
  - `vercel.json`（云端 Serverless 路由无损还原规则）
  - `wallet.example.json`（根目录公开钱包配置模版）
  - `.env.example`（根目录公开环境变量配置模版）
  - `启动本地天气服务.bat`（Windows 编码规范化的启动脚本）
  - `项目交接与全流程上下文总结.md`（项目全局上下文总结）

### 2. 绝对严禁上传的内容（Zero Clutter Policy）
- 🚫 **严禁上传二进制汇报文档**：`*.docx`、`*.pdf` 等 Word/PDF 文档一律通过 `.gitignore` 排除，仅在本地电脑保留；
- 🚫 **严禁上传冗杂的非业务辅助代码**：如本地用于排版 Word 报告的 `scripts/generate_docx.py` 等与服务运行无关的 Python 脚本，严禁推送到线上，确保 GitHub 仓库的语言纯度维持 100% 纯正 JavaScript；
- 🚫 **严禁上传真实私钥与配置**：`wallet.json`、`secrets/wallet.json`、`.env` 严禁提交；
- 🚫 **严禁暴露个人本地磁盘绝对路径**：所有代码、错误提示与文档中的路径必须为 `./` 通用相对路径，严禁出现个人磁盘盘符（如 `D:\`）与个人姓名拼音。

---

## 🔑 准则三：Git 提交身份规范

所有向该仓库提交的代码，必须统一使用已绑定的专属 GitHub 身份：
```bash
git config user.name "zou999999999"
git config user.email "zoujiancheng2007@gmail.com"
```
确保 GitHub 网页上的提交记录完整显示专属头像并正确统计贡献度。

---

## ⚙️ 准则四：测试网络与资金安全守则

1. **结算网络**：Base Sepolia 测试网 (`eip155:84532`)；
2. **结算代币**：Circle 官方测试网 USDC (`0x036CbD53842c5426634e7929541eC2318f3dCF7e`)；
3. **免 Gas 机制**：由公共 Facilitator (`https://x402.org/facilitator`) 代付 Gas，付款钱包无需持有测试 ETH；
4. **人工确认防误付**：运行客户端时，若未显式指定 `CONFIRM=yes`，程序必须停留在第 2 步等待人工审核账单。
