
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { RhythmEngine } from './utils/RhythmEngine.ts'

// Global error handling
window.onerror = function(message, source, lineno, colno, error) {
  console.error('Global error caught:', message);
  
  // Add safety net for common global objects
  if (!window.hasOwnProperty('gameConfig')) {
    window.gameConfig = {
      physics: {
        bass: {
          enabled: true,
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
    // Create a proper fallback RhythmEngine instance
    window.rhythmEngine = new RhythmEngine(130);
    
    // Make sure all required methods are available
    console.log("Created fallback RhythmEngine");
  }
  
  return false;
};

createRoot(document.getElementById("root")!).render(<App />);
