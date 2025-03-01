
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Global error handling to catch 'lov' errors
window.onerror = function(message, source, lineno, colno, error) {
  console.error('Global error caught:', message);
  
  if (message.toString().includes("'lov'") || message.toString().includes('"lov"')) {
    console.warn('Detected "lov" error, adding safety object');
    
    // Add safety net for common global objects
    if (!window.hasOwnProperty('gameConfig')) {
      window.gameConfig = {
        physics: {
          lov: {
            enabled: true,
            maxSpeed: 5,
            gravity: 9.8,
            airResistance: 0.99,
            bounceFactor: 0.8
          }
        },
        difficulty: 'normal'
      };
    }
  }
  
  return false;
};

// Install 'lov' property access tracker
const installLovTracker = () => {
  console.log("Installing 'lov' property access tracker");
  
  // Override the property descriptor for 'lov'
  Object.defineProperty(Object.prototype, 'lov', {
    configurable: true,
    enumerable: false,
    get: function() {
      // Skip tracking for native objects
      if (this === null || this === undefined || this === window || 
          this === document || this instanceof Node) {
        return this._lov;
      }
      
      console.log(`'lov' property accessed on:`, this);
      console.trace(); // Print stack trace
      
      // Create default 'lov' object if missing
      if (this._lov === undefined) {
        console.warn("Creating default 'lov' property");
        this._lov = {
          enabled: true,
          maxSpeed: 5,
          gravity: 9.8,
          airResistance: 0.99,
          bounceFactor: 0.8
        };
      }
      
      return this._lov;
    },
    set: function(value) {
      console.log(`'lov' property set to:`, value, "on:", this);
      this._lov = value;
    }
  });
};

// Call the function
installLovTracker();

createRoot(document.getElementById("root")!).render(<App />);
