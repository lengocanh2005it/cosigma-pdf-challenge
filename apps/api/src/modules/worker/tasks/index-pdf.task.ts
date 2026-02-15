import { ElasticService } from '@/modules/elastic/elastic.service';
import { PdfService } from '@/modules/pdf/pdf.service';
import { Injectable, Logger } from '@nestjs/common';
import { PdfChunkDocument } from '@packages/types';
import { randomUUID } from 'crypto';
import * as fs from 'fs/promises';
import type { JobHelpers } from 'graphile-worker';
import { Task, TaskHandler } from 'nestjs-graphile-worker';
import { PDFParse } from 'pdf-parse';

@Injectable()
@Task('index_pdf')
export class IndexPdfTask {
  private readonly logger = new Logger(IndexPdfTask.name);

  constructor(
    private readonly elasticService: ElasticService,
    private readonly pdfService: PdfService,
  ) {}

  @TaskHandler()
  async handler(payload: { pdfId: string }, _helpers: JobHelpers) {
    const { pdfId } = payload;

    this.logger.log(`Start indexing PDF ${pdfId}`);

    try {
      await this.pdfService.markProcessing(pdfId);

      const pdf = await this.pdfService.findById(pdfId);
      const buffer = await fs.readFile(pdf.filePath);

      const parser = new PDFParse({ data: buffer });
      const result = await parser.getText();

      const totalPages = result.pages?.length ?? 0;

      if (!result.text?.trim()) {
        throw new Error('PDF has no extractable text');
      }

      const documents: PdfChunkDocument[] = [];

      result.pages.forEach((page, pageIndex) => {
        const pageChunks = this.chunkText(page.text, 1000, 150);

        pageChunks.forEach((content, chunkIndex) => {
          documents.push({
            pdfId,
            chunkId: randomUUID(),
            chunkIndex,
            pageNumber: pageIndex + 1,
            content,
          });
        });
      });

      await this.pdfService.markIndexing(pdfId, documents.length, totalPages);

      const batchSize = 100;
      let indexedChunks = 0;

      for (let i = 0; i < documents.length; i += batchSize) {
        const batch = documents.slice(i, i + batchSize);

        await this.elasticService.bulkIndex(batch);

        indexedChunks += batch.length;

        await this.pdfService.updateProgress(
          pdfId,
          indexedChunks,
          documents.length,
        );
      }

      await this.pdfService.markCompleted(pdfId);

      this.logger.log(`Finished indexing PDF ${pdfId}`);
    } catch (error) {
      this.logger.error(`Indexing failed for ${pdfId}`, error?.stack || error);

      await this.pdfService.markFailed(
        pdfId,
        error?.message || 'Unknown error',
      );

      throw error;
    }
  }

  private chunkText(
    text: string,
    chunkSize: number,
    overlap: number,
  ): string[] {
    const cleaned = text.replace(/\s+/g, ' ').trim();

    const chunks: string[] = [];
    let start = 0;

    while (start < cleaned.length) {
      const end = start + chunkSize;
      chunks.push(cleaned.slice(start, end));
      start = end - overlap;
    }

    return chunks;
  }
}
