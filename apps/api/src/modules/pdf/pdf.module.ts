import { Pdf } from '@/modules/pdf/entities/pdf.entity';
import { WorkerModule } from '@/modules/worker/worker.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PdfController } from './pdf.controller';
import { PdfService } from './pdf.service';

@Module({
  imports: [TypeOrmModule.forFeature([Pdf]), WorkerModule],
  controllers: [PdfController],
  providers: [PdfService],
})
export class PdfModule {}
