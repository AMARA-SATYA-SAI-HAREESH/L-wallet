// backend/src/index.ts
import 'dotenv/config';
import { connectDB } from './config/db';
import { createServer } from './server';
import logger from './utils/logger';

const PORT = process.env.PORT ?? 3000;

async function main() {
  await connectDB();
  const app = createServer();
  app.listen(PORT, () => {
    logger.info(`L Wallet backend running on port ${PORT}`);
  });
}

main().catch((err) => {
  logger.error('Failed to start server', err);
  process.exit(1);
});
