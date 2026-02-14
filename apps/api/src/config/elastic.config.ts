import { Client } from '@elastic/elasticsearch';
import { ConfigService } from '@nestjs/config';

export const elastichSearchConfig = (configService: ConfigService) => {
  return new Client({
    node: configService.get<string>('elastic.url', ''),
  });
};
