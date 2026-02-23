# COSIGMA – PDF Highlight & Find Related Text

## Backend API (apps/api)

Backend service for the **COSIGMA PDF Challenge**.

This service processes PDF documents, indexes searchable chunks, and provides a hybrid related-text search API with precise layout metadata for deterministic match positioning.

---

## 📂 Project Structure

```bash
apps/api/
├── dist/                  # Compiled JavaScript output (build artifacts)
├── node_modules/          # Installed dependencies
├── src/                   # Application source code
│   ├── common/            # Shared utilities, constants, decorators, guards
│   ├── config/            # Environment configuration & app settings
│   ├── modules/           # Feature-based modules
│   │   ├── elastic/       # Elasticsearch integration & index management
│   │   ├── embedding/     # Ollama embedding generation service
│   │   ├── events/        # Domain events & internal event handling
│   │   ├── pdf/           # PDF parsing, chunking & normalization logic
│   │   └── worker/        # Background processing (Graphile Worker)
│   │       └── tasks/     # Worker task definitions (PDF ingestion jobs)
│   ├── app.module.ts      # Root NestJS module
│   └── main.ts            # Application bootstrap entry point
├── uploads/               # Temporary storage for uploaded PDFs
├── .env                   # Environment variables (local)
├── .env.example           # Example environment configuration
├── docker-compose.yml     # Local development services (Postgres, Elastic, etc.)
├── nest-cli.json          # NestJS CLI configuration
├── package.json           # Project dependencies & scripts
└── tsconfig.json          # TypeScript configuration
```

---

## 🚀 Tech Stack

### 🧱 Core Framework

- **Node.js** – Runtime environment
- **NestJS** – Backend framework
- **TypeScript** – Type-safe development

### 🗄️ Data & Storage

- **PostgreSQL** – Metadata & job storage
- **Elasticsearch** – Hybrid search (BM25 + vector similarity)

### ⚙️ Background Processing

- **Graphile Worker** – Asynchronous job processing

### 🧠 AI / Embeddings

- **Ollama** – Local embedding runtime
- **nomic-embed-text** – Embedding model

---

## 📦 Core Capabilities

- Asynchronous PDF processing pipeline
- Chunk-level indexing for precise search
- Hybrid ranking (keyword + semantic search)
- Deterministic layout metadata in search results
- Confidence scoring
- Structured error handling

---

## 🏗️ System Architecture

The backend follows an **asynchronous ingestion + hybrid search architecture**.

### 📐 High-Level Architecture Diagram

```text
                ┌──────────────────────┐
                │      Frontend UI     │
                │ (PDF Viewer Client)  │
                └─────────────┬────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │     API Layer     │
                    │   (NestJS App)    │
                    └───────┬───────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌──────────────┐   ┌────────────────┐   ┌────────────────┐
│ PostgreSQL   │   │ Graphile Worker │   │ Elasticsearch  │
│ (Metadata)   │   │  (Async Jobs)   │   │ (Hybrid Index) │
└──────┬───────┘   └────────┬───────┘   └────────┬───────┘
       │                     │                    │
       │                     ▼                    │
       │             ┌───────────────┐            │
       │             │  Ollama       │            │
       │             │ (Embeddings)  │            │
       │             └───────────────┘            │
       │                                          │
       └──────────────────────────────────────────┘
```

### 🔄 Architecture Flow

### 1️⃣ Ingestion Flow (Asynchronous)

1. Client uploads PDF
2. API stores metadata in PostgreSQL
3. API enqueues background job
4. Worker:
   - Extracts & chunks text
   - Normalizes content
   - Generates embeddings via Ollama
   - Indexes chunks into Elasticsearch

This keeps the API responsive and avoids blocking requests.

---

### 2️⃣ Search Flow (Hybrid Retrieval)

1. Client sends highlighted query
2. API:
   - Normalizes query
   - Generates query embedding
   - Executes hybrid search in Elasticsearch
3. Results include:
   - Ranked chunks
   - Confidence score
   - Precomputed layout metadata
     Frontend uses `anchorY` and bounding boxes for deterministic navigation.

---

### 🧩 Component Responsibilities

### 🟦 NestJS API Layer

- Handles HTTP requests
- Validates input
- Coordinates ingestion & search
- Shapes response payload

---

### 🟩 PostgreSQL

- Stores PDF metadata
- Stores job references
- Maintains ingestion state

---

### 🟨 Graphile Worker

- Processes ingestion asynchronously
- Controls embedding throughput
- Enables horizontal scalability

---

### 🟪 Ollama (Embedding Service)

- Generates dense vector representations
- Powers semantic similarity search

---

### 🟥 Elasticsearch

- Stores chunk-level documents
- Executes BM25 + vector similarity
- Returns ranked hybrid results

---

### 🎯 Architectural Principles

- Asynchronous ingestion
- Deterministic UI alignment
- Chunk-level indexing
- Hybrid retrieval strategy
- Separation of concerns
- Low query-time latency

---

## 📄 Elasticsearch Data Model

Each PDF is indexed at **chunk level** for high precision.

```ts
export interface PdfChunkDocument {
  pdfId: string; // PDF identifier
  chunkId: string; // Unique chunk ID
  chunkIndex: number; // Order in document
  pageNumber: number; // Page location

  content: string; // Raw extracted text
  normalizedContent: string; // Cleaned text for lexical search

  anchorY: number; // Stable vertical scroll anchor

  rectTop: number; // Bounding box top coordinate
  rectLeft: number; // Bounding box left coordinate
  rectWidth: number; // Bounding box width
  rectHeight: number; // Bounding box height

  embedding: number[]; // Vector representation for semantic search
}
```

### 🔎 Model Overview

Each document in Elasticsearch represents a single logical text chunk, not the entire PDF.

This design enables:

- Precise related-text retrieval
- Accurate highlight positioning
- Fine-grained hybrid scoring
- Deterministic frontend navigation

---

### 🧱 Field Breakdown

- `pdfId` – Groups all chunks belonging to the same PDF
- `chunkId` – Unique identifier for each indexed chunk
- `chunkIndex` – Maintains original document order
- `pageNumber` – Required for page-level navigation
- `content` – Raw extracted text used for UI display
- `normalizedContent` – Preprocessed text optimized for BM25 search
- `embedding` – Dense vector used for semantic similarity (cosine similarity search)
- `anchorY` – Stable vertical reference used for deterministic scrolling
- `rectTop / rectLeft / rectWidth / rectHeight` – Bounding box metadata used for rendering highlight overlays

### 🎯 Design Intent

- Chunk-level indexing improves retrieval precision over full-document search
- Storing layout metadata removes the need for runtime PDF parsing
- Separating `content` and `normalizedContent` increases search consistency
- Embedding vectors enable semantic matching beyond keyword overlap

This model is optimized for interactive PDF exploration with deterministic UI alignment, not just generic document search.

---

## 🧠 Design Rationale

### 1️⃣ Chunk-Level Indexing Instead of Full-Document Indexing

Instead of indexing entire PDFs as single documents, the system indexes **logical text chunks**.

**Why?**

- Improves retrieval precision
- Reduces noise in search results
- Enables accurate highlight positioning
- Allows fine-grained scoring

This ensures that returned results map directly to specific UI highlights.

---

### 2️⃣ Hybrid Search (BM25 + Vector Similarity)

Pure lexical search (BM25) is strong for exact matches but fails with paraphrasing.  
Pure semantic search captures meaning but may lose precision.

Combining both:

```ts
finalScore = bm25Score * weight1 + vectorScore * weight2;
```

**Benefits:**

- Preserves exact keyword alignment
- Captures semantic similarity (paraphrasing, related concepts)
- Reduces false positives from pure vector search
- Improves ranking stability across different query types

This hybrid strategy ensures strong performance for both short highlights and longer contextual selections.

---

### 3️⃣ Precomputed Layout Metadata

All layout information (`anchorY`, bounding boxes) is calculated during ingestion and stored in Elasticsearch.

### Why precompute instead of calculating at query time?

- Eliminates runtime PDF parsing
- Avoids expensive layout recalculation
- Guarantees deterministic UI positioning
- Reduces search latency

Because layout is indexed once and reused, highlight rendering remains consistent across sessions.

---

### 4️⃣ Deterministic Navigation via `anchorY`

`anchorY` provides a stable vertical reference for scroll navigation.

Instead of relying purely on DOM queries or frontend text matching:

- Backend provides a consistent scroll anchor
- Frontend scrolls directly to a known coordinate
- Navigation behavior becomes deterministic

This prevents scroll drift and mismatched highlights.

---

### 5️⃣ Text Normalization Strategy

Each chunk stores both:

- `content` (raw extracted text)
- `normalizedContent` (processed text for lexical search)

Normalization typically includes:

- Lowercasing
- Trimming whitespace
- Removing duplicated spacing
- Standardizing characters

### Purpose:

- Improve BM25 consistency
- Reduce lexical scoring noise
- Preserve raw content for UI display

Separating search data from display data increases reliability.

---

### 6️⃣ Asynchronous Processing Architecture

Embedding generation and indexing are computationally heavy operations.

Using background workers:

- Keeps API responses fast
- Prevents blocking upload requests
- Allows independent scaling of worker concurrency
- Isolates ingestion from search path

This ensures the `/related/search` endpoint remains low-latency under load.

---

### 7️⃣ Confidence Score Abstraction

Raw Elasticsearch scores are not exposed directly.

Instead:

- `finalScore` is normalized
- Converted into a `[0, 1]` confidence range
- Returned as `confidence`

### Why?

- Easier interpretation for frontend
- Enables threshold-based filtering
- Prevents leaking internal scoring logic
- Stabilizes UI decision-making

---

### 8️⃣ Separation of Concerns

The system is modularized into clear responsibilities:

- `pdf` → Extraction & chunking
- `embedding` → Vector generation
- `elastic` → Indexing & search queries
- `related` → Ranking logic & response shaping
- `worker` → Background job execution

This improves:

- Maintainability
- Testability
- Scalability
- Long-term extensibility

---

### 9️⃣ Performance-Oriented Design

Every architectural decision prioritizes:

- Low query latency
- Deterministic highlight positioning
- Stable ranking behavior
- Minimal runtime computation

The backend is optimized not just for search accuracy, but for a smooth **interactive PDF navigation experience.**

---

## 🔌 API Endpoints

### 📤 Upload & Process PDF

Uploads a PDF file and triggers asynchronous processing.

**Endpoint**

```bash
  curl POST http://localhost:3000/pdf
```

**Content-Type**

```bash
  multipart/form-data
```

**Example Request**

```bash
  curl -X POST http://localhost:3000/pdf \
  -H "Content-Type: multipart/form-data" \
  -F "file=@document.pdf"
```

**Success Response (201)**

```bash
{
  "id": "cb507fbe-4085-409b-b812-875ca908677c",
  "fileName": "TaiLieu.pdf",
  "status": "UPLOADED",
  "progress": 100
}
```

**Error Responses**

**_400 – Invalid file_**

```bash
{
  "statusCode": 400,
  "message": "File must be a PDF",
  "error": "Bad Request"
}
```

**_413 – File too large_**

```bash
{
  "statusCode": 413,
  "message": "File too large",
  "error": "Payload Too Large"
}
```

---

### 🔎 Find Related Text

Searches for semantically related chunks within the same PDF.
**Endpoint**

```bash
POST /pdf/:pdfId/find-related
```

**Path Param**
| Param | Type | Required | Description |
|--------|--------|----------|-------------|
| pdfId | string | ✅ Yes | ID of the target PDF document |

**Request Body**

```bash
{
  "query": "digital transformation reshapes culture",
  "currentChunkId": "580f1e70-13fd-48a7-a7ed-f07009f8b259",
  "size": 10
}
```

Fields
| Field | Type | Required | Default | Description |
|----------------|--------|----------|---------|-------------|
| query | string | ✅ Yes | — | Text to search for related content |
| currentChunkId | string | ❌ No | — | Current chunk ID (used for contextual ranking) |
| size | number | ❌ No | 10 | Maximum number of results |

---

## Search Strategy

The system performs a hybrid ranking query in Elasticsearch:

1. Filters by pdfId
2. Applies lexical search:
   - match_phrase (boost = 3)
   - match with minimum_should_match = 60%

3. Applies vector similarity:
   - cosineSimilarity(queryEmbedding, embedding)

4. Normalizes BM25 score
5. Combines both scores:
   ```bash
   finalScore = (vectorScore * 0.7) + (bm25 * 0.3)
   ```
   Where:

- `bm25` is normalized using: `bm25 / (bm25 + 5.0)`
- `vectorScore` is normalized to `[0,1]`
- `confidence` = `rawScore / maxScore`

**Example cURL Request**

```bash
curl -X POST http://localhost:3000/pdf/cb507fbe-4085-409b-b812-875ca908677c/find-related \
  -H "Content-Type: application/json" \
  -d '{
    "query": "digital transformation reshapes culture"
  }'
```

**Response**

```bash
[
  {
    "chunkId": "580f1e70-13fd-48a7-a7ed-f07009f8b259",
    "pdfId": "cb507fbe-4085-409b-b812-875ca908677c",
    "pageNumber": 3,
    "snippet": "Digital transformation extends beyond <em>technology</em>...",
    "matchedText": "technology",
    "score": 0.87342,
    "confidence": 0.912,
    "anchorY": 842.21,
    "rectTop": 812,
    "rectLeft": 72,
    "rectWidth": 420,
    "rectHeight": 18
  }
]
```

**Response Fields**
| Field | Description |
|--------------|-------------|
| chunkId | Unique chunk identifier |
| pdfId | Parent PDF ID |
| pageNumber | Page location |
| snippet | Highlighted text fragment (HTML `<em>` tags included) |
| matchedText | Extracted matched words |
| score | Raw Elasticsearch hybrid score |
| confidence | Normalized score in `[0,1]` |
| anchorY | Stable vertical scroll position |
| rectTop | Bounding box top coordinate |
| rectLeft | Bounding box left coordinate |
| rectWidth | Bounding box width |
| rectHeight | Bounding box height |

**✅ Behavior Notes**

- Returns empty array `[]` if no matches found.
- Results are ranked by hybrid score.
- Highlight fragments are generated using Elasticsearch `highlight`.
- Layout metadata enables deterministic UI overlay rendering.
- Confidence score is normalized relative to the highest result.

This endpoint is optimized for:

- Highlight-to-related navigation
- Contextual semantic search
- Stable ranking behavior
- Deterministic PDF overlay rendering

---

## 🎯 Summary

**COSIGMA Backend** is designed for:

- High-precision PDF chunk indexing
- Hybrid lexical + semantic search
- Deterministic highlight positioning
- Low-latency related-text retrieval

The system combines asynchronous ingestion, vector embeddings, and hybrid scoring
to deliver a smooth and reliable PDF navigation experience.

---

## 🚀 Future Improvements

- Add pagination support for large result sets
- Introduce re-ranking layer (cross-encoder)
- Support multi-PDF search scope
- Add caching layer (Redis) for frequent queries
- Improve chunk segmentation strategy (semantic splitting)

---

## 📌 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

**Ngoc Anh Le**

- GitHub: https://github.com/lengocanh2005it
- Email: lengocanhpyne363@gmail.com
- Phone: (+84) 393 873 630
