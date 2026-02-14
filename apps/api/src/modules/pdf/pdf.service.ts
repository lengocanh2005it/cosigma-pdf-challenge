import { Pdf } from '@/modules/pdf/entities/pdf.entity';
import { PdfStatus } from '@/modules/pdf/enums/pdf-status.enum';
import { WorkerService } from '@/modules/worker/worker.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class PdfService {
  constructor(
    @InjectRepository(Pdf)
    private readonly pdfRepo: Repository<Pdf>,
    private readonly workerService: WorkerService,
  ) {}

  async create(data: Partial<Pdf>) {
    const pdf = this.pdfRepo.create(data);
    return this.pdfRepo.save(pdf);
  }

  async findById(id: string) {
    const pdf = await this.pdfRepo.findOne({ where: { id } });
    if (!pdf) throw new NotFoundException('PDF not found');
    return pdf;
  }

  async getStatus(id: string) {
    const pdf = await this.findById(id);

    return {
      id: pdf.id,
      status: pdf.status,
      progress: pdf.progress,
      errorMessage: pdf.errorMessage,
    };
  }

  async markProcessing(id: string) {
    await this.pdfRepo.update(id, {
      status: PdfStatus.PROCESSING,
      processingStartedAt: new Date(),
      progress: 0,
      errorMessage: undefined,
    });
  }

  async markIndexing(id: string, totalChunks: number) {
    await this.pdfRepo.update(id, {
      status: PdfStatus.INDEXING,
      totalChunks,
      indexedChunks: 0,
      progress: 0,
    });
  }

  async updateProgress(id: string, indexedChunks: number) {
    const pdf = await this.findById(id);

    const progress =
      pdf.totalChunks && pdf.totalChunks > 0
        ? (indexedChunks / pdf.totalChunks) * 100
        : 0;

    await this.pdfRepo.update(id, {
      indexedChunks,
      progress,
    });
  }

  async markCompleted(id: string) {
    await this.pdfRepo.update(id, {
      status: PdfStatus.COMPLETED,
      progress: 100,
      indexedAt: new Date(),
    });
  }

  async markFailed(id: string, errorMessage: string) {
    const pdf = await this.findById(id);

    await this.pdfRepo.update(id, {
      status: PdfStatus.FAILED,
      errorMessage,
      retryCount: pdf.retryCount + 1,
    });
  }

  async resetForRetry(id: string) {
    await this.pdfRepo.update(id, {
      status: PdfStatus.UPLOADED,
      progress: 0,
      indexedChunks: 0,
      errorMessage: undefined,
    });
  }

  async handleUploadedPdf(file: Express.Multer.File) {
    const pdf = this.pdfRepo.create({
      fileName: file.filename,
      originalName: file.originalname,
      filePath: file.path,
      fileSize: file.size,
      mimeType: file.mimetype,
      status: PdfStatus.UPLOADED,
      progress: 0,
    });

    const savedPdf = await this.pdfRepo.save(pdf);

    await this.workerService.addIndexPdfJob(savedPdf.id);

    return {
      id: savedPdf.id,
      fileName: savedPdf.originalName,
      status: savedPdf.status,
      progress: savedPdf.progress,
    };
  }
}
