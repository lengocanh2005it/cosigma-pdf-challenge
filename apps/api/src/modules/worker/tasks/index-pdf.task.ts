import { ElasticService } from '@/modules/elastic/elastic.service';
import { PdfService } from '@/modules/pdf/pdf.service';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PdfChunkDocument } from '@packages/types';
import { randomUUID } from 'crypto';
import * as fs from 'fs/promises';
import type { JobHelpers } from 'graphile-worker';
import { Task, TaskHandler } from 'nestjs-graphile-worker';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

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

      const pdfEntity = await this.pdfService.findById(pdfId);
      const buffer = await fs.readFile(pdfEntity.filePath);
      const uint8Array = new Uint8Array(buffer);

      const loadingTask = pdfjsLib.getDocument({
        data: uint8Array,
        useWorkerFetch: false,
        isEvalSupported: false,
      });

      const pdfData = await loadingTask.promise;
      const totalPages = pdfData.numPages;

      const documents: PdfChunkDocument[] = [];
      let globalChunkIndex = 0;

      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        const page = await pdfData.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1 });
        const textContent = await page.getTextContent();

        const rawItems = (textContent.items as any[]).filter((i) =>
          i.str?.trim(),
        );

        if (!rawItems.length) continue;

        const items = rawItems.sort((a, b) => {
          const ay = a.transform[5];
          const by = b.transform[5];

          if (Math.abs(by - ay) > 2) {
            return by - ay;
          }

          return a.transform[4] - b.transform[4];
        });

        const lines: any[][] = [];
        let currentLine: any[] = [];
        let lastY: number | null = null;

        for (const item of items) {
          const y = item.transform[5];

          if (lastY === null || Math.abs(y - lastY) < 4) {
            currentLine.push(item);
          } else {
            lines.push(currentLine);
            currentLine = [item];
          }

          lastY = y;
        }

        if (currentLine.length) {
          lines.push(currentLine);
        }

        const paragraphs: any[][][] = [];
        let currentParagraph: any[][] = [];
        let lastLineY: number | null = null;

        for (const line of lines) {
          const lineY = line[0].transform[5];

          if (lastLineY === null || Math.abs(lastLineY - lineY) < 20) {
            currentParagraph.push(line);
          } else {
            paragraphs.push(currentParagraph);
            currentParagraph = [line];
          }

          lastLineY = lineY;
        }

        if (currentParagraph.length) {
          paragraphs.push(currentParagraph);
        }

        for (const paragraph of paragraphs) {
          const textParts: string[] = [];

          let minTop = Infinity;
          let maxBottom = -Infinity;
          let minLeft = Infinity;
          let maxRight = -Infinity;

          for (const line of paragraph) {
            for (const item of line) {
              const str = item.str?.trim();
              if (!str) continue;

              const [, , , , x, y] = item.transform;
              const width = item.width;
              const height = item.height;

              /* ---- normalize bounding box ---- */
              const top = 1 - (y + height) / viewport.height;
              const bottom = 1 - y / viewport.height;
              const left = x / viewport.width;
              const right = (x + width) / viewport.width;

              minTop = Math.min(minTop, top);
              maxBottom = Math.max(maxBottom, bottom);
              minLeft = Math.min(minLeft, left);
              maxRight = Math.max(maxRight, right);

              textParts.push(str);
            }
          }

          const content = textParts.join(' ').trim();
          if (!content) continue;

          /* ---- bounding box ---- */
          const rectTop = Math.max(0, Math.min(1, minTop));
          const rectLeft = Math.max(0, Math.min(1, minLeft));
          const rectWidth = Math.max(0, maxRight - minLeft);
          const rectHeight = Math.max(0, maxBottom - minTop);

          const anchorY = rectTop;

          documents.push({
            pdfId,
            chunkId: randomUUID(),
            chunkIndex: globalChunkIndex++,
            pageNumber: pageNum,
            content,
            normalizedContent: content.toLowerCase(),
            anchorY,
            rectTop,
            rectLeft,
            rectWidth,
            rectHeight,
          });
        }
      }

      if (!documents.length) {
        throw new InternalServerErrorException('PDF has no extractable text');
      }

      await this.pdfService.markIndexing(pdfId, documents.length, totalPages);

      const batchSize = 50;
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
}
