import {
  ELASTIC_CLIENT,
  ELASTIC_INDEX,
} from '@/common/constants/elastic.constants';
import { PdfChunkDocument } from '@/common/interfaces/elastic.interface';
import { Client } from '@elastic/elasticsearch';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';

@Injectable()
export class ElasticService implements OnModuleInit {
  constructor(
    @Inject(ELASTIC_CLIENT)
    private readonly client: Client,
  ) {}

  async onModuleInit() {
    const exists = await this.client.indices.exists({
      index: ELASTIC_INDEX,
    });

    if (!exists) {
      await this.client.indices.create({
        index: ELASTIC_INDEX,
        mappings: {
          properties: {
            pdfId: { type: 'keyword' },
            chunkId: { type: 'keyword' },
            content: { type: 'text' },
            pageNumber: { type: 'integer' },
            embedding: {
              type: 'dense_vector',
              dims: 1536,
              index: true,
              similarity: 'cosine',
            },
          },
        },
      });
    }
  }

  async indexChunk(doc: PdfChunkDocument) {
    await this.client.index({
      index: ELASTIC_INDEX,
      id: doc.chunkId,
      document: doc,
      refresh: true,
    });
  }

  async bulkIndex(docs: PdfChunkDocument[]) {
    if (!docs.length) return;

    const body = docs.flatMap((doc) => [
      { index: { _index: ELASTIC_INDEX, _id: doc.chunkId } },
      doc,
    ]);

    await this.client.bulk({
      refresh: true,
      body,
    });
  }

  async searchBM25(query: string, size = 10) {
    const result = await this.client.search<PdfChunkDocument>({
      index: ELASTIC_INDEX,
      size,
      query: {
        match: {
          content: {
            query,
            operator: 'and',
          },
        },
      },
    });

    return result.hits.hits.map((hit) => ({
      ...hit._source,
      score: hit._score,
    }));
  }

  async searchHybrid(query: string, embedding: number[], size = 10) {
    const result = await this.client.search<PdfChunkDocument>({
      index: ELASTIC_INDEX,
      size,
      query: {
        match: {
          content: {
            query,
            boost: 1,
          },
        },
      },
      knn: {
        field: 'embedding',
        query_vector: embedding,
        k: size,
        num_candidates: 100,
        boost: 2,
      },
    });

    return result.hits.hits.map((hit) => ({
      ...hit._source,
      score: hit._score,
    }));
  }

  async deleteByPdfId(pdfId: string) {
    await this.client.deleteByQuery({
      index: ELASTIC_INDEX,
      query: {
        term: { pdfId },
      },
      refresh: true,
    });
  }
}
