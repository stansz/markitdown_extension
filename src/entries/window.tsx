import { createRoot } from 'react-dom/client';
import { ConverterApp } from '../components/ConverterApp';
import '../index.css';

function WindowEntry() {
  return <ConverterApp />;
}

createRoot(document.getElementById('root')!).render(<WindowEntry />);
