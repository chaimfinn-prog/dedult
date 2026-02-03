# 🏗️ Zchut.AI: Project Master Blueprint

## 1. Executive Summary

**Zchut.AI** is a high-end real estate intelligence engine. It solves the "Zoning Uncertainty" problem by combining **Unstructured Data** (Zoning PDF regulations) with **Structured Data** (Property dimensions/Gush-Chelka).

The platform serves two distinct user segments:
- **Villa/Home Owners** seeking to understand their building rights and enhancement potential
- **Real Estate Developers** focused on Urban Renewal (Tama 38/2) projects

---

## 2. System Architecture & The "Brain"

The system is built on a **Triple-Layer RAG (Retrieval-Augmented Generation)** architecture to ensure 100% accuracy without "hallucinations."

### A. The Ingestion Engine (The Librarian)

- **PDF Parsing:** Uses `LlamaParse` or `Unstructured.io` to turn messy, scanned Israeli Zoning PDFs into clean Markdown.
- **Vector Storage:** Data is stored in `Pinecone` or `Supabase Vector`, allowing the AI to "query" the law like a human lawyer.

### B. The Calculation Engine (The Engineer)

- **Logic:** The AI *extracts* the percentage (e.g., 140%), but a **Python Math Module** performs the calculation:

```
Result = (Plot_Size * Extraction_Percentage) + Service_Areas
```

- **Validation:** Every result must be accompanied by a "Source Snippet" (a direct quote and page number from the PDF).

### C. The Presentation Layer (The Interface)

- React/Next.js frontend with Tailwind CSS
- Dual-view toggle between Homeowner and Developer modes
- Real-time source attribution for every data point

---

## 3. Dual-User Experience (UX)

The platform splits into two distinct "Worlds" to maximize value for different users.

### Path A: The "Villa" Owner (Home Enhancement)

| Aspect | Detail |
|--------|--------|
| **Tone** | Simple, inviting, aspirational |
| **Key Metrics** | Additional room sqm, pool eligibility, basement potential |
| **Financial Insight** | "Building your 40sqm permitted extension will cost ₪350k but add ₪1.2M to your home value." |
| **Target User** | Homeowners looking to expand, renovate, or understand their rights |

**Core Features for Villa Owners:**
- Simple property lookup by address or Gush/Chelka
- Clear visualization of permitted building envelope
- Cost-to-value analysis for potential extensions
- Pool, basement, and additional floor eligibility checks
- Plain-language explanation of zoning rights

### Path B: The Developer (Urban Renewal - Tama 38/2)

| Aspect | Detail |
|--------|--------|
| **Tone** | Data-heavy, professional, "Bloomberg for Real Estate" |
| **Focus** | Full demolition and reconstruction (No 38/1 reinforcement) |
| **Target User** | Real estate developers evaluating urban renewal projects |

**The "Duch Efes" (Zero Report) - Automated Calculation of:**
- Total Sellable Area (MSH - Meter Shetach)
- Estimated Betterment Levy (Hetel Hashbacha)
- Profit Margin (Mekadem Rivchiyut)
- Construction cost estimates
- Unit mix optimization

---

## 4. Visual Identity (The "Deepblocks" Aesthetic)

The UI must signal "Engineering Precision."

### Theme: Ultramodern Dark Mode

| Element | Value |
|---------|-------|
| **Background** | `#0B0F19` |
| **Primary Accent** | Neon Cyan (Data indicators) |
| **Secondary Accent** | Electric Gold (Profit/financial metrics) |
| **Typography** | Clean, monospace for data; sans-serif for content |

### Key Visual Components

1. **3D Massing:** A transparent isometric box showing the "Building Envelope" on a map grid
2. **The "Radar Scan":** A visual pulse animation while the AI reads and processes PDFs
3. **The Audit Trail:** A side-panel that highlights the source PDF text in real-time as the user clicks a result
4. **Data Cards:** Glassmorphism-style cards with subtle gradients for key metrics
5. **Toggle Switch:** Prominent view toggle between "Homeowner View" and "Developer View"

---

## 5. Technical Requirements

### 5.1 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React / Next.js + Tailwind CSS |
| **Backend** | Next.js API Routes / Python (FastAPI) for calculations |
| **Database** | PostgreSQL (property data, Gush/Chelka) |
| **Vector Store** | Pinecone or Supabase Vector (PDF embeddings) |
| **AI/LLM** | Claude API or OpenAI for RAG extraction |
| **PDF Processing** | LlamaParse or Unstructured.io |
| **Authentication** | NextAuth.js |
| **Maps** | Mapbox or Google Maps API |

### 5.2 Data Handling

1. **Permanent Database (PostgreSQL):** Store property dimensions, Gush/Chelka data, user reports
2. **Vector Store:** Store parsed and embedded PDF content for semantic search
3. **Cache Layer:** Redis for frequently accessed zoning queries

### 5.3 API Integrations

| API | Purpose |
|-----|---------|
| **MAPI (Gov.il)** | Gush/Chelka lookup and plot boundaries |
| **iPlan (Planning Administration)** | Fetching Detailed Plan (Taba) PDF links |
| **Municipal APIs** | Local building committee data where available |

### 5.4 Calculation Logic

**Critical Architecture Decision:** Separate the AI (Extraction) from the Math (Execution).

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   AI/RAG Layer  │────▶│  Math Engine      │────▶│  Presentation   │
│   (Extraction)  │     │  (Python Module)  │     │  (React UI)     │
│                 │     │                   │     │                 │
│ - Read PDF      │     │ - Calculate sqm   │     │ - Display result│
│ - Extract %     │     │ - Apply formulas  │     │ - Show source   │
│ - Find rules    │     │ - Validate ranges │     │ - Audit trail   │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

- The AI provides the **Rule** (extracted from zoning documents)
- The Python code provides the **Result** (mathematical calculation)
- Every result includes a **Source** (PDF page reference)

### 5.5 Reliability Requirements

- Every data point must have a **"Show Source"** button that opens the relevant PDF page
- All calculations must be deterministic (no AI-generated math)
- Source snippets must include direct quotes and page numbers
- Confidence scoring for AI extractions

---

## 6. Data Storage Strategy (Anti-Refresh Protection)

To ensure the "learned" data doesn't disappear:

| Data Type | Storage | Purpose |
|-----------|---------|---------|
| **Plan Metadata** | PostgreSQL | Plan Number, Approval Date, City, Status |
| **Vector Embeddings** | Pinecone / Supabase Vector | Semantic search over zoning documents |
| **User Sessions** | NextAuth + PostgreSQL | Save "Property Reports" for later viewing |
| **Calculation History** | PostgreSQL | Audit trail of all generated reports |
| **PDF Cache** | Object Storage (S3/R2) | Cached copies of source PDFs |

---

## 7. Development Phases

### Phase 1: Foundation (MVP)
- [ ] PostgreSQL schema for properties and Gush/Chelka
- [ ] PDF ingestion pipeline (single city - Ra'anana as pilot)
- [ ] Basic RAG query system
- [ ] Simple UI with property lookup
- [ ] Source attribution system

### Phase 2: Intelligence Layer
- [ ] Dual-view UX (Homeowner / Developer toggle)
- [ ] Calculation engine for building rights
- [ ] "Duch Efes" automated report for developers
- [ ] Financial projections (cost-to-value for homeowners)
- [ ] MAPI / iPlan API integration

### Phase 3: Visual & Scale
- [ ] 3D massing visualization
- [ ] Dark mode "Deepblocks" aesthetic
- [ ] Multi-city expansion
- [ ] User accounts and saved reports
- [ ] Export to PDF/Excel

### Phase 4: Advanced Features
- [ ] Comparative analysis across multiple properties
- [ ] Market value integration
- [ ] Developer ROI calculator with sensitivity analysis
- [ ] Municipal fee estimator
- [ ] Collaboration features for development teams

---

## 8. Key Domain Terms (Hebrew-English Glossary)

| Hebrew | English | Description |
|--------|---------|-------------|
| גוש (Gush) | Block | Land registry block number |
| חלקה (Chelka) | Parcel | Land registry parcel number |
| תב"ע (Taba) | Detailed Plan | Zoning/building plan |
| מש"ח (MSH) | Sellable Area | Total sellable square meters |
| היטל השבחה (Hetel Hashbacha) | Betterment Levy | Tax on increased land value |
| מקדם רווחיות (Mekadem Rivchiyut) | Profit Margin | Developer profit coefficient |
| דו"ח אפס (Duch Efes) | Zero Report | Feasibility assessment |
| תמ"א 38 (Tama 38) | National Plan 38 | Urban renewal framework |
| זכויות בנייה (Zchuyot Bniya) | Building Rights | Permitted construction rights |
| אחוזי בנייה (Achuzei Bniya) | Building Ratio | Percentage of plot that can be built |

---

## 9. Success Metrics

| Metric | Target |
|--------|--------|
| **Accuracy** | 95%+ match with manual lawyer review |
| **Source Attribution** | 100% of results linked to source PDF |
| **Query Speed** | < 5 seconds for building rights calculation |
| **User Satisfaction** | NPS > 50 |
| **Coverage** | 10+ cities within 12 months |

---

*This document serves as the single source of truth for the Zchut.AI development effort. All technical decisions should reference this blueprint.*
