import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

function render(container: HTMLElement, vscode: any) {
  const root = createRoot(container);
  root.render(<App vscode={vscode} />);
}

(window as any).ReactApp = { render };