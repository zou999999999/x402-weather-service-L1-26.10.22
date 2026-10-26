import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverRoot = path.resolve(__dirname, '../../');

// 探测服务端收款配置路径（支持环境变量、工程根目录及外部安全目录）
const candidatePaths = [
  path.resolve(serverRoot, 'wallet.json'),
  path.resolve(serverRoot, '../wallet.json'),
  path.resolve(serverRoot, '../../wallet/wallet.json'),
  path.resolve(serverRoot, '../secrets/wallet.json')
];

function loadServerWalletJson() {
  for (const p of candidatePaths) {
    try {
      if (fs.existsSync(p)) {
        const raw = fs.readFileSync(p, 'utf8');
        const json = JSON.parse(raw);
        if (json.payToAddress) {
          return json;
        }
      }
    } catch {
      // 继续尝试下一候选路径
    }
  }
  return {};
}

/**
 * 获取服务端收款地址 (PAY_TO)
 * 【架构铁律】：服务端作为服务提供商，仅感知并暴露收款地址，绝不可感知或持有消费端私钥
 */
export function getPayToAddress() {
  let addr = process.env.PAY_TO;
  if (!addr) {
    const json = loadServerWalletJson();
    addr = json.payToAddress;
  }
  return addr ? addr.trim() : null;
}
