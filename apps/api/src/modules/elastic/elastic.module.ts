import { ElasticProvider } from '@/common/providers/elastic.provider';
import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ElasticService } from './elastic.service';
import { EmbeddingModule } from '@/modules/embedding/embedding.module';
import { EmbeddingService } from '@/modules/embedding/embedding.service';

@Global()
@Module({
  imports: [ConfigModule, EmbeddingModule],
  providers: [ElasticProvider, ElasticService, EmbeddingService],
  exports: [ElasticService],
})
export class ElasticModule {}
