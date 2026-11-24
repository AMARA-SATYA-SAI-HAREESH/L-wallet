// src/index.ts
import { createServer } from './server';

const port = process.env.PORT || 4000;
createServer().listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`);
});
