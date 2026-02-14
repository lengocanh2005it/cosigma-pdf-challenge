import { ElasticService } from '@/modules/elastic/elastic.service';
import { PdfService } from '@/modules/pdf/pdf.service';
import { PdfStatus } from '@/modules/pdf/enums/pdf-status.enum';
import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs/promises';
import type { JobHelpers } from 'graphile-worker';
import { Task, TaskHandler } from 'nestjs-graphile-worker';

@Injectable()
@Task('delete_pdf')
export class DeletePdfTask {
  private readonly logger = new Logger(DeletePdfTask.name);

  constructor(
    private readonly elasticService: ElasticService,
    private readonly pdfService: PdfService,
  ) {}

  @TaskHandler()
  async handler(payload: { pdfId: string }, _helpers: JobHelpers) {
    const { pdfId } = payload;

    this.logger.log(`Start deleting PDF ${pdfId}`);

    try {
      let pdf: any;
      try {
        pdf = await this.pdfService.findById(pdfId);
      } catch {
        this.logger.warn(`PDF ${pdfId} already deleted`);
        return;
      }

      if (pdf.status !== PdfStatus.DELETING) {
        this.logger.warn(
          `PDF ${pdfId} not in DELETING state. Current: ${pdf.status}`,
        );
        return;
      }

      await this.elasticService.deleteByPdfId(pdfId);

      if (pdf.filePath) {
        try {
          await fs.unlink(pdf.filePath);
        } catch {
          this.logger.warn(
            `File not found or already deleted: ${pdf.filePath}`,
          );
        }
      }

      await this.pdfService.hardDelete(pdfId);

      this.logger.log(`Successfully deleted PDF ${pdfId}`);
    } catch (error) {
      this.logger.error(`Failed to delete PDF ${pdfId}`, error?.stack || error);

      throw error;
    }
  }
}
