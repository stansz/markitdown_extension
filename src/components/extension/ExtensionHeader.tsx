interface ExtensionHeaderProps {
  onToggleDarkMode?: () => void;
  darkMode?: boolean;
  onOpenWindow?: () => void;
  compact?: boolean;
}

export function ExtensionHeader({ onToggleDarkMode, darkMode, onOpenWindow, compact }: ExtensionHeaderProps) {
  return (
    <header className="relative border-b bg-card/60 backdrop-blur-md z-40">
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      <div className={compact ? 'px-3 py-3' : 'container mx-auto px-4 py-4'}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className={`rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/20 flex items-center justify-center ${compact ? 'p-2' : 'p-3'}`}>
                <svg
                  className={compact ? 'w-5 h-5 text-primary' : 'w-8 h-8 text-primary'}
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
              <h1 className={compact ? 'text-base font-bold tracking-tight' : 'text-xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text'}>
                MarkItDown
              </h1>
              <p className="text-xs text-muted-foreground/80">
                Convert to Markdown
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenWindow && (
              <button
                onClick={onOpenWindow}
                className="group p-2 rounded-xl bg-muted/40 hover:bg-muted border border-transparent hover:border-primary/20 transition-all duration-300 hover:scale-105"
                title="Open in new window"
              >
                <svg className="w-4 h-4 text-foreground/80 group-hover:text-foreground transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
              </button>
            )}
            {onToggleDarkMode && (
              <button
                onClick={onToggleDarkMode}
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
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
