import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Immediately evict any stale service workers and caches from previous builds
if (typeof window !== 'undefined') {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister();
      }
    }).catch(() => {});
  }
  if ('caches' in window) {
    caches.keys().then((keys) => {
      keys.forEach((key) => caches.delete(key));
    }).catch(() => {});
  }
}

createRoot(document.getElementById('root')!).render(<App />);
