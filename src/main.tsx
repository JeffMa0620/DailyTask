import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MainPage } from './pages/MainPage';
import './styles/app.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MainPage />
  </StrictMode>,
);
