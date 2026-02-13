import { Pdf } from '@/modules/pdf/entities/pdf.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PdfController } from './pdf.controller';
import { PdfService } from './pdf.service';

@Module({
  imports: [TypeOrmModule.forFeature([Pdf])],
  controllers: [PdfController],
  providers: [PdfService],
})
export class PdfModule {}
