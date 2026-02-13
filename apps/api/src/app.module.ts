import { databaseConfig } from '@/config/database.config';
import envConfig from '@/config/env.config';
import { graphileWorkerConfig } from '@/config/graphile-worker.config';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GraphileWorkerModule } from 'nestjs-graphile-worker';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { PdfModule } from '@/modules/pdf/pdf.module';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/files',
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [envConfig],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        databaseConfig(configService),
    }),
    GraphileWorkerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => graphileWorkerConfig(config),
    }),
    PdfModule,
  ],
})
export class AppModule {}
