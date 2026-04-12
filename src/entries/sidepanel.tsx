import { createRoot } from 'react-dom/client';
import { ConverterApp } from '../components/ConverterApp';
import '../index.css';

function SidePanelEntry() {
  return <ConverterApp compact />;
}

createRoot(document.getElementById('root')!).render(<SidePanelEntry />);
