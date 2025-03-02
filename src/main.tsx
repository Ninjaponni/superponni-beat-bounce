
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
        bass: {
          gravity: 9.8,
          airResistance: 0.99,
          bounceFactor: 0.8,
          maxSpeed: 5
        }
      },
      difficulty: 'normal'
    };
  }
  
  // Add safety net for rhythmEngine
  if (!window.hasOwnProperty('rhythmEngine')) {
    window.rhythmEngine = {
      synchronize: (startTime: number, beatInterval: number) => {
        console.log(`Fallback rhythm engine synchronized with startTime: ${startTime}, beatInterval: ${beatInterval}`);
      }
    };
  }
  
  return false;
};

createRoot(document.getElementById("root")!).render(<App />);
