## 🧠 How Related Results Are Computed (High-Level)

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

## 📐 How the Frontend Locates, Scrolls & Renders Matched Areas

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
