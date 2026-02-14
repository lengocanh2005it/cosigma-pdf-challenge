import { ElasticService } from '@/modules/elastic/elastic.service';
import { Injectable, Logger } from '@nestjs/common';
import type { JobHelpers } from 'graphile-worker';
import { Task, TaskHandler } from 'nestjs-graphile-worker';

@Injectable()
@Task('delete_pdf')
export class DeletePdfTask {
  private logger = new Logger(DeletePdfTask.name);

  constructor(private readonly elasticService: ElasticService) {}

  @TaskHandler()
  async handler(payload: { pdfId: string }, _helpers: JobHelpers) {
    this.logger.log(`Deleting PDF ${payload.pdfId} from index`);

    await this.elasticService.deleteByPdfId(payload.pdfId);

    this.logger.log(`Deleted PDF ${payload.pdfId} from index`);
  }
}
