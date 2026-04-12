import { useState, useEffect } from 'react';
import { ExtensionHeader } from './ExtensionHeader';
import { FileUpload } from '../FileUpload';
import { FileList } from '../FileList';
import { MarkdownPreview } from '../MarkdownPreview';
import { ActionButtons } from '../ActionButtons';
import { useConversion } from '../../hooks/useConversion';
import { openPopupWindow } from '../../utils/extension';

export function SidePanelApp() {
  const { files, selectedFileIndex, setSelectedFileIndex, convertFiles, removeFile, clearFiles } = useConversion();
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  // Persist / load dark mode via chrome.storage
  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.get('darkMode', (result: { darkMode?: boolean }) => {
        if (result.darkMode !== undefined) setDarkMode(result.darkMode);
      });
    }
  }, []);

  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.set({ darkMode });
    }
  }, [darkMode]);

  const selectedFile = selectedFileIndex !== null ? files[selectedFileIndex] : null;

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <ExtensionHeader
        compact
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        onOpenWindow={openPopupWindow}
      />

      <main className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {files.length === 0 ? (
          <div className="flex items-center justify-center" style={{ minHeight: '50vh' }}>
            <FileUpload onFilesSelected={convertFiles} />
          </div>
        ) : (
          <>
            <FileUpload onFilesSelected={convertFiles} />
            <FileList
              files={files}
              selectedIndex={selectedFileIndex}
              onSelect={setSelectedFileIndex}
              onRemove={removeFile}
            />

            {selectedFile?.result && (
              <div className="space-y-3">
                <ActionButtons
                  markdown={selectedFile.result.markdown}
                  filename={selectedFile.file.name}
                />
                <MarkdownPreview markdown={selectedFile.result.markdown} />
              </div>
            )}

            {selectedFile?.loading && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center p-6 rounded-2xl bg-card border-2 shadow-sm">
                  <div className="relative w-12 h-12 mx-auto mb-3">
                    <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                    <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                  </div>
                  <p className="text-muted-foreground font-medium text-sm">Converting...</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">{selectedFile.file.name}</p>
                </div>
              </div>
            )}

            {selectedFile?.error && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center p-6 rounded-2xl bg-destructive/5 border-2 border-destructive/20 shadow-sm max-w-xs">
                  <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-3">
                    <svg className="w-5 h-5 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                    </svg>
                  </div>
                  <p className="font-semibold text-destructive text-sm">Conversion Failed</p>
                  <p className="text-xs text-muted-foreground mt-1">{selectedFile.error}</p>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <footer className="border-t px-3 py-2 bg-card/50">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            100% client-side • No data leaves your device
          </p>
          {files.length > 0 && (
            <button
              onClick={clearFiles}
              className="text-xs text-muted-foreground hover:text-destructive transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
