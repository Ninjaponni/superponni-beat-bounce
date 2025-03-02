
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Global error handling
window.onerror = function(message, source, lineno, colno, error) {
  console.error('Global error caught:', message);
  
  // Add safety net for common global objects
  if (!window.hasOwnProperty('gameConfig')) {
    window.gameConfig = {
      physics: {
        gravity: 9.8,
        airResistance: 0.99,
        bounceFactor: 0.8,
        maxSpeed: 5
      },
      difficulty: 'normal'
    };
  }
  
  return false;
};

createRoot(document.getElementById("root")!).render(<App />);
