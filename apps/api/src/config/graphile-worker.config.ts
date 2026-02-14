import { ConfigService } from '@nestjs/config';

export const graphileWorkerConfig = (configService: ConfigService) => ({
  connectionString: configService.get<string>('database_url', ''),
  schema: 'graphile_worker',
  pollInterval: 1000,
});
