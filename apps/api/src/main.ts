import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { WorkerService } from 'nestjs-graphile-worker';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  app.enableCors({
    origin: configService.get<string>('frontend_url', ''),
    credentials: true,
  });

  app.get(WorkerService).run();

  const PORT = configService.get<number>('port', 3001);

  await app.listen(PORT, () => {
    console.log(`Server is running on PORT ${PORT}`);
  });
}
void bootstrap();
