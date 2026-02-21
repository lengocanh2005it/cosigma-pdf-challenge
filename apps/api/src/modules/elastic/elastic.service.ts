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

  private buildBaseQuery(pdfId: string, query: string): QueryDslQueryContainer {
    const wordCount = query.split(/\s+/).length;
    const enableFuzzy = wordCount <= 5;

    return {
      bool: {
        filter: [{ term: { pdfId } }],
        should: [
          {
            match_phrase: {
              content: {
                query,
                boost: 5,
              },
            },
          },
          {
            match: {
              content: {
                query,
                operator: 'and',
                boost: 3,
              },
            },
          },
          {
            match: {
              content: {
                query,
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
                      query,
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
    };
  }

  async findRelated(
    pdfId: string,
    query: string,
    currentChunkId?: string,
    size = 10,
  ): Promise<RelatedResult[]> {
    const cleanedQuery = query.replace(/\s+/g, ' ').trim().toLowerCase();

    const result = await this.client.search<PdfChunkDocument>({
      index: ELASTIC_INDEX,
      size,
      query: {
        script_score: {
          query: this.buildBaseQuery(pdfId, cleanedQuery),
          script: {
            source: `
            double score = _score;
            if (params.currentChunkId != null && doc['chunkId'].value == params.currentChunkId) {
              return score * 0.05;
            }
            return score;
          `,
            params: {
              currentChunkId: currentChunkId ?? null,
            },
          },
        },
      },
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

    const hits = result.hits.hits;
    if (!hits.length) return [];

    const maxScore = hits[0]._score ?? 1;

    return hits.map((hit) => {
      const source = hit._source as PdfChunkDocument;
      const rawScore = hit._score ?? 0;

      const contentLower = source.normalizedContent;

      let matchedWord = cleanedQuery;

      const highlightText = hit.highlight?.content?.[0];
      if (highlightText) {
        const match = highlightText.match(/<em>(.*?)<\/em>/);
        if (match && match[1]) {
          matchedWord = match[1].toLowerCase();
        }
      }

      const matchIndex = contentLower.indexOf(matchedWord);

      let rectTop = source.rectTop;
      let rectLeft = source.rectLeft;
      let rectWidth = source.rectWidth;
      let rectHeight = source.rectHeight;

      if (matchIndex !== -1) {
        const totalLength = contentLower.length;

        const ratioStart = matchIndex / totalLength;
        const ratioWidth = matchedWord.length / totalLength;

        rectLeft = source.rectLeft + source.rectWidth * ratioStart;
        rectWidth = source.rectWidth * ratioWidth;
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
        rectTop,
        rectLeft,
        rectWidth,
        rectHeight,
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
