
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Global error handling to catch 'lov' errors
window.onerror = function(message, source, lineno, colno, error) {
  console.error('Global error caught:', message);
  
  if (message.toString().includes("'lov'") || message.toString().includes('"lov"')) {
    console.warn('Detected "lov" error, adding safety object');
    
    // Add safety net for common global objects
    if (!window.hasOwnProperty('gameConfig')) window.gameConfig = {};
    if (!window.gameConfig.hasOwnProperty('lov')) {
      window.gameConfig.lov = {
        enabled: true,
        maxSpeed: 5,
        bounceHeight: 2,
        gravity: 9.8
      };
    }
  }
  
  return false;
};

// Declare global interface for TypeScript
declare global {
  interface Window {
    gameConfig?: any;
    gameScene?: THREE.Scene;
    gameBass?: THREE.Object3D;
  }
}

createRoot(document.getElementById("root")!).render(<App />);
