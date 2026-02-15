import { PdfStatus } from '@packages/types';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'pdf' })
@Index(['status'])
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
  status: PdfStatus;

  @Column({ type: 'float', default: 0 })
  progress: number;

  @Column({ type: 'int', nullable: true })
  totalPages: number;

  @Column({ type: 'int', nullable: true })
  totalChunks: number;

  @Column({ type: 'int', default: 0 })
  indexedChunks: number;

  @Column({ type: 'int', default: 0 })
  retryCount: number;

  @Column({ nullable: true })
  processingStartedAt: Date;

  @Column({ nullable: true })
  indexedAt: Date;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ type: 'int', default: 1 })
  version: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
