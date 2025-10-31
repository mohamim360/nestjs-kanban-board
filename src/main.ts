import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe());

  // Enhanced CORS configuration
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:5173', 
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'Access-Control-Request-Method',
      'Access-Control-Request-Headers',
    ],
    exposedHeaders: ['Authorization', 'Content-Length', 'X-Total-Count'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  await app.listen(process.env.PORT || 3000);
  console.log(
    `🚀 Backend running on: http://localhost:${process.env.PORT || 3000}`,
  );
}

bootstrap().catch((error: Error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
