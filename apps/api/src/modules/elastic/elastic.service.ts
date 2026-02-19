import {
  ELASTIC_CLIENT,
  ELASTIC_INDEX,
} from '@/common/constants/elastic.constants';
import { Client } from '@elastic/elasticsearch';
import { QueryDslQueryContainer } from '@elastic/elasticsearch/lib/api/typesWithBodyKey';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { PdfChunkDocument, RelatedResult } from '@packages/types';

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
            content: {
              type: 'text',
              analyzer: 'content_analyzer',
              fields: {
                raw: {
                  type: 'keyword',
                  ignore_above: 32766,
                },
              },
            },
            pageNumber: { type: 'integer' },
          },
        },
      });
    }
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

  private buildRelatedQuery(
    pdfId: string,
    query: string,
  ): QueryDslQueryContainer {
    const cleanedQuery = query.replace(/\s+/g, ' ').trim();
    const wordCount = cleanedQuery.split(/\s+/).length;
    const enableFuzzy = wordCount <= 5;

    return {
      function_score: {
        query: {
          bool: {
            filter: [{ term: { pdfId } }],
            must_not: [
              {
                term: {
                  'content.raw': cleanedQuery,
                },
              },
            ],
            should: [
              {
                match_phrase: {
                  content: {
                    query: cleanedQuery,
                    boost: 5,
                  },
                },
              },
              {
                match: {
                  content: {
                    query: cleanedQuery,
                    operator: 'and',
                    boost: 3,
                  },
                },
              },
              {
                match: {
                  content: {
                    query: cleanedQuery,
                    operator: 'or',
                    minimum_should_match: '70%',
                    boost: 1.5,
                  },
                },
              },
              ...(enableFuzzy
                ? [
                    {
                      match: {
                        content: {
                          query: cleanedQuery,
                          fuzziness: 'AUTO',
                          boost: 0.5,
                        },
                      },
                    },
                  ]
                : []),
            ],
            minimum_should_match: 1,
          },
        },
        boost_mode: 'sum',
        score_mode: 'sum',
      },
    };
  }

  async findRelated(
    pdfId: string,
    query: string,
    size = 10,
  ): Promise<RelatedResult[]> {
    const result = await this.client.search<PdfChunkDocument>({
      index: ELASTIC_INDEX,
      size,
      query: this.buildRelatedQuery(pdfId, query),
      sort: [{ _score: { order: 'desc' } }, { pageNumber: { order: 'asc' } }],
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

    const maxScore = result.hits.max_score || 1;

    return result.hits.hits.map((hit) => {
      const source = hit._source!;
      const rawScore = hit._score ?? 0;

      return {
        chunkId: source.chunkId,
        pdfId: source.pdfId,
        pageNumber: source.pageNumber,
        content: source.content,
        snippet:
          hit.highlight?.content?.[0] ?? source.content.slice(0, 180) + '...',
        score: rawScore,
        confidence: Number((rawScore / maxScore).toFixed(3)),
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
