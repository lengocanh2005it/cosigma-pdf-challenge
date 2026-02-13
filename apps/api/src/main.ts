import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  app.enableCors({
    origin: configService.get<string>('frontend_url', ''),
    credentials: true,
  });

  const PORT = configService.get<number>('port', 3001);

  await app.listen(PORT, () => {
    console.log(`Server is running on PORT ${PORT}`);
  });
}
void bootstrap();
