import { ConfigService } from '@nestjs/config';

export const databaseConfig = (configService: ConfigService) => ({
  type: 'postgres' as 'postgres',
  url: configService.get<string>('database_url', ''),
  autoLoadEntities: true,
  synchronize: true,
});
