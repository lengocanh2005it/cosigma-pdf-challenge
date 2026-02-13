import { PdfStatus } from '@/modules/pdf/enums/pdf-status.enum';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'pdf' })
export class Pdf {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  fileName: string;

  @Column({ nullable: true })
  originalName: string;

  @Column()
  filePath: string;

  @Column({ type: 'int', nullable: true })
  fileSize: number;

  @Column({ nullable: true })
  mimeType: string;

  @Column({
    type: 'enum',
    enum: PdfStatus,
    default: PdfStatus.UPLOADED,
  })
  @Index()
  status: PdfStatus;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ nullable: true })
  indexedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
