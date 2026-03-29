# Project Memory

## Brief

**MarkItDown Browser Extension** is a browser extension that transforms various document formats (PDF, DOCX, HTML, PPTX, XLSX, MSG) into clean Markdown. The conversion runs entirely in the browser using React, TypeScript, and Vite, with no server-side processing required.

**Core Requirements:**
- Convert multiple document formats to Markdown
- Pure browser-based processing (client-side only)
- Support drag-and-drop file uploads
- Provide real-time preview of converted Markdown
- Function as a browser extension for easy access

**Goals:**
- Deliver a fast, responsive user interface
- Ensure reliable conversion across all supported formats
- Provide seamless browser extension integration
- Keep dependencies minimal and well-maintained

---

## Product

**Purpose:**
MarkItDown Browser Extension provides a privacy-focused tool for converting documents to Markdown directly in your browser. All processing happens locally—no uploads to servers required.

**Problems Solved:**
- Eliminates privacy concerns of uploading sensitive documents to cloud services
- Works offline once loaded
- Provides instant conversion without network latency
- Supports multiple common document formats in one interface
- Accessible directly from browser toolbar

**How It Works:**
1. User clicks the extension icon or drags files into the popup
2. The appropriate converter (based on file type) processes the file in memory
3. Extracted text is formatted as Markdown
4. User can preview, copy, or download the Markdown output

**User Experience Goals:**
- Clean, intuitive popup interface using Tailwind CSS and shadcn/ui components
- Immediate feedback during conversion (loading states, error messages)
- Clear error handling with helpful messages
- Responsive design for different screen sizes

---

## Context

**Current Work Focus:**
- Building and testing the browser extension functionality
- Ensuring all converters work reliably in extension environment
- Maintaining code quality and TypeScript type safety

**Recent Changes:**
- Initial extension setup and configuration
- Implemented core document converters (PDF, DOCX, XLSX, PPTX, HTML, MSG)
- Set up Vite build configuration for browser extension packaging

**Next Steps:**
- Test the extension in various browsers
- Add extension manifest and icons
- Consider additional document format support if needed

---

## Architecture

**System Architecture:**
- Browser extension popup built with React 18
- TypeScript for type safety
- Vite for fast development and optimized production builds
- Component-based architecture with clear separation of concerns

**Source Code Paths:**
```
src/
├── components/          # React UI components
│   ├── FileUpload.tsx   # Drag-and-drop file upload
│   ├── FileList.tsx    # List of uploaded files
│   ├── MarkdownPreview.tsx  # Markdown rendering
│   └── ActionButtons.tsx    # Copy/download actions
├── converters/         # Document format converters
│   ├── DocxConverter.ts    # DOCX → Markdown (mammoth.js)
│   ├── HtmlConverter.ts    # HTML → Markdown (marked.js)
│   ├── OutlookMsgConverter.ts # MSG → Markdown (@kenjiuno/msgreader)
│   ├── PdfConverter.ts     # PDF → Markdown (pdf.js)
│   ├── PptxConverter.ts    # PPTX → Markdown (pptx2json)
│   └── XlsxConverter.ts    # XLSX → Markdown (xlsx)
├── core/               # Core application logic
│   ├── MarkItDown.ts    # Main orchestrator
│   └── types.ts         # TypeScript interfaces
├── utils/              # Utility functions
│   ├── fileDetection.ts # MIME type and extension matching
│   └── llmClient.ts     # LLM integration (future)
└── lib/
    └── utils.ts         # General utilities
```

**Key Technical Decisions:**
- **Client-side only**: No backend required, improves privacy and reduces infrastructure
- **Dynamic imports for converters**: Each converter is loaded on-demand to reduce initial bundle size
- **Vite build optimization**: Separate chunks for heavy dependencies (pdf-worker, xlsx, jszip) to optimize loading
- **ES modules**: Using modern JavaScript modules for better tree-shaking

**Design Patterns:**
- **Strategy Pattern**: Each converter implements the `DocumentConverter` interface
- **Factory Pattern**: `MarkItDown` class selects appropriate converter based on file type
- **Separation of Concerns**: UI components separate from conversion logic
- **Lazy Loading**: Converters are dynamically imported when needed

**Component Relationships:**
- `App.tsx` → Main container, holds state for files and results
- `FileUpload` → Emits file added events
- `FileList` → Displays files, triggers conversion via `MarkItDown`
- `MarkdownPreview` → Shows converted markdown
- `MarkItDown` core → Uses appropriate converter from `converters/` directory

**Critical Implementation Paths:**
- File upload → Stream reading → Converter selection → Conversion → Markdown output
- Error handling at each stage (file reading, conversion, rendering)

---

## Tech

**Technologies Used:**
- **Frontend**: React 18, TypeScript 5
- **Build Tool**: Vite 5
- **Styling**: Tailwind CSS 3.4, shadcn/ui components
- **Converters**:
  - `pdfjs-dist` (v4.4.168) for PDF text extraction
  - `mammoth` (v1.8.0) for DOCX conversion
  - `marked` (v12.0.0) for HTML to Markdown
  - `xlsx` (v0.20.3) for spreadsheet conversion
  - `jszip` (v3.10.1) for archive handling
- **Icons**: lucide-react

**Development Setup:**
```bash
npm install
npm run dev      # Start development server
npm run build    # Production build for browser extension
npm run preview  # Preview production build
```

**Technical Constraints:**
- Must run entirely in the browser (no server-side code)
- File processing happens in memory (limited by browser memory)
- Large files may cause performance issues
- PDF.js worker must be bundled to avoid CORS issues

**Dependencies:**
- Production: See `package.json` for full list
- All dependencies are npm packages
- pdfjs-dist worker is bundled via Vite with `?worker&url` import

**Tool Usage Patterns:**
- Vite for HMR and optimized builds
- TypeScript strict mode enabled
- Git for version control

**Known Issues & Solutions:**
- PDF.js worker loading: Use local bundled worker instead of CDN to avoid CORS errors
  - Solution: `import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?worker&url'`
  - Set `pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl`
- Node.js core modules in browser: Some npm packages require Node.js built-in modules (Buffer, process, stream, etc.) which aren't available in browsers
  - Solution: Use `vite-plugin-node-polyfills` to automatically provide polyfills for these modules
