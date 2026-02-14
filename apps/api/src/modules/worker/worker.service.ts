import { Injectable } from '@nestjs/common';
import { WorkerService as WsService } from 'nestjs-graphile-worker';

@Injectable()
export class WorkerService {
  constructor(private readonly worker: WsService) {}

  async addIndexPdfJob(pdfId: string) {
    await this.worker.addJob('index_pdf', { pdfId });
  }

  async addDeletePdfJob(pdfId: string) {
    await this.worker.addJob('delete_pdf', { pdfId });
  }
}
