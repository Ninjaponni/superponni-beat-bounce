
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { RhythmEngine } from './utils/RhythmEngine.ts'
import DebugPanel from './components/debug/DebugPanel.tsx'

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
      difficulty: 'normal',
      audio: {
        enabled: true,
        volume: 0.7
      }
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

// Initialize debug logs array if it doesn't exist
if (!window._debugLogs) {
  window._debugLogs = [];
  console.log("Debug logs initialized");
}

const rootElement = document.getElementById("root");

if (rootElement) {
  createRoot(rootElement).render(
    <>
      <App />
      <DebugPanel />
    </>
  );
} else {
  console.error("Root element not found");
}
