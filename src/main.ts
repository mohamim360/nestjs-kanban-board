import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import express from 'express';
import { AppModule } from './app.module';

const expressApp = express();
const adapter = new ExpressAdapter(expressApp);

let app: any;

async function createNestServer() {
  if (!app) {
    app = await NestFactory.create(AppModule, adapter, {
      logger: ['error', 'warn', 'log'],
    });

    app.useGlobalPipes(new ValidationPipe());

    app.enableCors({
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

    await app.init();
  }
  return app;
}

//  Run locally 
if (process.env.NODE_ENV !== 'production') {
  createNestServer().then(async (app) => {
    await app.listen(3000);
    console.log('🚀 Server running on http://localhost:3000');
  });
}

// Export for Vercel (serverless function)
export default async (req: any, res: any) => {
  await createNestServer();
  return expressApp(req, res);
};
