// Placeholder: imports existing components, renders compact side panel layout.
// Will be wired up in Phase 2 (Side Panel UI).
import { createRoot } from 'react-dom/client';

function SidePanelEntry() {
  return (
    <div style={{ padding: '16px' }}>
      <h2>MarkItDown — Side Panel</h2>
      <p>Converter UI will be wired here in Phase 2.</p>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<SidePanelEntry />);
