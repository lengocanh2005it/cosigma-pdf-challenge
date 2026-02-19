import { ElasticProvider } from '@/common/providers/elastic.provider';
import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ElasticService } from './elastic.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [ElasticProvider, ElasticService],
  exports: [ElasticService],
})
export class ElasticModule {}
