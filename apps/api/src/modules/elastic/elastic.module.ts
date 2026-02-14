import { ElasticProvider } from '@/common/providers/elastic.provider';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ElasticService } from './elastic.service';

@Module({
  imports: [ConfigModule],
  providers: [ElasticProvider, ElasticService],
  exports: [ElasticService],
})
export class ElasticModule {}
