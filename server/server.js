import app from './api/index.js';
import { getPayToAddress } from './src/config/wallet.js';

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🌤️  [Server] x402 Weather Service running on port ${PORT}`);
  console.log(`👉 Health check: http://localhost:${PORT}/health`);
  console.log(`👉 Weather API:  http://localhost:${PORT}/api/weather?city=北京`);
  console.log(`👉 PayTo Wallet: ${getPayToAddress() || '⚠️ 尚未配置 (请在 PAY_TO 中填写)'}`);
  console.log(`===============================================`);
});

export default server;
