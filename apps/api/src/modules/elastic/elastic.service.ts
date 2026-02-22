import {
  ELASTIC_CLIENT,
  ELASTIC_INDEX,
} from '@/common/constants/elastic.constants';
import { EmbeddingService } from '@/modules/embedding/embedding.service';
import { Client } from '@elastic/elasticsearch';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { PdfChunkDocument, RelatedResult } from '@packages/types';

@Injectable()
export class ElasticService implements OnModuleInit {
  constructor(
    @Inject(ELASTIC_CLIENT)
    private readonly client: Client,
    private readonly embeddingService: EmbeddingService,
  ) {}

  async onModuleInit() {
    const exists = await this.client.indices.exists({
      index: ELASTIC_INDEX,
    });

    if (!exists) {
      await this.client.indices.create({
        index: ELASTIC_INDEX,
        settings: {
          analysis: {
            analyzer: {
              content_analyzer: {
                type: 'standard',
              },
            },
          },
        },
        mappings: {
          properties: {
            pdfId: { type: 'keyword' },
            chunkId: { type: 'keyword' },
            chunkIndex: { type: 'integer' },
            pageNumber: { type: 'integer' },
            content: {
              type: 'text',
              analyzer: 'standard',
            },
            normalizedContent: {
              type: 'text',
              analyzer: 'standard',
            },
            anchorY: { type: 'float' },
            rectTop: { type: 'float' },
            rectLeft: { type: 'float' },
            rectWidth: { type: 'float' },
            rectHeight: { type: 'float' },
            embedding: {
              type: 'dense_vector',
              dims: 768,
              index: true,
              similarity: 'cosine',
            },
          },
        },
      });
    }
  }

  async bulkIndex(docs: PdfChunkDocument[]) {
    if (!docs.length) return;

    const docsWithEmbedding = await Promise.all(
      docs.map(async (doc) => ({
        ...doc,
        embedding: await this.embeddingService.embed(doc.content),
      })),
    );

    const body = docsWithEmbedding.flatMap((doc) => [
      { index: { _index: ELASTIC_INDEX, _id: doc.chunkId } },
      doc,
    ]);

    await this.client.bulk({
      refresh: true,
      body,
    });
  }

  async findRelated(
    pdfId: string,
    query: string,
    currentChunkId?: string,
    size = 10,
  ): Promise<RelatedResult[]> {
    const cleanedQuery = query.replace(/\s+/g, ' ').trim().toLowerCase();

    const queryEmbedding = await this.embeddingService.embed(cleanedQuery);

    let currentIndex: number | null = null;

    if (currentChunkId) {
      const current = await this.client
        .get<PdfChunkDocument>({
          index: ELASTIC_INDEX,
          id: currentChunkId,
        })
        .catch(() => null);

      currentIndex = current?._source?.chunkIndex ?? null;
    }

    const result = await this.client.search<PdfChunkDocument>({
      index: ELASTIC_INDEX,
      size,
      query: {
        script_score: {
          query: {
            bool: {
              filter: [{ term: { pdfId } }],
              should: [
                {
                  match_phrase: {
                    content: {
                      query: cleanedQuery,
                      boost: 3,
                    },
                  },
                },
                {
                  match: {
                    content: {
                      query: cleanedQuery,
                      operator: 'or',
                      minimum_should_match: '60%',
                      boost: 1.5,
                    },
                  },
                },
              ],
              minimum_should_match: 0,
            },
          },
          script: {
            source: `
    double bm25 = _score;
    bm25 = bm25 / (bm25 + 5.0);

    if (doc['embedding'].size() == 0) {
      return bm25;
    }

    double vectorScore = cosineSimilarity(params.queryVector, 'embedding');
    vectorScore = (vectorScore + 1.0) / 2.0;

    return (vectorScore * 0.7) + (bm25 * 0.3);
  `,
            params: {
              queryVector: queryEmbedding,
            },
          },
        },
      },
      highlight: {
        pre_tags: ['<em>'],
        post_tags: ['</em>'],
        fields: {
          content: {
            fragment_size: 180,
            number_of_fragments: 1,
          },
        },
      },
    });

    const hits = result.hits.hits;
    if (!hits.length) return [];

    const maxScore = hits[0]._score ?? 1;

    return hits.map((hit) => {
      const source = hit._source as PdfChunkDocument;
      const rawScore = hit._score ?? 0;

      const highlightText = hit.highlight?.content?.[0];

      let matchedWord = cleanedQuery;

      if (highlightText) {
        const matches = [...highlightText.matchAll(/<em>(.*?)<\/em>/g)];
        if (matches.length) {
          matchedWord = matches
            .map((m) => m[1])
            .join(' ')
            .toLowerCase();
        }
      }

      return {
        chunkId: source.chunkId,
        pdfId: source.pdfId,
        pageNumber: source.pageNumber,
        snippet: highlightText ?? source.content.slice(0, 180) + '...',
        matchedText: matchedWord,
        score: rawScore,
        confidence: Number((rawScore / maxScore).toFixed(3)),
        anchorY: source.anchorY,
        rectTop: source.rectTop,
        rectLeft: source.rectLeft,
        rectWidth: source.rectWidth,
        rectHeight: source.rectHeight,
      };
    });
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
