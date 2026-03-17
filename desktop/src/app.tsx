import React from 'react';
import { createRoot } from 'react-dom/client';
import { Dialog } from './components/dialog';

const container = document.getElementById('root');
if (!container) throw new Error('Root element not found');

const root = createRoot(container);
root.render(
  <div className="h-full w-full">
    <Dialog />
  </div>
);

