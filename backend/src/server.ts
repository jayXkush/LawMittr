import http from 'http';
import app from './app';
import { env } from './config/env';
import { connectDatabase } from './config/database';
import { initSocketServer } from './socket/socketServer';
import { ensureAdminAccount } from './services/seedAdmin.service';

const startServer = async (): Promise<void> => {
  await connectDatabase();
  await ensureAdminAccount();

  const httpServer = http.createServer(app);
  initSocketServer(httpServer);

  httpServer.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT} [${env.NODE_ENV}]`);
  });
};

startServer();

