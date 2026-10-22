import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../');

// 支持多个安全路径检测（优先检测父级目录、工程根目录及 secrets 目录）
const candidatePaths = [
  path.resolve(projectRoot, '../wallet/wallet.json'),
  path.resolve(projectRoot, 'wallet.json'),
  path.resolve(projectRoot, 'secrets/wallet.json'),
  path.resolve(projectRoot, '../secrets/wallet.json')
];

function loadWalletJson() {
  for (const p of candidatePaths) {
    try {
      if (fs.existsSync(p)) {
        const raw = fs.readFileSync(p, 'utf8');
        const json = JSON.parse(raw);
        // 如果找到了有内容的配置则返回
        if (json.payerPrivateKey || json.payerAddress || json.payToAddress) {
          return json;
        }
      }
    } catch (err) {
      // 继续尝试下一个候选路径
    }
  }
  return {};
}

/**
 * 获取付款方私钥（自动补齐 0x，不打印任何私钥内容）
 */
export function getPayerPrivateKey() {
  let key = process.env.PAYER_PRIVATE_KEY;
  if (!key) {
    const json = loadWalletJson();
    key = json.payerPrivateKey;
  }
  if (!key || typeof key !== 'string') {
    return null;
  }
  key = key.trim();
  if (key && !key.startsWith('0x')) {
    key = `0x${key}`;
  }
  return key;
}

/**
 * 获取付款方公开地址
 */
export function getPayerAddress() {
  let addr = process.env.PAYER_ADDRESS;
  if (!addr) {
    const json = loadWalletJson();
    addr = json.payerAddress;
  }
  return addr ? addr.trim() : null;
}

/**
 * 获取服务端收款地址 (PAY_TO)
 */
export function getPayToAddress() {
  let addr = process.env.PAY_TO;
  if (!addr) {
    const json = loadWalletJson();
    addr = json.payToAddress;
  }
  return addr ? addr.trim() : null;
}
