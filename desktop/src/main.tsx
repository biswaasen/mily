import React from 'react';
import { createRoot } from 'react-dom/client';
import { Panel } from './components/panel';

const container = document.getElementById('root');
if (!container) throw new Error('Root element not found');
createRoot(container).render(
  <React.StrictMode>
    <Panel />
  </React.StrictMode>
);
