import { useState, useCallback } from 'react';
import { MarkItDown } from '../core/MarkItDown';
import type { DocumentConverterResult } from '../core/types';

export interface FileResult {
  file: File;
  result: DocumentConverterResult | null;
  error: string | null;
  loading: boolean;
}

export function useConversion() {
  const [files, setFiles] = useState<FileResult[]>([]);
  const [selectedFileIndex, setSelectedFileIndex] = useState<number | null>(null);
  const [converter] = useState(() => new MarkItDown());

  const convertFiles = useCallback(async (selectedFiles: File[]) => {
    const startIndex = files.length;

    const newFiles: FileResult[] = selectedFiles.map(file => ({
      file,
      result: null,
      error: null,
      loading: true,
    }));

    setFiles(prev => [...prev, ...newFiles]);

    // Auto-select first file if nothing selected
    if (startIndex === 0) {
      setSelectedFileIndex(0);
    }

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const index = startIndex + i;

      try {
        const result = await converter.convert(file);
        setFiles(prev => {
          const updated = [...prev];
          if (updated[index]) {
            updated[index] = { ...updated[index], result, loading: false };
          }
          return updated;
        });
      } catch (err) {
        setFiles(prev => {
          const updated = [...prev];
          if (updated[index]) {
            updated[index] = {
              ...updated[index],
              error: err instanceof Error ? err.message : 'Conversion failed',
              loading: false,
            };
          }
          return updated;
        });
      }
    }
  }, [converter, files.length]);

  const removeFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setSelectedFileIndex(prev => {
      if (prev === index) return null;
      if (prev !== null && prev > index) return prev - 1;
      return prev;
    });
  }, []);

  const clearFiles = useCallback(() => {
    setFiles([]);
    setSelectedFileIndex(null);
  }, []);

  return {
    files,
    selectedFileIndex,
    setSelectedFileIndex,
    convertFiles,
    removeFile,
    clearFiles,
  };
}
