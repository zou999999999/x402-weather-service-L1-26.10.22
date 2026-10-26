/**
 * @deprecated 根目录配置已正式完成架构解耦！
 * 请按端划分引用：
 * - 服务端专用配置：server/src/config/wallet.js (仅暴露收款公钥 getPayToAddress，无私钥能力)
 * - 客户端专用配置：client/src/config/wallet.js (管理 Agent 付款私钥 getPayerPrivateKey 与 getPayerAddress)
 */

export { getPayToAddress } from '../../server/src/config/wallet.js';
export { getPayerPrivateKey, getPayerAddress } from '../../client/src/config/wallet.js';
