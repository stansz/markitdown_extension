# MarkItDown Browser Extension

A browser extension that transforms various document formats (PDF, DOCX, HTML, PPTX, XLSX, MSG) into clean Markdown. The conversion runs entirely in the browser using React, TypeScript, and Vite, with no server-side processing required.

## Features

- **100% Client-Side**: All processing happens in your browser. No data is sent to any server.
- **Multiple Formats**: Supports PDF, DOCX (Word), XLSX (Excel), PPTX (PowerPoint), HTML, and Outlook .msg files.
- **Browser Extension**: Access document conversion directly from your browser toolbar.
- **Markdown Preview**: Real-time preview of converted Markdown.
- **Copy & Download**: Easily copy to clipboard or download as `.md` file.
- **Privacy-Focused**: Your documents never leave your computer.

## Supported Formats

| Format | Extension | Library Used | Version |
|--------|-----------|--------------|---------|
| PDF | `.pdf` | pdf.js | 4.4.168 |
| Word | `.docx` | mammoth.js | 1.8.0 |
| Excel | `.xlsx`, `.xls` | SheetJS (xlsx) | 0.20.3 |
| PowerPoint | `.pptx` | JSZip | 3.10.1 |
| HTML | `.html`, `.htm` | Native DOMParser + marked | 12.0.0 |
| Outlook Email | `.msg` | @kenjiuno/msgreader | 1.2.0 |

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/markitdown-extension.git
cd markitdown-extension

# Install dependencies
npm install

# Start development server
npm run dev
```

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory. To use as a browser extension, load the `dist` folder in your browser's extension manager.

## Browser Extension Setup

After building, load the extension in your browser:

1. Open `chrome://extensions/` (Chrome/Edge) or `about:debugging` (Firefox)
2. Enable "Developer mode"
3. Click "Load unpacked" and select the `dist` folder

## Architecture

The project follows a modular architecture inspired by Microsoft's Python MarkItDown implementation:

```
src/
├── core/
│   ├── MarkItDown.ts          # Main converter orchestrator
│   └── types.ts               # Shared TypeScript interfaces
├── converters/                # Document format converters
│   ├── HtmlConverter.ts       # HTML → Markdown
│   ├── DocxConverter.ts       # DOCX → Markdown
│   ├── PdfConverter.ts        # PDF → Markdown
│   ├── XlsxConverter.ts       # XLSX/XLS → Markdown
│   ├── PptxConverter.ts       # PPTX → Markdown
│   └── OutlookMsgConverter.ts # MSG → Markdown
├── utils/
│   ├── fileDetection.ts       # MIME type and extension detection
│   └── llmClient.ts           # LLM integration placeholder
├── components/                # React UI components
│   ├── FileUpload.tsx         # Drag-and-drop upload zone
│   ├── FileList.tsx           # File list with conversion status
│   ├── MarkdownPreview.tsx    # Markdown rendering
│   └── ActionButtons.tsx      # Copy and download actions
└── App.tsx                    # Main application component
```

### Converter Priority System

Converters are registered with priorities (lower = higher priority):

- `0.0`: Specific file formats (DOCX, PDF, XLSX, PPTX, MSG)
- `10.0`: Generic formats (HTML, plain text)

When converting a file, converters are tried in priority order until one succeeds.

### Design Patterns

- **Strategy Pattern**: Each converter implements the `DocumentConverter` interface
- **Factory Pattern**: `MarkItDown` class selects appropriate converter based on file type
- **Separation of Concerns**: UI components separate from conversion logic
- **Lazy Loading**: Converters are dynamically imported when needed to reduce initial bundle size

## Technology Stack

- **Build Tool**: Vite 5
- **Framework**: React 18 + TypeScript 5
- **Styling**: Tailwind CSS 3.4 + shadcn/ui components
- **Icons**: lucide-react
- **Conversion Libraries**:
  - `pdfjs-dist` (4.4.168) for PDF text extraction
  - `mammoth` (1.8.0) for DOCX conversion
  - `xlsx` (0.20.3) for spreadsheet conversion
  - `jszip` (3.10.1) for PPTX/archive handling
  - `marked` (12.0.0) for Markdown rendering
  - `@kenjiuno/msgreader` (1.2.0) for Outlook .msg files

### Polyfills

The project uses `vite-plugin-node-polyfills` to provide Node.js core module polyfills (Buffer, process, stream, etc.) for packages that depend on them, ensuring browser compatibility.

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Limitations

- **Large Files**: Very large files may cause performance issues.
- **Complex Formatting**: Some complex document formatting may not be perfectly preserved.
- **Images**: Images embedded in documents are not extracted.
- **Audio/Video**: Audio and video transcription is not supported.

## Development

### Scripts

```bash
npm run dev      # Start development server with HMR
npm run build    # Production build for browser extension
npm run preview  # Preview production build locally
```

### Code Style

This project uses TypeScript strict mode and follows React best practices.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Microsoft MarkItDown](https://github.com/microsoft/markitdown) - Original Python implementation
- [pdf.js](https://mozilla.github.io/pdf.js/) - PDF rendering and text extraction
- [mammoth.js](https://github.com/mwilliamson/mammoth.js) - DOCX to HTML conversion
- [SheetJS](https://sheetjs.com/) - Excel file parsing
- [JSZip](https://stuk.github.io/jszip/) - ZIP/PPTX file handling
- [marked](https://marked.js.org/) - Markdown parser
- [@kenjiuno/msgreader](https://github.com/kenjiuno/msgreader) - Outlook .msg file parser
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
