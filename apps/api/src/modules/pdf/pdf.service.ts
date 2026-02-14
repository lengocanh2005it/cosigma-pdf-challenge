import { Pdf } from '@/modules/pdf/entities/pdf.entity';
import { PdfStatus } from '@/modules/pdf/enums/pdf-status.enum';
import { WorkerService } from '@/modules/worker/worker.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';

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

  async updatePdf(id: string, data: DeepPartial<Pdf>) {
    await this.pdfRepo.update(id, data);
  }

  async markProcessing(id: string) {
    await this.updatePdf(id, {
      status: PdfStatus.PROCESSING,
      processingStartedAt: new Date(),
      progress: 0,
      errorMessage: undefined,
    });
  }

  async markIndexing(id: string, totalChunks: number, totalPages: number) {
    await this.updatePdf(id, {
      status: PdfStatus.INDEXING,
      totalChunks,
      totalPages,
      indexedChunks: 0,
    });
  }

  async updateProgress(id: string, indexedChunks: number, totalChunks: number) {
    const progress =
      totalChunks > 0 ? Math.round((indexedChunks / totalChunks) * 100) : 0;

    await this.updatePdf(id, {
      indexedChunks,
      progress,
    });
  }

  async markCompleted(id: string) {
    await this.updatePdf(id, {
      status: PdfStatus.COMPLETED,
      progress: 100,
      indexedAt: new Date(),
    });
  }

  async markFailed(id: string, errorMessage: string) {
    await this.updatePdf(id, {
      status: PdfStatus.FAILED,
      errorMessage,
    });

    // atomic increment tránh race condition
    await this.pdfRepo.increment({ id }, 'retryCount', 1);
  }

  async resetForRetry(id: string) {
    await this.updatePdf(id, {
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
      retryCount: 0,
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

  async getPdfs() {
    return this.pdfRepo.find();
  }

  async deletePdf(id: string) {
    await this.findById(id);

    await this.updatePdf(id, {
      status: PdfStatus.DELETING,
    });

    await this.workerService.addDeletePdfJob(id);

    return {
      success: true,
      message: 'Delete job queued successfully!',
    };
  }

  async hardDelete(id: string) {
    await this.pdfRepo.delete({ id });
  }
}
