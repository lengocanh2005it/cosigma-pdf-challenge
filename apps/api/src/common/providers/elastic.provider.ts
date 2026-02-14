import { ELASTIC_CLIENT } from '@/common/constants/elastic.constants';
import { Client } from '@elastic/elasticsearch';
import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export const ElasticProvider: Provider = {
  provide: ELASTIC_CLIENT,
  inject: [ConfigService],
  useFactory: (config: ConfigService) => {
    return new Client({
      node: config.get<string>('elastic.url', '') || 'http://localhost:9200',
    });
  },
};
