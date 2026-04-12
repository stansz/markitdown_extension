// Placeholder: imports existing components, renders full window layout.
// Will be wired up in Phase 2 (Side Panel UI).
import { createRoot } from 'react-dom/client';

function WindowEntry() {
  return (
    <div style={{ padding: '16px' }}>
      <h2>MarkItDown — Full Window</h2>
      <p>Full converter UI will be wired here in Phase 2.</p>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<WindowEntry />);
