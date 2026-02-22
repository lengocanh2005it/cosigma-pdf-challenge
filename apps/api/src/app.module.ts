import { databaseConfig } from '@/config/database.config';
import envConfig from '@/config/env.config';
import { ElasticModule } from '@/modules/elastic/elastic.module';
import { EmbeddingModule } from '@/modules/embedding/embedding.module';
import { EventsModule } from '@/modules/events/events.module';
import { PdfModule } from '@/modules/pdf/pdf.module';
import { WorkerModule } from '@/modules/worker/worker.module';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';

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
    PdfModule,
    ElasticModule,
    WorkerModule,
    EventsModule,
    EmbeddingModule,
  ],
})
export class AppModule {}
