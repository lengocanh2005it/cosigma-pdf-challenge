import { EventBusService } from '@/modules/events/event-bus.service';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  MessageEvent,
  Param,
  ParseUUIDPipe,
  Post,
  Sse,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { map, Observable } from 'rxjs';
import { PdfService } from './pdf.service';

@Controller('pdf')
export class PdfController {
  constructor(
    private readonly pdfService: PdfService,
    private readonly eventBus: EventBusService,
  ) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, uniqueName + extname(file.originalname));
        },
      }),
      fileFilter: (req, file, cb) => {
        if (file.mimetype !== 'application/pdf') {
          return cb(new BadRequestException('Only PDF files allowed'), false);
        }
        cb(null, true);
      },
      limits: {
        fileSize: 10 * 1024 * 1024,
      },
    }),
  )
  async uploadPdf(@UploadedFile() file: Express.Multer.File) {
    return this.pdfService.handleUploadedPdf(file);
  }

  @Get()
  async getPdfs() {
    return this.pdfService.getPdfs();
  }

  @Get(':id')
  async getPdf(@Param('id', ParseUUIDPipe) id: string) {
    return this.pdfService.findById(id);
  }

  @Delete(':id')
  async deletePdf(@Param('id', ParseUUIDPipe) id: string) {
    return this.pdfService.deletePdf(id);
  }

  @Sse('events/stream')
  sse(): Observable<MessageEvent> {
    return this.eventBus.on('pdf').pipe(map((data) => ({ data })));
  }

  @Post(':id/find-related')
  async findRelated(@Param('id') pdfId: string, @Body('query') query: string) {
    return this.pdfService.findRelated(pdfId, query);
  }
}
