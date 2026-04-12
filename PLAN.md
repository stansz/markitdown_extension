# MarkItDown Chrome Extension — Architecture Plan

## Executive Summary

Convert the existing React SPA into a Chrome Extension (Manifest V3) that converts PDF, DOCX, XLSX, PPTX, HTML, and .msg files to Markdown, entirely client-side.

**The core conversion logic (`src/core/`, `src/converters/`, `src/utils/fileDetection.ts`) is solid, format-agnostic, and can be reused verbatim.** The work is in wiring it into the extension shell and adapting the UI.

---

## 1. UI Approach: Side Panel (default) + Popup Window (full experience)

### Why not popup-only?

A popup closes the moment it loses focus. If a user clicks outside (e.g., to drag a file from Explorer), the popup dies and all conversion state is lost. This is a dealbreaker for a file converter.

### UI Flow

```
Extension icon click
       │
       ▼
  Side Panel opens (default action)
       │
       ├── Quick converts, recent files
       └── "Open in new window" button
                │
                ▼
       chrome.windows.create({ type: 'popup' })
                │
                ▼
       Full popup window (drag-drop, preview, full width)
```

### Three surfaces with distinct roles

| Aspect | Popup (icon click) | Side Panel | Popup Window |
|--------|--------------------|------------|--------------|
| Opens on | Extension icon click | Extension icon click (same action) | "Open in new window" button in side panel |
| Purpose | Thin redirect — just opens the side panel | Lightweight hub: quick converts, recent files | Full experience: drag-drop, preview, full width |
| Persists on focus loss | N/A (closes immediately) | ✅ | ✅ |
| File drag-drop | ❌ | ✅ | ✅ |
| Screen real estate | N/A | ~400px | Full window |
| Entry file | `popup.html` | `sidepanel.html` | `window.html` |

**Key decisions:**
- **No "new tab" option** — users get Side Panel or Popup Window only
- Side Panel is the default experience (always reachable, always visible)
- Popup Window is the full-featured experience for heavy use
- The popup (`popup.html`) is just a thin redirect layer — it immediately opens the side panel and closes

### Architecture Decision: Shared component library, three entry points

Build a single React app with three entry points that share all components and hooks. Each entry point composes the same components with different layout wrappers. One codebase, one build.

---

## 2. Manifest V3 Structure

```
dist/
├── manifest.json
├── popup.html                  # Thin redirect — opens side panel
├── sidepanel.html              # Lightweight converter hub
├── window.html                 # Full popup window experience
├── background.js               # Service worker
├── popup.js                    # Popup bundle
├── sidepanel.js                # Side panel bundle
├── window.js                   # Popup window bundle
├── sidepanel.css               # Styles
├── window.css                  # Styles
├── assets/
│   ├── icons/
│   │   ├── icon-16.png
│   │   ├── icon-48.png
│   │   └── icon-128.png
│   └── pdf.worker.mjs          # PDF.js web worker
└── chunks/                     # Shared code chunks (converters, core)
```

### manifest.json

```json
{
  "manifest_version": 3,
  "name": "MarkItDown",
  "version": "1.0.0",
  "description": "Convert documents (PDF, DOCX, XLSX, PPTX, HTML, MSG) to Markdown — fully offline, 100% client-side.",
  "permissions": [
    "sidePanel",
    "downloads",
    "storage",
    "contextMenus",
    "activeTab"
  ],
  "action": {
    "default_title": "MarkItDown — Convert to Markdown"
  },
  "side_panel": {
    "default_path": "sidepanel.html"
  },
  "background": {
    "service_worker": "background.js",
    "type": "module"
  },
  "icons": {
    "16": "assets/icons/icon-16.png",
    "48": "assets/icons/icon-48.png",
    "128": "assets/icons/icon-128.png"
  },
  "content_security_policy": {
    "extension_pages": "script-src 'self'; worker-src 'self' blob:"
  },
  "web_accessible_resources": [
    {
      "resources": ["assets/pdf.worker.mjs"],
      "matches": ["<all_urls>"]
    }
  ]
}
```

**Note:** No `default_popup` is set in `action`. This allows `chrome.action.onClicked` to fire, which the background service worker uses to open the side panel programmatically.

### Permissions rationale

| Permission | Why |
|------------|-----|
| `sidePanel` | Required for Side Panel API |
| `downloads` | Download converted .md files to user's filesystem |
| `storage` | Persist user preferences (dark mode, last-used settings) |
| `contextMenus` | Right-click a file link → "Convert to Markdown" |
| `activeTab` | Read current page HTML for "convert this page" feature |

---

## 3. Three Entry Points

### 3.1 Popup (`popup.html` + `popup.tsx`)

The popup is a **thin redirect layer**. When the user clicks the extension icon:

1. Background service worker intercepts `chrome.action.onClicked` and opens the side panel
2. `popup.html` exists as a fallback but is rarely seen (the click handler fires first)

If somehow the popup does render, it shows a minimal "Opening MarkItDown..." message with a manual "Open Side Panel" button.

```typescript
// src/entries/popup.tsx
import { createRoot } from 'react-dom/client';

function PopupLauncher() {
  const openSidePanel = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      await chrome.sidePanel.open({ tabId: tab.id });
      window.close(); // Close the popup
    }
  };

  return (
    <div style={{ padding: '16px', textAlign: 'center', minWidth: '200px' }}>
      <p>Opening MarkItDown...</p>
      <button onClick={openSidePanel}>Open Side Panel</button>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<PopupLauncher />);
```

### 3.2 Side Panel (`sidepanel.html` + `sidepanel.tsx`)

The side panel is the **lightweight hub**. It provides:
- Quick file conversion (upload button, not full drag-drop area)
- Recent files list
- Basic markdown preview
- **"Open in new window" button** — pops out to the full experience

```typescript
// src/entries/sidepanel.tsx — conceptual layout
import { SidePanelApp } from '../components/extension/SidePanelApp';

function SidePanelEntry() {
  return <SidePanelApp />;
}

createRoot(document.getElementById('root')!).render(<SidePanelEntry />);
```

```typescript
// src/components/extension/SidePanelApp.tsx — conceptual
function SidePanelApp() {
  return (
    <div className="side-panel-layout">
      <ExtensionHeader />
      <button onClick={openPopupWindow}>
        <ExpandIcon /> Open in new window
      </button>
      <CompactFileUpload />
      <FileList />
      <CompactMarkdownPreview />
      <ActionButtons />
    </div>
  );
}

async function openPopupWindow() {
  chrome.windows.create({
    type: 'popup',
    url: chrome.runtime.getURL('window.html'),
    width: 1200,
    height: 800,
  });
}
```

### 3.3 Popup Window (`window.html` + `window.tsx`)

The popup window is the **full converter experience** — equivalent to the current SPA:
- Full-width drag-drop area
- Side-by-side file list + markdown preview
- All action buttons (copy, download)
- No "pop out" button (already in a window)

```typescript
// src/entries/window.tsx
import { WindowApp } from '../components/extension/WindowApp';

function WindowEntry() {
  return <WindowApp />;
}

createRoot(document.getElementById('root')!).render(<WindowEntry />);
```

```typescript
// src/components/extension/WindowApp.tsx — wraps existing App-like layout
function WindowApp() {
  return (
    <div className="window-layout">
      <ExtensionHeader />
      <FileUpload />          {/* Full drag-drop area */}
      <FileList />
      <MarkdownPreview />     {/* Full width preview */}
      <ActionButtons />
    </div>
  );
}
```

---

## 4. Background Service Worker

The background service worker handles three responsibilities:

### 4.1 Open Side Panel on Extension Icon Click

```typescript
// src/entries/background.ts
chrome.action.onClicked.addListener((tab) => {
  if (tab?.id) {
    chrome.sidePanel.open({ tabId: tab.id });
  }
});
```

This requires that `action.default_popup` is **not** set in the manifest. When no popup is set, clicking the icon fires `onClicked` instead of opening a popup.

### 4.2 Popup Window Management

The side panel calls `chrome.windows.create()` directly — no background worker involvement needed. The side panel already has access to the `chrome.windows` API with the current permissions. If `windows` permission is needed, add it to the manifest.

### 4.3 Context Menu: Right-Click → Convert

```typescript
// src/entries/background.ts
chrome.runtime.onInstalled.addListener(() => {
  // Context menu for links to supported file types
  chrome.contextMenus.create({
    id: 'convert-link-to-markdown',
    title: 'Convert this link to Markdown',
    contexts: ['link'],
    documentUrlPatterns: ['<all_urls>'],
  });

  // Context menu for converting the current page
  chrome.contextMenus.create({
    id: 'convert-page-to-markdown',
    title: 'Convert this page to Markdown',
    contexts: ['page'],
    documentUrlPatterns: ['<all_urls>'],
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  // Open side panel first
  if (tab?.id) {
    await chrome.sidePanel.open({ tabId: tab.id });
  }

  if (info.menuItemId === 'convert-link-to-markdown' && info.linkUrl) {
    // Fetch the linked file, convert, send result to side panel
    chrome.runtime.sendMessage({
      type: 'convert-url',
      url: info.linkUrl,
    });
  }

  if (info.menuItemId === 'convert-page-to-markdown') {
    // Grab current page HTML and send to side panel
    chrome.runtime.sendMessage({
      type: 'convert-page',
      tabId: tab?.id,
    });
  }
});
```

### Full background.ts outline

```typescript
// src/entries/background.ts

// --- Extension icon click → open side panel ---
chrome.action.onClicked.addListener((tab) => {
  if (tab?.id) {
    chrome.sidePanel.open({ tabId: tab.id });
  }
});

// --- Context menus ---
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'convert-link-to-markdown',
    title: 'Convert this link to Markdown',
    contexts: ['link'],
    documentUrlPatterns: ['<all_urls>'],
  });

  chrome.contextMenus.create({
    id: 'convert-page-to-markdown',
    title: 'Convert this page to Markdown',
    contexts: ['page'],
    documentUrlPatterns: ['<all_urls>'],
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (tab?.id) {
    await chrome.sidePanel.open({ tabId: tab.id });
  }

  if (info.menuItemId === 'convert-link-to-markdown' && info.linkUrl) {
    chrome.runtime.sendMessage({ type: 'convert-url', url: info.linkUrl });
  }

  if (info.menuItemId === 'convert-page-to-markdown' && tab?.id) {
    chrome.runtime.sendMessage({ type: 'convert-page', tabId: tab.id });
  }
});
```

---

## 5. Component Architecture

### Directory Structure

```
src/
├── entries/
│   ├── popup.tsx               # Thin redirect — opens side panel
│   ├── sidepanel.tsx           # Lightweight hub entry
│   ├── window.tsx              # Full popup window entry
│   └── background.ts          # Service worker: side panel, context menus
├── components/
│   ├── extension/              # Extension-specific components
│   │   ├── PopupLauncher.tsx   # Popup UI (fallback launcher)
│   │   ├── SidePanelApp.tsx    # Side panel layout with "pop out" button
│   │   ├── WindowApp.tsx       # Full window layout
│   │   └── ExtensionHeader.tsx # Extension-aware header
│   ├── FileUpload.tsx          # REUSE — minor styling tweaks
│   ├── FileList.tsx            # REUSE — minor styling tweaks
│   ├── MarkdownPreview.tsx     # REUSE — minor styling tweaks
│   └── ActionButtons.tsx       # MODIFY — chrome.downloads API
├── hooks/
│   └── useConversion.ts        # Extracted from App.tsx state logic
├── converters/                 # REUSE AS-IS (all 6 converters)
│   ├── PdfConverter.ts         # MINOR FIX — worker path resolution
│   ├── DocxConverter.ts
│   ├── XlsxConverter.ts
│   ├── PptxConverter.ts
│   ├── HtmlConverter.ts
│   └── OutlookMsgConverter.ts
├── core/                       # REUSE AS-IS
│   ├── MarkItDown.ts
│   └── types.ts
├── utils/
│   ├── fileDetection.ts        # REUSE AS-IS
│   └── llmClient.ts            # REUSE AS-IS (placeholder)
└── lib/
    └── utils.ts                # REUSE AS-IS
```

### Conversion Hook (extracted from App.tsx)

The state management in `App.tsx` (files array, selection, conversion loop) gets extracted into a reusable hook. All three entry points share this hook.

```typescript
// src/hooks/useConversion.ts
export function useConversion() {
  const [files, setFiles] = useState<FileResult[]>([]);
  const [selectedFileIndex, setSelectedFileIndex] = useState<number | null>(null);
  const [converter] = useState(() => new MarkItDown());

  const convertFiles = async (selectedFiles: File[]) => { /* ... */ };
  const removeFile = (index: number) => { /* ... */ };

  return { files, selectedFileIndex, setSelectedFileIndex, convertFiles, removeFile };
}
```

---

## 6. What to Reuse vs. Modify vs. Replace

### ✅ Reuse As-Is (zero changes)

| Module | Reason |
|--------|--------|
| `src/core/types.ts` | Pure TypeScript interfaces/classes, no DOM deps |
| `src/core/MarkItDown.ts` | Orchestrator — takes ArrayBuffer, returns string |
| `src/converters/DocxConverter.ts` | Uses mammoth + DOMParser (available in extension) |
| `src/converters/XlsxConverter.ts` | Uses xlsx library, no DOM deps |
| `src/converters/PptxConverter.ts` | Uses JSZip + DOMParser |
| `src/converters/HtmlConverter.ts` | Uses DOMParser |
| `src/converters/OutlookMsgConverter.ts` | Uses msgreader library |
| `src/utils/fileDetection.ts` | Pure string matching |
| `src/components/FileList.tsx` | React component, no web-specific APIs |
| `src/components/MarkdownPreview.tsx` | Uses `marked` library, works anywhere |
| `src/lib/utils.ts` | Pure utility functions |

### 🔧 Minor Modifications

| Module | Change | Why |
|--------|--------|-----|
| `src/converters/PdfConverter.ts` | Worker URL resolution | Must use `chrome.runtime.getURL()` in extension context instead of Vite's `?worker&url` import |
| `src/components/FileUpload.tsx` | Styling tweaks | Adjust padding/size for side panel width (~400px) |
| `src/components/ActionButtons.tsx` | Download mechanism | Replace `<a download>` blob URL with `chrome.downloads.download()` API |

### 🔄 Replace

| Module | Replacement | Why |
|--------|-------------|-----|
| `src/App.tsx` | `src/components/extension/SidePanelApp.tsx` + `WindowApp.tsx` + `src/hooks/useConversion.ts` | App.tsx is SPA-specific (full-page layout, cache-clearing, popovers). Replace with extension-aware layouts. |
| `src/main.tsx` | `src/entries/popup.tsx` + `sidepanel.tsx` + `window.tsx` | Three entry points instead of one SPA entry |
| `index.html` | `popup.html` + `sidepanel.html` + `window.html` | Extension HTML shells |
| `vite.config.ts` | `vite.config.extension.ts` | Multi-entry build with extension output structure |

---

## 7. Key Technical Challenges & Solutions

### 7.1 PDF.js Worker in Extension Context

**Problem:** `PdfConverter.ts` uses `import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?worker&url'` which is a Vite-specific syntax. In a Chrome extension, the worker must be loaded from the extension's own files.

**Solution:**

```typescript
// src/converters/PdfConverter.ts — modified section
async convert(fileStream: ArrayBuffer, streamInfo: StreamInfo): Promise<DocumentConverterResult> {
  const pdfjs = await import('pdfjs-dist');

  // Resolve worker URL for extension context
  if (typeof chrome !== 'undefined' && chrome.runtime?.getURL) {
    pdfjs.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL('assets/pdf.worker.mjs');
  } else {
    // Fallback for SPA mode (dev/testing)
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.mjs',
      import.meta.url
    ).toString();
  }

  const pdf = await pdfjs.getDocument({ data: fileStream }).promise;
  // ... rest unchanged
}
```

During build, copy `pdf.worker.mjs` from `node_modules` to `dist/assets/`.

### 7.2 Extension Icon Click → Side Panel

**Problem:** By default, clicking the extension icon opens `default_popup` if set. We want it to open the side panel instead.

**Solution:** Do **not** set `action.default_popup` in the manifest. This allows `chrome.action.onClicked` to fire. The background service worker then calls `chrome.sidePanel.open()`:

```typescript
// src/entries/background.ts
chrome.action.onClicked.addListener((tab) => {
  if (tab?.id) {
    chrome.sidePanel.open({ tabId: tab.id });
  }
});
```

`popup.html` still exists as a fallback if the side panel API fails, but it won't be the default click behavior.

### 7.3 Side Panel → Popup Window ("Pop Out")

**Problem:** The side panel is narrow (~400px). Some users want the full experience.

**Solution:** A "Open in new window" button in the side panel calls:

```typescript
async function openPopupWindow() {
  chrome.windows.create({
    type: 'popup',
    url: chrome.runtime.getURL('window.html'),
    width: 1200,
    height: 800,
  });
}
```

This opens `window.html` in a standalone popup window with no address bar, full width, and all features. The side panel can stay open or the user can close it — the window is independent.

**State sharing between side panel and popup window:** If needed, use `chrome.storage.session` for ephemeral data (currently converting files, recent conversions). For v1, each surface manages its own state independently.

### 7.4 Context Menu: Right-Click → Convert

Add context menus for links and pages:

```typescript
// src/entries/background.ts
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'convert-link-to-markdown',
    title: 'Convert this link to Markdown',
    contexts: ['link'],
    documentUrlPatterns: ['<all_urls>'],
  });

  chrome.contextMenus.create({
    id: 'convert-page-to-markdown',
    title: 'Convert this page to Markdown',
    contexts: ['page'],
    documentUrlPatterns: ['<all_urls>'],
  });
});
```

### 7.5 Convert Current Page (HTML)

With `activeTab` permission, the side panel can grab the current tab's HTML and pass it through `HtmlConverter`:

```typescript
// In side panel or window
async function convertCurrentPage() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => document.documentElement.outerHTML
  });
  const html = results[0].result;
  // Feed to HtmlConverter
}
```

This requires adding `"scripting"` permission. Consider for v2.

### 7.6 Content Security Policy

MV3 CSP is `script-src 'self'`. This means:
- ✅ All JS must be in bundled files (Vite handles this)
- ✅ No `eval()`, no inline `<script>` tags
- ✅ `worker-src 'self' blob:` needed for PDF.js web worker
- ⚠️ `dangerouslySetInnerHTML` in `MarkdownPreview.tsx` is fine — CSP governs script execution, not innerHTML. The `marked` library outputs HTML, not scripts.

---

## 8. Build Pipeline

### Tool: Manual multi-entry Vite (no extra dependencies)

**Why manual over CRXJS:** CRXJS has had compatibility issues with Vite 5 and MV3 quirks. Manual gives full control over the output structure, which matters for extension compliance. No new dependencies.

### vite.config.extension.ts

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      include: ['buffer', 'stream', 'util', 'process', 'events'],
      globals: { Buffer: true, global: true, process: true },
    }),
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'popup.html'),
        sidepanel: resolve(__dirname, 'sidepanel.html'),
        window: resolve(__dirname, 'window.html'),
        background: resolve(__dirname, 'src/entries/background.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: 'assets/[name].[ext]',
      },
    },
  },
});
```

### HTML Entry Points

**popup.html** (at project root):
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>body { width: 200px; min-height: 100px; margin: 0; }</style>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/entries/popup.tsx"></script>
</body>
</html>
```

**sidepanel.html** (at project root):
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/entries/sidepanel.tsx"></script>
</body>
</html>
```

**window.html** (at project root):
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/entries/window.tsx"></script>
</body>
</html>
```

### Build Scripts

```json
{
  "scripts": {
    "dev:extension": "vite build --config vite.config.extension.ts --watch",
    "build:extension": "tsc -b && vite build --config vite.config.extension.ts && npm run copy:assets",
    "copy:assets": "cp node_modules/pdfjs-dist/build/pdf.worker.mjs dist/assets/pdf.worker.mjs",
    "package:extension": "npm run build:extension && cd dist && zip -r ../markitdown-extension.zip ."
  }
}
```

### Development Workflow

1. `npm run dev:extension` — builds in watch mode
2. Load `dist/` as unpacked extension in `chrome://extensions`
3. On code change, Vite rebuilds → click "Refresh" in chrome://extensions
4. For faster iteration, consider adding CRXJS later

---

## 9. Implementation Phases

### Phase 1: Shell (2-3 hours)
- [ ] Create `manifest.json` (no `default_popup`, side panel config)
- [ ] Create `popup.html` + `sidepanel.html` + `window.html`
- [ ] Create `vite.config.extension.ts` (three HTML entries + background)
- [ ] Create `src/entries/background.ts` (side panel open on icon click)
- [ ] Create `src/entries/popup.tsx` (fallback launcher)
- [ ] Create `src/entries/sidepanel.tsx` (imports existing components)
- [ ] Create `src/entries/window.tsx` (imports existing components)
- [ ] Copy PDF.js worker to dist
- [ ] Verify extension loads, icon click opens side panel, side panel "pop out" opens window

### Phase 2: Side Panel UI (2-3 hours)
- [ ] Extract `useConversion` hook from `App.tsx`
- [ ] Build `SidePanelApp` component — compact layout with "Open in new window" button
- [ ] Build `WindowApp` component — full layout (equivalent to current SPA)
- [ ] Adjust layout for ~400px width side panel
- [ ] Fix `ActionButtons` download to use `chrome.downloads.download()`
- [ ] Wire up dark mode with `chrome.storage.local`
- [ ] Test all 6 file formats

### Phase 3: PDF.js Worker Fix (1 hour)
- [ ] Update `PdfConverter.ts` worker URL resolution
- [ ] Test PDF conversion in extension context
- [ ] Verify no CSP violations

### Phase 4: Context Menu & Background (1-2 hours)
- [ ] Add context menu for file links ("Convert this link to Markdown")
- [ ] Add context menu for pages ("Convert this page to Markdown")
- [ ] Background service worker: fetch URL → convert → send to side panel
- [ ] Handle message passing between background and side panel
- [ ] Handle `activeTab` for "convert current page" (stretch goal)

### Phase 5: Polish & Package (2-3 hours)
- [ ] Generate extension icons (16, 48, 128)
- [ ] Dark mode persistence via `chrome.storage.local`
- [ ] Test on Chrome + Edge
- [ ] Check memory usage with large files
- [ ] Write README extension section
- [ ] Package as .zip

**Total estimate: 8-12 hours**

---

## 10. What NOT to Do

- ❌ Don't keep the SPA build alongside the extension build. Separate configs are fine, but don't try to make one `vite.config.ts` do both.
- ❌ Don't use `background.persistent: true` — it's MV2. Use service workers.
- ❌ Don't over-engineer the popup. It's a launcher redirect. The side panel is the default app.
- ❌ Don't add a "new tab" option. Side panel + popup window only.
- ❌ Don't use `chrome.fileSystem` API — it's Chrome OS only. Stick with `<input type="file">` and drag-drop.
- ❌ Don't try to load files from the user's filesystem without explicit file picker interaction.
- ❌ Don't bundle Tailwind CSS JIT in the extension. Use a pre-built Tailwind CSS file or switch to inline styles via the existing `cn()` utility. **Prefer generating a static CSS file during build.**
- ❌ Don't add `action.default_popup` to the manifest — it blocks `onClicked` from firing.

---

## 11. Dependencies Assessment

### All existing npm dependencies work in extension context

| Dependency | Extension-compatible? | Notes |
|-----------|----------------------|-------|
| `pdfjs-dist` | ✅ | Worker needs path fix |
| `mammoth` | ✅ | Pure JS, takes ArrayBuffer |
| `xlsx` (SheetJS) | ✅ | Pure JS |
| `jszip` | ✅ | Pure JS |
| `@kenjiuno/msgreader` | ✅ | Pure JS, takes ArrayBuffer |
| `marked` | ✅ | Pure JS string transform |
| `react` + `react-dom` | ✅ | Standard |
| `lucide-react` | ✅ | SVG icons, no DOM deps |
| `tailwind-merge` + `clsx` | ✅ | String utilities |
| `buffer`, `stream-browserify`, `process`, `events`, `util` | ✅ | Polyfills, bundled by Vite |

**No new dependencies needed.**

---

## 12. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| PDF.js worker blocked by CSP | Medium | High | Pre-test worker loading; fallback to non-worker mode (`workerSrc: ''`) |
| Side Panel API not available in older Chrome | Low | Medium | Feature-detect; fall back to popup window only |
| Large file conversion OOMs in extension | Low | Medium | Add file size warning (>50MB); extension has same memory as web pages |
| Vite node polyfills cause bundle bloat | Medium | Low | Tree-shake; only include needed polyfills |
| `chrome.downloads` requires user gesture | Low | Low | Download is always triggered by button click (user gesture) |
| State sync between side panel and popup window | Low | Low | For v1, keep independent state. Use `chrome.storage.session` if sync needed later |
| `onClicked` doesn't fire because `default_popup` is set | Medium | High | Ensure manifest has **no** `action.default_popup` key |

---

## 13. File Change Summary

### New files (14)
```
manifest.json
popup.html
sidepanel.html
window.html
vite.config.extension.ts
src/entries/popup.tsx
src/entries/sidepanel.tsx
src/entries/window.tsx
src/entries/background.ts
src/hooks/useConversion.ts
src/components/extension/SidePanelApp.tsx
src/components/extension/WindowApp.tsx
src/components/extension/PopupLauncher.tsx
assets/icons/icon-{16,48,128}.png
```

### Modified files (2)
```
src/converters/PdfConverter.ts          — worker URL resolution
src/components/ActionButtons.tsx         — chrome.downloads API
```

### Deleted/replaced files (3)
```
src/App.tsx             → replaced by SidePanelApp + WindowApp + useConversion hook
src/main.tsx            → replaced by entries/popup.tsx + entries/sidepanel.tsx + entries/window.tsx
index.html              → replaced by popup.html + sidepanel.html + window.html
```

### Unchanged files (10)
```
src/core/MarkItDown.ts
src/core/types.ts
src/converters/DocxConverter.ts
src/converters/XlsxConverter.ts
src/converters/PptxConverter.ts
src/converters/HtmlConverter.ts
src/converters/OutlookMsgConverter.ts
src/utils/fileDetection.ts
src/components/FileUpload.tsx
src/components/FileList.tsx
src/components/MarkdownPreview.tsx
src/lib/utils.ts
```
