import { createRoot } from 'react-dom/client';
import '../index.css';

function PopupLauncher() {
  const openSidePanel = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      await chrome.sidePanel.open({ tabId: tab.id });
      window.close();
    }
  };

  const openWindow = () => {
    chrome.windows.create({
      url: chrome.runtime.getURL('window.html'),
      type: 'popup',
      width: 900,
      height: 700,
    });
    window.close();
  };

  return (
    <div className="w-64 p-4 bg-background">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/20">
          <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        </div>
        <div>
          <h1 className="text-sm font-bold">MarkItDown</h1>
          <p className="text-xs text-muted-foreground">Convert to Markdown</p>
        </div>
      </div>

      <div className="space-y-2">
        <button
          onClick={openSidePanel}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium rounded-xl border border-transparent bg-gradient-to-r from-primary to-primary/90 text-primary-foreground hover:from-primary/90 hover:to-primary hover:shadow-lg hover:shadow-primary/25 transition-all duration-200 active:scale-[0.98]"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
          </svg>
          Open Side Panel
        </button>

        <button
          onClick={openWindow}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium rounded-xl border border-border/60 bg-card/80 hover:bg-muted hover:border-primary/30 hover:shadow-md transition-all duration-200 active:scale-[0.98]"
        >
          <svg className="w-4 h-4 text-foreground/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
          <span className="text-foreground/80">Open in Window</span>
        </button>
      </div>

      <p className="mt-3 text-[10px] text-muted-foreground/60 text-center">
        PDF · DOCX · XLSX · PPTX · HTML · MSG
      </p>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<PopupLauncher />);
