import { useState, useEffect, useCallback } from 'react';
import { FileUpload } from './FileUpload';
import { FileList } from './FileList';
import { MarkdownPreview } from './MarkdownPreview';
import { ActionButtons } from './ActionButtons';
import { MarkItDown } from '../core/MarkItDown';
import type { DocumentConverterResult } from '../core/types';

export interface FileResult {
  file: File;
  result: DocumentConverterResult | null;
  error: string | null;
  loading: boolean;
}

export interface ConverterAppProps {
  /** Compact mode for side panel (hides footer, reduces padding) */
  compact?: boolean;
  /** Called when files are received from external sources (context menu, messages) */
  onExternalFile?: (file: File) => void;
}

/**
 * Shared converter UI used by both sidepanel and window entry points.
 * Handles the full file → convert → preview → copy/download flow.
 */
export function ConverterApp({ compact = false, onExternalFile }: ConverterAppProps) {
  const [files, setFiles] = useState<FileResult[]>([]);
  const [selectedFileIndex, setSelectedFileIndex] = useState<number | null>(null);
  const [converter] = useState(() => new MarkItDown());
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Dark mode toggle
  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [darkMode]);

  // Listen for external files from context menu / background messages
  useEffect(() => {
    if (!onExternalFile) return;

    const handleMessage = (message: { type: string; fileData?: ArrayBuffer; fileName?: string }) => {
      if (message.type === 'convert-file' && message.fileData && message.fileName) {
        const file = new File([message.fileData], message.fileName);
        onExternalFile(file);
      }
    };

    if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
      chrome.runtime.onMessage.addListener(handleMessage);
      return () => chrome.runtime.onMessage.removeListener(handleMessage);
    }
  }, [onExternalFile]);

  const convertFile = useCallback(async (file: File, index: number) => {
    try {
      const result = await converter.convert(file);
      setFiles(prev => {
        const updated = [...prev];
        updated[index] = { ...updated[index], result, loading: false };
        return updated;
      });
      // Auto-select first successful conversion
      setSelectedFileIndex(prev => prev === null ? index : prev);
    } catch (err) {
      setFiles(prev => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          error: err instanceof Error ? err.message : 'Conversion failed',
          loading: false,
        };
        return updated;
      });
    }
  }, [converter]);

  const handleFilesSelected = useCallback((selectedFiles: File[]) => {
    const newFiles: FileResult[] = selectedFiles.map(file => ({
      file,
      result: null,
      error: null,
      loading: true,
    }));

    setFiles(prev => {
      const startIndex = prev.length;
      // Process each file after state update
      for (let i = 0; i < selectedFiles.length; i++) {
        convertFile(selectedFiles[i], startIndex + i);
      }
      return [...prev, ...newFiles];
    });
  }, [convertFile]);

  // Allow external files to be injected
  useEffect(() => {
    if (onExternalFile) {
      onExternalFile;
    }
  }, [onExternalFile]);

  const handleRemoveFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    if (selectedFileIndex === index) {
      setSelectedFileIndex(files.length > 1 ? 0 : null);
    } else if (selectedFileIndex !== null && selectedFileIndex > index) {
      setSelectedFileIndex(selectedFileIndex - 1);
    }
  };

  const selectedFile = selectedFileIndex !== null ? files[selectedFileIndex] : null;

  const pad = compact ? 'p-3' : 'px-4 py-5';

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <header className="relative border-b bg-card/60 backdrop-blur-md z-40">
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        <div className={`${compact ? 'px-3 py-3' : 'container mx-auto px-4 py-4'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className={`${compact ? 'p-2' : 'p-3'} rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/20`}>
                  <svg
                    className={`${compact ? 'w-5 h-5' : 'w-8 h-8'} text-primary`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                </div>
                <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-card animate-pulse" />
              </div>
              <div>
                <h1 className={`${compact ? 'text-base' : 'text-2xl'} font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text`}>
                  MarkItDown
                </h1>
                <p className={`${compact ? 'text-xs' : 'text-sm'} text-muted-foreground/80`}>
                  Convert documents to Markdown
                </p>
              </div>
            </div>

            <button
              onClick={() => setDarkMode(!darkMode)}
              className="group p-2 rounded-xl bg-muted/40 hover:bg-muted border border-transparent hover:border-primary/20 transition-all duration-300 hover:scale-105"
              aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {darkMode ? (
                <svg className="w-4 h-4 text-foreground/80 group-hover:text-foreground transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-foreground/80 group-hover:text-foreground transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className={`${pad} flex-1 overflow-y-auto`}>
        {files.length === 0 ? (
          <div className="flex items-center justify-center" style={{ minHeight: compact ? '200px' : '60vh' }}>
            <div className="w-full">
              <FileUpload onFilesSelected={handleFilesSelected} />
            </div>
          </div>
        ) : (
          <div className={`grid gap-4 ${compact ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-5'}`}>
            {/* Left Panel - Upload and File List */}
            <div className={compact ? '' : 'lg:col-span-2 space-y-4'}>
              <FileUpload onFilesSelected={handleFilesSelected} />
              {files.length > 0 && (
                <FileList
                  files={files}
                  selectedIndex={selectedFileIndex}
                  onSelect={setSelectedFileIndex}
                  onRemove={handleRemoveFile}
                />
              )}
            </div>

            {/* Right Panel - Preview and Actions */}
            {files.length > 0 && selectedFileIndex !== null ? (
              <div className={compact ? '' : 'lg:col-span-3'}>
                {selectedFile?.result ? (
                  <div className="space-y-4">
                    <ActionButtons
                      markdown={selectedFile.result.markdown}
                      filename={selectedFile.file.name}
                    />
                    <MarkdownPreview markdown={selectedFile.result.markdown} />
                  </div>
                ) : selectedFile?.loading ? (
                  <div className="h-full flex items-center justify-center" style={{ minHeight: '200px' }}>
                    <div className="text-center p-6 rounded-2xl bg-card border-2 shadow-sm">
                      <div className="relative w-12 h-12 mx-auto mb-3">
                        <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                        <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                      </div>
                      <p className="text-muted-foreground font-medium text-sm">Converting...</p>
                      <p className="text-xs text-muted-foreground/70 mt-1">{selectedFile.file.name}</p>
                    </div>
                  </div>
                ) : selectedFile?.error ? (
                  <div className="h-full flex items-center justify-center" style={{ minHeight: '200px' }}>
                    <div className="text-center p-6 rounded-2xl bg-destructive/5 border-2 border-destructive/20 shadow-sm max-w-sm">
                      <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                        </svg>
                      </div>
                      <p className="font-semibold text-destructive text-sm">Conversion Failed</p>
                      <p className="text-xs text-muted-foreground mt-2">{selectedFile.error}</p>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        )}
      </main>

      {/* Footer — hidden in compact mode */}
      {!compact && (
        <footer className="border-t bg-card/50">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                100% client-side — your files never leave your device
              </p>
              <a
                href="https://github.com/stansz/markitdown_extension"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                GitHub
              </a>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
