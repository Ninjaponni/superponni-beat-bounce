import React, { useState, useEffect } from 'react';
import './DebugPanel.css';

interface DebugPanelProps {
  // No props needed
}

const DebugPanel: React.FC<DebugPanelProps> = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [logs, setLogs] = useState<Array<{ level: string; message: string; timestamp: Date }>>([]);
  
  useEffect(() => {
    // Initialize debug logs array if it doesn't exist
    if (!window._debugLogs) {
      window._debugLogs = [];
    }
    
    // Log panel initialization
    addLog('info', 'Debug panel initialized');
    
    // Set up console interception
    const originalConsoleLog = console.log;
    const originalConsoleWarn = console.warn;
    const originalConsoleError = console.error;
    
    console.log = function(...args) {
      addLog('info', args.map(arg => String(arg)).join(' '));
      originalConsoleLog.apply(console, args);
    };
    
    console.warn = function(...args) {
      addLog('warn', args.map(arg => String(arg)).join(' '));
      originalConsoleWarn.apply(console, args);
    };
    
    console.error = function(...args) {
      addLog('error', args.map(arg => String(arg)).join(' '));
      originalConsoleError.apply(console, args);
    };
    
    // Set up keyboard shortcut (F12) to toggle panel
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'F12') {
        event.preventDefault();
        setIsVisible(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    // Set up periodic update of logs from the global array
    const updateInterval = setInterval(() => {
      if (window._debugLogs) {
        setLogs([...window._debugLogs]);
      }
    }, 500);
    
    return () => {
      // Restore original console methods
      console.log = originalConsoleLog;
      console.warn = originalConsoleWarn;
      console.error = originalConsoleError;
      
      // Remove event listener and interval
      window.removeEventListener('keydown', handleKeyDown);
      clearInterval(updateInterval);
    };
  }, []);
  
  // Add log to global array
  const addLog = (level: string, message: string) => {
    if (!window._debugLogs) {
      window._debugLogs = [];
    }
    
    const logEntry = {
      level,
      message,
      timestamp: new Date()
    };
    
    window._debugLogs.push(logEntry);
    
    // Keep only the last 100 logs
    if (window._debugLogs.length > 100) {
      window._debugLogs.shift();
    }
  };
  
  if (!isVisible) {
    return (
      <div 
        className="debug-panel-toggle"
        onClick={() => setIsVisible(true)}
      >
        Debug (F12)
      </div>
    );
  }
  
  return (
    <div className="debug-panel">
      <div className="debug-panel-header">
        <h3>Debug Panel</h3>
        <button onClick={() => setIsVisible(false)}>X</button>
      </div>
      <div className="debug-panel-content">
        <div className="debug-logs">
          {logs.map((log, index) => (
            <div 
              key={index} 
              className={`log-entry log-${log.level}`}
            >
              <span className="log-time">
                {log.timestamp.toLocaleTimeString()}
              </span>
              <span className="log-level">
                [{log.level.toUpperCase()}]
              </span>
              <span className="log-message">
                {log.message}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="debug-panel-footer">
        <button 
          onClick={() => {
            if (window._debugLogs) {
              window._debugLogs = [];
              setLogs([]);
            }
          }}
        >
          Clear Logs
        </button>
      </div>
    </div>
  );
};

export default DebugPanel;
