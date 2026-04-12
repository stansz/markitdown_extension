# MarkItDown — Chrome Extension

A Chrome extension (Manifest V3) that converts PDF, DOCX, XLSX, PPTX, HTML, and Outlook `.msg` files to Markdown — entirely client-side, no data leaves your browser.

## Features

- **100% Client-Side** — all processing happens locally in the browser
- **Side Panel** — lightweight hub that stays open while you browse
- **Popup Window** — full-featured converter experience (drag-drop, preview)
- **Context Menus** — right-click a link or page to convert
- **6 Formats** — PDF, DOCX, XLSX, PPTX, HTML, MSG

## Installation

### Prerequisites

- Node.js 18+
- Chrome 116+ (Side Panel API support)

### Build

```bash
git clone https://github.com/stansz/markitdown_extension.git
cd markitdown_extension
npm install
npm run build:extension
```

### Load the extension

1. Open `chrome://extensions/`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked** → select the `dist/` folder

## Usage

| Action | How |
|--------|-----|
| Open converter | Click the MarkItDown toolbar icon → side panel opens |
| Full window | Click "Open in new window" button in the side panel |
| Convert a link | Right-click a link → "Convert this link to Markdown" |
| Convert a page | Right-click on a page → "Convert this page to Markdown" |

## Supported Formats

| Format | Extension | Library |
|--------|-----------|---------|
| PDF | `.pdf` | pdf.js |
| Word | `.docx` | mammoth.js |
| Excel | `.xlsx`, `.xls` | SheetJS |
| PowerPoint | `.pptx` | JSZip |
| HTML | `.html`, `.htm` | DOMParser + marked |
| Outlook Email | `.msg` | @kenjiuno/msgreader |

## Development

```bash
npm run dev:extension    # Build + watch (reload extension on change)
npm run build:extension  # Production build
```

After a rebuild, click the **Refresh** button on `chrome://extensions/` to pick up changes.

## Architecture

```
src/
├── entries/
│   ├── background.ts      # Service worker (context menus, side panel open)
│   ├── popup.tsx           # Fallback launcher
│   ├── sidepanel.tsx       # Side panel entry
│   └── window.tsx          # Full window entry
├── core/
│   ├── MarkItDown.ts       # Converter orchestrator
│   └── types.ts            # Shared interfaces
├── converters/             # Format-specific converters
├── components/             # Shared React components
│   └── extension/          # Extension-specific layouts
└── hooks/                  # Shared React hooks
```

Three entry points share the same component library and conversion logic. Build produces a single `dist/` folder loadable as an unpacked extension.

## Tech Stack

- **Build**: Vite 5 (multi-entry)
- **Framework**: React 18 + TypeScript 5
- **Styling**: Tailwind CSS
- **Extension**: Manifest V3, Side Panel API

## License

MIT — see [LICENSE](LICENSE).
