import React from 'react';
import { createRoot } from 'react-dom/client';
import { Dialog } from './components/dialog';

const container = document.getElementById('root');
if (!container) throw new Error('Root element not found');

createRoot(container).render(
  <div style={{ height: '100%', width: '100%' }}>
    <Dialog />
  </div>
);
