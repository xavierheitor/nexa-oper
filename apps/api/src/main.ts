import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configurar CORS para permitir comunicação com a aplicação web
  app.enableCors({
    origin:
      process.env.NODE_ENV === 'production'
        ? ['https://seu-dominio.com']
        : ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
  });

  const port = process.env.PORT ?? 3001;
  await app.listen(port);

  console.log(`🚀 API rodando na porta ${port}`);
  console.log(`📱 Ambiente: ${process.env.NODE_ENV ?? 'development'}`);
}

bootstrap().catch((error) => {
  console.error('Erro ao iniciar a API:', error);
  process.exit(1);
});
