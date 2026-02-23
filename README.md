# COSIGMA – PDF Highlight & Find Related Text

Monorepo implementation for the **COSIGMA PDF Challenge**.

This project enables users to:

- View a PDF in the browser
- Highlight selected text
- Search for semantically related content within the same document
- Jump directly to matched paragraphs with precise visual overlays

The system is built using a scalable hybrid search architecture combining keyword ranking and vector similarity.

---

## 🖼️ UI Preview

<p align="center">
  <img src="docs/images/pdf-page.png" width="45%" />
  <img src="docs/images/pdf-viewer.png" width="45%" />
</p>

<p align="center">
  <img src="docs/images/pdf-highlight.png" width="45%" />
  <img src="docs/images/pdf-related.png" width="45%" />
</p>

<p align="center">
  <em>
    The interface demonstrates PDF rendering, text highlighting, related-search results,
    and precise jump-to-overlay visualization powered by a hybrid search architecture.
  </em>
</p>

---

# 🏗️ Monorepo Structure

This project is organized using **Turborepo** with clear separation between applications and shared packages.

```bash
.
├── apps/
│   ├── api/                     # Backend application
│   └── web/                     # Frontend application
│
├── packages/
│   ├── eslint-config/           # Shared ESLint configuration
│   ├── types/                   # Shared TypeScript types & interfaces
│   ├── typescript-config/       # Shared tsconfig base configurations
│   └── ui/                      # Shared UI components (if reused across apps)
│
├── docs/
│   └── images/                  # UI screenshots & documentation assets
│
├── package.json                 # Root dependencies & workspace configuration
├── turbo.json                   # Turborepo pipeline configuration
└── README.md                    # Root project documentation
```

# 📂 Directory Breakdown

## `apps/`

- Contains all runnable applications inside the monorepo.
- Each application is independently buildable and deployable, while sharing types and configurations from `packages/`.

## `apps/api`

Backend service responsible for:

- PDF parsing & paragraph-level chunking
- Layout metadata extraction (`pageNumber`, `anchorY`, `rectX`, `rectY`, etc.)
- Embedding generation for each chunk
- Elasticsearch hybrid indexing (BM25 + dense vector search)
- Ranked related-text retrieval
- Background job processing for asynchronous ingestion
- Deterministic coordinate return for precise frontend rendering

### Architecture Responsibilities

- **Ingestion Layer** → Parse & normalize PDF
- **Indexing Layer** → Store chunks in Elasticsearch
- **Embedding Layer** → Generate vector embeddings
- **Search Layer** → Hybrid scoring & ranking
- **Worker Layer** → Async processing pipeline

### Built with:

- Node.js
- NestJS (backend framework)
- PostgreSQL (metadata & jon storage)
- Elasticsearch (hybrid search: BM25 + dense vector)
- Graphile Worker (background job processing)
- Ollama (local embedding runtime – `nomic-embed-text`)

### 📖 Detailed documentation

→ [apps/api/README.md](https://github.com/lengocanh2005it/cosigma-pdf-challenge/tree/main/apps/api)

## `apps/web`

Frontend application responsible for:

- Rendering PDFs in the browser
- Capturing and managing text highlights
- Triggering related search API requests
- Handling loading & empty states
- Jumping to matched regions inside the PDF
- Recalculating layout alignment between PDF-space and DOM-space
- Rendering precise overlay bounding boxes
- Managing async server-state and UI feedback

### Architecture Responsibilities

- **Rendering Layer** → `react-pdf` + DOM recalibration
- **Interaction Layer** → Highlight selection & draggable UI
- **State Layer** → React Query + local UI state
- **Integration Layer** → Axios API communication
- **Overlay Engine** → PDF coordinate → DOM coordinate mapping

### Built with:

- Node.js (runtime)
- Next.js (React framework – App Router)
- React (UI library)
- TypeScript (type safety)
- react-pdf (PDF rendering)
- pdfjs-dist (PDF rendering engine)
- @tanstack/react-query (server-state management & caching)
- Axios (HTTP client with interceptors)
- TailwindCSS (utility-first styling)
- @dnd-kit/core (draggable UI components)
- react-toastify (notifications)

### 📖 Detailed documentation

→ [apps/web/README.md](https://github.com/lengocanh2005it/cosigma-pdf-challenge/tree/main/apps/web)

## `packages/`

Contains shared reusable modules across applications.

### `packages/types`

- Shared TypeScript interfaces
- Common DTOs between frontend & backend
- Ensures end-to-end type safety

### `packages/eslint-config`

- Centralized ESLint rules
- Enforces consistent code quality

### `packages/typescript-config`

- Base `tsconfig` presets
- Shared compiler standards

### `packages/ui`

- Reusable UI components (if shared across apps)
- Design system abstraction

---

# 🧠 Why This Structure?

This monorepo structure provides:

- Clear separation of concerns
- Shared type safety between FE & BE
- Scalable hybrid search architecture
- Deterministic overlay rendering
- Independent build pipelines
- Fast incremental builds with Turborepo

It is designed to scale for:

- Multiple PDFs
- Advanced ranking strategies
- Additional services (admin app, analytics, etc.)
- Distributed search or cloud deployment

---

# 🏗️ System Architecture Overview

The system follows a hybrid search architecture that combines keyword ranking (BM25) and semantic vector similarity.

```text
User Highlight
      ↓
Frontend (Next.js)
      ↓
POST /pdf/:pdfId/find-related
      ↓
Backend (NestJS API)
      ↓
Elasticsearch (BM25 + Vector Search)
      ↓
Return ranked chunks + layout metadata
      ↓
Frontend recalibrates & renders overlay
```

## 🔎 Backend Responsibilities

- Parse PDF into paragraph-level chunks
- Extract layout metadata (`pageNumber`, `anchorY`, `rectX`, `rectY`, `rectWidth`, `rectHeight`)
- Generate embeddings using Ollama (`nomic-embed-text`)
- Index chunks into Elasticsearch
- Perform hybrid retrieval (BM25 + cosine similarity)
- Return ranked related results

## 🎨 Frontend Responsibilities

- Render PDF using `react-pdf`
- Send highlighted text to backend
- Scroll to matched region using `anchorY`
- Recalculate PDF-space → DOM-space coordinates
- Render precise overlay bounding boxes

The frontend recalibrates coordinates to prevent visual drift caused by scaling differences between PDF coordinate space and rendered DOM space.

---

# 🧠 How Related Results Are Computed (High-Level)

The frontend does **not** compute similarity or ranking.

The backend processing pipeline works as follows:

1. **PDF Chunking**
   - The PDF is parsed and divided into logical text chunks (paragraph-level or block-level).
   - Each chunk preserves layout metadata such as:
     - `pageNumber`
     - `anchorY`
     - `rectX`, `rectY`, `rectWidth`, `rectHeight`

2. **Indexing**
   - Each chunk is indexed into **Elasticsearch**.
   - Two representations are stored:
     - Full-text index (BM25)
     - Vector embedding (Elasticsearch dense vector field)

3. **Embedding Generation**
   - The highlighted query text is converted into a vector embedding.
   - Hybrid retrieval is performed:
     - Keyword-based scoring (BM25)
     - Vector similarity scoring (cosine similarity)

4. **Ranked Retrieval**
   - Elasticsearch returns a ranked list of related chunks.

Each result contains:

- `pageNumber`
- `snippet`
- `score` (confidence)
- `anchorY`
- `rectX`, `rectY`, `rectWidth`, `rectHeight`

These coordinates are computed during PDF parsing and represent the approximate bounding box of the matched chunk in the PDF coordinate space.

---

# 📐 How the Frontend Locates, Scrolls & Renders Matched Areas

Although the backend returns layout metadata, the frontend does **not blindly trust raw coordinates**.

This is necessary because:

- Backend coordinates are calculated in **PDF coordinate space**
- The browser renders pages in **scaled DOM space** via `react-pdf`

To avoid visual drift or misalignment, the frontend performs a recalibration process.

---

### 1️⃣ Locate the Target Page

- Query the rendered page container using:

  ```ts
  data - page - number;
  ```

- Get the actual DOM node of that page.

### 2️⃣ Compute Real Rendered Metrics

- Read the page’s rendered width & height from the DOM.
- Determine the current react-pdf scale factor.
- Account for container scroll offset.

This gives the transformation ratio between:

- PDF coordinate space → Rendered DOM space

### 3️⃣ Scroll to the Related Region

Instead of scrolling to the top of the page:

- Use `anchorY` (returned from backend) as a vertical anchor.
- Convert `anchorY` from PDF space → DOM Y coordinate.

### 4️⃣ Recalculate Overlay Positions

For each returned rectangle:

- Map:
  - `rectX`
  - `rectY`
  - `rectWidth`
  - `rectHeight`
    from PDF space → DOM space
- Adjust using:
  - Actual rendered page size
  - Current scale factor
  - Floating-point rounding normalization
    Then render absolutely positioned overlay elements on top of the PDF layer.
- Scroll the container so the related paragraph is brought into view (typically centered).

This ensures the viewport moves directly to the matched region.

---

### ✅ Result

This hybrid alignment approach ensures:

- Pixel-accurate highlights
- No mismatch when zooming or resizing
- Deterministic Jump + Visual Indication
- Stable overlay rendering across re-renders

In summary:

- `anchorY` → used for precise scroll positioning.
- `rect*` → used for visual indication.
- DOM recalibration → guarantees correct alignment.

---

# 🚀 Getting Started / How to Run

## 1️⃣ Prerequisites

Make sure you have installed:

- Node.js >= 18
- npm (recommended) / pnpm / yarn
- Docker & Docker Compose

## 2️⃣ Clone Repository

```bash
git clone https://github.com/lengocanh2005it/cosigma-pdf-challenge.git
cd cosigma-pdf-challenge
```

## 3️⃣ Setup Environment Variables

Each application already provides an `.env.example` file.

You must create real environment files before running the project.

## 📦 Backend – `apps/api`

## 1. Create environment file

```bash
cd apps/api
cp .env.example .env
```

## 2. Configure `.env`

Open `apps/api/.env` and fill in the values:

```bash
# Port that the backend server will run on
# Example: 4000
PORT=4000

# URL of the frontend application (used for CORS configuration)
# Example: http://localhost:3000
FRONTEND_URL=http://localhost:3000

# PostgreSQL connection string
# Format:
# postgres://username:password@host:port/database
# Example:
# postgres://postgres:postgres@localhost:5432/cosigma
DATABASE_URL=postgres://postgres:postgres@localhost:5432/cosigma

# Elasticsearch connection URL
# Example:
# http://localhost:9200
ELASTIC_URL=http://localhost:9200
```

## 🔎 Variable Explanation

- `PORT` → Port where the backend server runs.
- `FRONTEND_URL` → Used to configure CORS (must match frontend URL).
- `DATABASE_URL` → PostgreSQL connection string.
- `ELASTIC_URL` → Elasticsearch endpoint used for hybrid search.

---

## 🌐 Frontend – `apps/web`

## 1. Create environment file

```bash
cd ../web
cp .env.example .env.local
```

## 2. Configure `.env.local`

Open `apps/web/.env.local`:

```bash
# Base URL of the backend API
# MUST match the backend PORT
# Example:
# http://localhost:4000
NEXT_PUBLIC_BASE_URL=http://localhost:4000
```

## 🔎 Variable Explanation

- `NEXT_PUBLIC_BASE_URL`

  → Base URL used by the frontend to call backend APIs.

  → Must match `PORT` defined in `apps/api/.env`.

If backend runs on:

```bash
PORT=4000
```

Then frontend must use:

```bash
NEXT_PUBLIC_BASE_URL=http://localhost:4000
```

---

## ✅ Final Check

- Backend `.env` created
- Frontend `.env.local` created
- Ports match correctly
- No empty required variables

---

## 4️⃣ Install Dependencies

Install dependencies for each app:

## Frontend

```bash
cd apps/web
npm install
```

## Backend

```bash
cd ../api
npm install
```

## 5️⃣ Build Shared Types

The project uses shared types inside `packages/types`.

From root:

```bash
cd packages/types
npm run build
```

This compiles shared TypeScript definitions used by both frontend and backend.

## 6️⃣ Start Infrastructure Services

From `apps/api`:

```bash
docker compose up -d
```

Wait until:

- PostgreSQL container is running
- Elasticsearch container is running
- All required images are fully pulled

## ⚠️ Important: Wait for Ollama Model to Finish Pulling

Even after the containers are running, you must ensure that the embedding model is fully downloaded.

The system uses:

- Model: `nomic-embed-text`

- Runtime: `Ollama`

## Check Ollama logs:

```bash
docker logs -f pdf_ollama
```

Wait until you see that:

- The model `nomic-embed-text` is fully pulled
- No more downloading progress
- `Ollama` is ready to serve requests

If the model is still downloading and you start the backend immediately, embedding requests may fail.

## ✅ Ready When

Infrastructure is ready only when:

- PostgreSQL is healthy
- Elasticsearch is ready to accept connections
- Ollama has finished pulling nomic-embed-text
- No container is restarting

After that, continue to the build step.

## 7️⃣ Build Applications (Production Build)

## Backend

```bash
cd apps/api
npm run build
```

## Frontend

```bash
cd ../web
npm run build
```

This generates production-ready builds.

## 8️⃣ Start Applications

## Start Backend

```bash
cd apps/api
npm run start
```

If successful, you should see:

```bash
[Nest] 19100  - 02/23/2026, 5:18:07 PM     LOG [GraphileWorker] Worker connected and looking for jobs... (task names: 'index_pdf', 'delete_pdf')
[Nest] 19100  - 02/23/2026, 5:18:07 PM     LOG [NestApplication] Nest application successfully started +48ms
Server is running on PORT 3001
```

## Start Frontend

```bash
cd apps/web
npm run start
```

If successful, you should see:

```bash
▲ Next.js 16.1.6 (Turbopack)
- Local:         http://localhost:3000
- Network:       http://192.168.1.10:3000
- Environments: .env.local

✓ Starting...
✓ Ready in 2.3s
```

## 9️⃣ Access the Application

Open your browser:

```bash
http://localhost:3000
```

Navigate to:

```bash
http://localhost:3000/pdf
```

If:

- Frontend loads successfully
- Backend logs show Server is running on PORT <port>
- No Docker container errors appear

✅ The system is running correctly.

---

# 💪 System Strengths

- Hybrid Search Architecture (BM25 + Vector similarity)
- Deterministic coordinate mapping for precise overlays
- Clear separation of FE & BE responsibilities
- Monorepo with shared type safety
- Async ingestion pipeline using background workers
- Scalable search layer powered by Elasticsearch
- Local embedding runtime (no external API dependency)

---

# ⚠️ Current Limitations

- Multi-line highlight handling is still limited

  → Highlighting across multiple lines may not always merge perfectly into a single visual block.

- Related text retrieval is not 100% accurate

  → Hybrid search (BM25 + vector similarity) can sometimes return semantically close but contextually imperfect results.

- Basic hybrid scoring strategy

  → No advanced reranking layer (e.g., cross-encoder) is applied after retrieval.

- Single-node Elasticsearch setup

  → Not configured for clustering or distributed scaling.

- Local embedding runtime (Ollama)

  → Model warm-up and first-load embedding can be slow.

  → Performance may degrade under heavy ingestion load.

- No caching layer

  → Repeated similarity queries are recomputed.

- No user persistence layer

  → Highlights and interactions are not stored per user.

- Development-focused Docker setup

  → No production-ready orchestration or deployment configuration.

---

# 🚀 Future Improvements (Based on Current Limitations)

Given the current system limitations (single-line highlight handling, occasional related-search inaccuracies, and alignment sensitivity), the following improvements are planned:

## 🔎 Search & Ranking Improvements

- Fine-tune hybrid scoring weights (BM25 vs vector similarity)
- Introduce a reranking layer (cross-encoder) to improve semantic precision
- Improve chunking strategy (better paragraph segmentation)
- Add query normalization & semantic boosting
- Improve multi-line highlight handling for better context understanding

## 🎯 Highlight & Overlay Enhancements

- Support stable multi-line highlight selection
- Improve bounding box merging for long paragraphs
- Reduce coordinate drift in edge zoom / resize cases
- Improve anchor precision for dense text layouts

## ⚡ Performance Optimizations

- Add Redis caching for repeated related queries
- Batch embedding generation during ingestion
- Preload / warm embedding runtime (Ollama model warm-up)
- Optimize Elasticsearch index mapping & scoring scripts

## 📈 Scalability Improvements

- Elasticsearch clustering for distributed search
- Horizontal API scaling
- Distributed worker queue processing
- Cloud-ready deployment architecture

## 🧩 Product Enhancements

- Multi-PDF cross-document search
- Persistent annotation storage
- Document tagging & filtering
- User authentication & saved highlights
- Result confidence visualization improvements

---

These improvements aim to increase:

- Search accuracy
- UI precision
- System scalability
- Production readiness

---

# 🙏 Acknowledgements

This project leverages several powerful open-source technologies:

- **NestJS** – Structured and scalable backend framework
- **Next.js** – Modern React framework with App Router
- **Elasticsearch** – Hybrid search engine (BM25 + dense vector)
- **PostgreSQL** – Reliable relational database
- **Graphile Worker** – Background job processing
- **Ollama** – Local embedding runtime
- **nomic-embed-text** – Text embedding model
- **react-pdf / pdfjs-dist** – In-browser PDF rendering
- **@tanstack/react-query** – Server-state management
- **Axios** – HTTP client
- **TailwindCSS** – Utility-first CSS framework
- **@dnd-kit/core** – Drag-and-drop interactions
- **react-toastify** – Notification system

Special thanks to the open-source community for building and maintaining these tools.

---

# 📜 License

This project is licensed under the **MIT License**.

Copyright (c) 2026 Ngoc Anh Le

Permission is granted to use, copy, modify, and distribute this software
with proper attribution.

The software is provided "as is", without warranty of any kind.

---

# 👤 Author

**Ngoc Anh Le**  
Software Engineer

## 📬 Contact

- GitHub: https://github.com/lengocanh2005it
- Email: lengocanhpyne363@gmail.com
- Phone: +84 393 873 630
