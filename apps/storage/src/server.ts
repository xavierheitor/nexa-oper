import express from 'express';
import cors from 'cors';
import { config } from './config/env';
import { authMiddleware } from './middlewares/auth';
import { errorHandler } from './middlewares/error-handler';
import { uploadRouter } from './routes/upload';
import { staticRouter } from './routes/static';

const app = express();

// Middlewares globais
app.use(cors({ origin: config.corsOrigins }));
app.use(express.json());

// Rotas públicas (visualização)
app.use('/photos', staticRouter);

// Rotas protegidas (upload)
app.use('/upload', authMiddleware, uploadRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'storage' });
});

// Error handler
app.use(errorHandler);

const port = config.port;
const host = process.env.HOST || '0.0.0.0';

app.listen(port, host, () => {
  console.log(`🚀 Storage service running on ${host}:${port}`);
  console.log(`📁 Upload dir: ${config.uploadDir}`);
  console.log(`🔐 Auth key: ${config.storageKey.substring(0, 10)}...`);

  // Mostrar IP local para acesso da rede
  if (host === '0.0.0.0') {
    try {
      const { execSync } = require('child_process');
      const networkIP = execSync("ifconfig | grep 'inet ' | grep -v 127.0.0.1 | awk '{print $2}' | head -1")
        .toString()
        .trim();
      if (networkIP) {
        console.log(`📱 Access from your network: http://${networkIP}:${port}/`);
      }
    } catch (error) {
      // Ignore error getting IP
    }
  }
});

