# COSIGMA – PDF Highlight & Find Related Text

## Frontend (apps/web)

Frontend application for the **COSIGMA PDF Challenge**.

This web app allows users to view a PDF document in the browser, highlight selected text, search for related content within the same PDF, and jump to visually indicated matched locations with precise overlay rendering.

---

## 📂 Project Structure

```bash
apps/web/
├── .next/                          # Next.js build output (generated after build)
├── node_modules/                   # Installed dependencies
├── public/                         # Static assets (icons, images, etc.)
├── src/                            # Application source code
│   ├── app/                        # Next.js App Router
│   │   ├── pdf/                    # PDF feature routes
│   │   │   ├── [id]/               # Dynamic route for a specific PDF
│   │   │   │   └── page.tsx        # PDF viewer page (highlight + related flow)
│   │   │   ├── page.tsx            # PDF list / upload page
│   │   │   └── layout.tsx          # Layout wrapper for PDF pages
│   │   ├── page.tsx                # Root landing page
│   │   ├── layout.tsx              # Root layout (app shell)
│   │   └── globals.css             # Global styles
│   │
│   ├── components/                 # Reusable UI components
│   │   ├── highlight/              # Highlight logic & overlay rendering
│   │   ├── layouts/                # Layout components (app shell, panels)
│   │   ├── pdf/                    # PDF viewer wrapper components
│   │   ├── related/                # Related results panel & match overlay
│   │   └── ui/                     # Base UI components (buttons, cards, etc.)
│   │
│   ├── hooks/                      # Custom React hooks (selection, scroll, state)
│   ├── providers/                  # Global providers (context, query, etc.)
│   ├── lib/                        # Shared utilities & API layer
│   │   ├── api/                    # API request functions (PDF, related search)
│   │   ├── axios.ts                # Axios instance configuration
│   │   ├── constants.ts            # Shared constants
│   │   └── utils.ts                # Helper utilities
│
├── .env.local                      # Local environment variables
├── .env.example                    # Example environment variables
├── next.config.js                  # Next.js configuration
├── package.json                    # Dependencies & scripts
├── components.json                 # UI component configuration
├── README.md                       # Frontend documentation
└── tsconfig.json                   # TypeScript configuration
```

## 🎯 Architectural Separation

The frontend is organized into clear layers:

- Routing layer → `app/`
- Presentation layer → `components/`
- State & logic layer → `hooks/` + `providers/`
- Integration layer → `lib/api`
- Styling layer → Tailwind + global CSS

This separation ensures:

- Maintainability
- Clear responsibility boundaries
- Easy extension for multiple highlights & advanced ranking

---

## 🚀 Tech Stack

### 🧱 Core Framework

- **Next.js** – React framework (App Router)
- **React** – UI library
- **TypeScript** – Type-safe development

### 📄 PDF Rendering

- **react-pdf** – PDF viewer in browser
- **pdfjs-dist** – PDF parsing & rendering engine

### 🎨 UI & Styling

- **TailwindCSS** – Utility-first CSS framework

### 🌐 API & Server State

- **Axios** – HTTP client for async communication
- Centralized Axios instance (`lib/axios.ts`)
- Request / response interceptors
- Structured error handling
- **@tanstack/react-query** – Server-state management, caching & async control

### 🔔 Notifications

- **react-toastify** – Toast notifications for success & error feedback

### 🧲 Interaction & Dragging

- **@dnd-kit/core** – Drag-and-drop system (draggable UI components, panels, overlays)

---

# 📦 Features Overview

## 1️⃣ PDF Viewing

- Render multi-page PDFs in the browser
- Scroll-based navigation
- Page-control navigation
- Page-level rendering using `react-pdf`
- Stable rendering under resize

## 2️⃣ Highlight

- Text selection inside rendered PDF
- Extract selected content
- Compute bounding rectangles from DOM
- Render visual highlight overlays
- Maintain highlight list in side panel

## 3️⃣ Find Related

For each highlight:

- Trigger related search request
- Show loading state
- Display ranked results with:
  - Page number
  - Snippet preview
  - Confidence score
  - Jump action

Handles:

- Loading state
- Empty state
- Error state

## 4️⃣ Jump + Visual Indication

When user clicks Jump:

- Scroll to the related page
- Align to anchor region
- Render overlay highlight
- Visually emphasize matched area

Overlay rendering is deterministic and recalibrated based on actual DOM measurements.

---

# 🎨 UI Interaction Model

The frontend focuses heavily on interaction precision.

## Highlight Creation Flow

1. User selects text.
2. Selection range is extracted.
3. `Range.getClientRects()` computes bounding boxes.
4. Highlight state is stored.
5. Overlay layer renders highlight.

## Related Search Flow

1. User clicks Find Related.
2. React Query triggers async request.
3. Loading indicator appears.
4. Results panel updates reactively.
5. User can jump to a specific result.

All interactions are client-driven and reactive.

---

# 🗂 State Management Strategy

## UI State

- Active highlight
- Selected text
- Drag state
- Active related match

Managed via:

- Local React state
- Context providers

## Server State

- Related search results
- PDF list data
- Loading & error states

Managed via:

- React Query
  - Caching
  - Deduplication
  - Request lifecycle handling

## Network Layer

- Centralized Axios instance
- Error normalization
- Typed API functions in lib/api/

---

# ⚡ Performance Considerations

- Lazy PDF page rendering
- Lightweight overlay DOM nodes
- No full PDF re-render on highlight updates
- React Query avoids redundant requests
- Scroll & overlay calculations isolated from heavy reflows
- Drag interactions optimized

---

# 🧪 Edge Cases Handled

- No related results → Empty state UI
- API failure → Toast error notification
- Window resize → Overlay recalibration
- Zoom adjustments → Stable alignment
- Rapid search clicks → Managed by React Query

---

# 📦 Scope of This Package

This package is responsible for:

- PDF rendering
- User text selection
- Highlight overlay rendering
- Related results UI
- Scroll & visual indication
- Drag-and-drop interaction

This package does **NOT** handle:

- PDF parsing
- Chunking
- Embedding generation
- Search ranking
- Elasticsearch integration

Those responsibilities belong to `apps/api`.

---

# 📜 License

This project is licensed under the **MIT License**.

You are free to:

- Use
- Modify
- Distribute
- Sublicense

Provided that the original copyright and license notice are included.

See the `LICENSE` file at the repository root for full license text.

---

# 🙏 Acknowledgements

Built as part of the **COSIGMA PDF Challenge**.

Special thanks to:

- **Next.js**
- **React**
- **react-pdf**
- **Tanstack**

For providing the ecosystem that made this project possible.

---

# 👤 Author

**Ngoc Anh Le**

- GitHub: https://github.com/lengocanh2005it
- Email: lengocanhpyne363@gmail.com
- Phone: (+84) 393 873 630
