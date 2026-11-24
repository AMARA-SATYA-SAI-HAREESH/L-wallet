import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import morgan from 'morgan';
import routes from './routes/api';
import { errorHandler } from './middleware/errorHandler';
import logger from './utils/logger';

export function createServer() {
  const app = express();
  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(rateLimit({ windowMs: 60_000, max: 100 }));
  app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));
  app.use('/api', routes);
  app.use(errorHandler);
  return app;
}
