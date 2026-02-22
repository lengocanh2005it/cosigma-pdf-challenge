import { ElasticProvider } from '@/common/providers/elastic.provider';
import { graphileWorkerConfig } from '@/config/graphile-worker.config';
import { ElasticService } from '@/modules/elastic/elastic.service';
import { EmbeddingModule } from '@/modules/embedding/embedding.module';
import { Pdf } from '@/modules/pdf/entities/pdf.entity';
import { PdfService } from '@/modules/pdf/pdf.service';
import { DeletePdfTask } from '@/modules/worker/tasks/delete-pdf.task';
import { IndexPdfTask } from '@/modules/worker/tasks/index-pdf.task';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GraphileWorkerModule } from 'nestjs-graphile-worker';
import { WorkerService } from './worker.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Pdf]),
    GraphileWorkerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => graphileWorkerConfig(config),
    }),
    EmbeddingModule,
  ],
  providers: [
    WorkerService,
    IndexPdfTask,
    DeletePdfTask,
    ElasticProvider,
    PdfService,
    ElasticService,
  ],
  exports: [WorkerService],
})
export class WorkerModule {}
