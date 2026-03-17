import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [configService.get<string>('RABBITMQ_URL')!],
      queue: 'school_events_queue',
      queueOptions: {
        // F21: durable queue survives broker restart — messages not lost
        durable: true,
      },
    },
  });

  await app.startAllMicroservices();
  await app.listen(process.env.PORT ?? 3005);
}
bootstrap();
