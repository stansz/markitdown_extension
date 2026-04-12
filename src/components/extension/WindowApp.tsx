import { useState, useEffect } from 'react';
import { ExtensionHeader } from './ExtensionHeader';
import { FileUpload } from '../FileUpload';
import { FileList } from '../FileList';
import { MarkdownPreview } from '../MarkdownPreview';
import { ActionButtons } from '../ActionButtons';
import { useConversion } from '../../hooks/useConversion';

export function WindowApp() {
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
    <div className="min-h-screen flex flex-col">
      <ExtensionHeader
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
      />

      <main className="container mx-auto px-4 py-8 flex-1">
        {files.length === 0 ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-full max-w-lg">
              <FileUpload onFilesSelected={convertFiles} />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Left Panel - Upload and File List */}
            <div className="lg:col-span-2 space-y-5">
              <FileUpload onFilesSelected={convertFiles} />
              {files.length > 0 && (
                <FileList
                  files={files}
                  selectedIndex={selectedFileIndex}
                  onSelect={setSelectedFileIndex}
                  onRemove={removeFile}
                />
              )}
            </div>

            {/* Right Panel - Preview and Actions */}
            {selectedFileIndex !== null && (
              <div className="lg:col-span-3">
                {selectedFile?.result ? (
                  <div className="space-y-5">
                    <ActionButtons
                      markdown={selectedFile.result.markdown}
                      filename={selectedFile.file.name}
                    />
                    <MarkdownPreview markdown={selectedFile.result.markdown} />
                  </div>
                ) : selectedFile?.loading ? (
                  <div className="h-full min-h-[400px] flex items-center justify-center">
                    <div className="text-center p-8 rounded-2xl bg-card border-2 shadow-sm">
                      <div className="relative w-16 h-16 mx-auto mb-4">
                        <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                        <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                      </div>
                      <p className="text-muted-foreground font-medium">Converting document...</p>
                      <p className="text-sm text-muted-foreground/70 mt-1">{selectedFile.file.name}</p>
                    </div>
                  </div>
                ) : selectedFile?.error ? (
                  <div className="h-full min-h-[400px] flex items-center justify-center">
                    <div className="text-center p-8 rounded-2xl bg-destructive/5 border-2 border-destructive/20 shadow-sm max-w-sm">
                      <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                        <svg className="w-7 h-7 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                        </svg>
                      </div>
                      <p className="font-semibold text-destructive">Conversion Failed</p>
                      <p className="text-sm text-muted-foreground mt-2">{selectedFile.error}</p>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="border-t bg-card/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              100% client-side •{' '}
              <a
                href="https://github.com/stansz/markitdown_extension"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline font-medium"
              >
                GitHub
              </a>
            </p>
            {files.length > 0 && (
              <button
                onClick={clearFiles}
                className="text-xs text-muted-foreground hover:text-destructive transition-colors"
              >
                Clear all files
              </button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
