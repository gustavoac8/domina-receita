import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('DominaReceita Médica API')
    .setDescription('API do sistema DominaReceita — MVP')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = Number(process.env.PORT) || 3000;
  await app.listen(port, '0.0.0.0');
  const dbUrl = process.env.DATABASE_URL || 'NOT_SET';
  const maskedDb = dbUrl.replace(/:([^:@]+)@/, ':***@');
  console.log(`API rodando em 0.0.0.0:${port} (PORT env=${process.env.PORT})`);
  console.log(`NODE_ENV: ${process.env.NODE_ENV || 'not_set'}`);
  console.log(`DATABASE_URL: ${maskedDb}`);
  console.log(`JWT_SECRET set: ${!!process.env.JWT_SECRET}`);
  console.log(`Swagger em /api/docs`);
  console.log(`Health em /health`);
  console.log(`DB check em /health/db`);
}
bootstrap().catch((err) => {
  console.error('FATAL bootstrap error:', err);
  process.exit(1);
});
