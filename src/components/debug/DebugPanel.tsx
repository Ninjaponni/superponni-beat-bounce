
import React, { useState, useEffect } from 'react';

interface LogEntry {
  level: 'info' | 'warn' | 'error';
  message: string;
  timestamp: Date;
}

export const DebugPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  
  useEffect(() => {
    if (!isOpen) return;
    
    // Initialize _debugLogs if it doesn't exist
    if (!window._debugLogs) {
      window._debugLogs = [];
    }
    
    setLogs(window._debugLogs);
    
    // Setup log interceptor
    const originalConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error
    };
    
    // Override console methods to capture logs
    console.log = (...args) => {
      originalConsole.log(...args);
      addLog('info', args);
    };
    
    console.warn = (...args) => {
      originalConsole.warn(...args);
      addLog('warn', args);
    };
    
    console.error = (...args) => {
      originalConsole.error(...args);
      addLog('error', args);
    };
    
    // Helper function to add logs
    const addLog = (level: 'info' | 'warn' | 'error', args: any[]) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');
      
      const newLog = { level, message, timestamp: new Date() };
      window._debugLogs = [...(window._debugLogs || []), newLog].slice(-100); // Keep last 100 logs
      setLogs(window._debugLogs);
    };
    
    // Clean up
    return () => {
      console.log = originalConsole.log;
      console.warn = originalConsole.warn;
      console.error = originalConsole.error;
    };
  }, [isOpen]);
  
  if (!isOpen) {
    return (
      <button 
        className="debug-toggle"
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: '10px',
          right: '10px',
          zIndex: 9999,
          background: 'rgba(0,0,0,0.7)',
          color: 'white',
          border: 'none',
          padding: '5px 10px',
          borderRadius: '4px'
        }}
      >
        Debug
      </button>
    );
  }
  
  return (
    <div 
      className="debug-panel"
      style={{
        position: 'fixed',
        bottom: '0',
        right: '0',
        width: '400px',
        height: '300px',
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'monospace'
      }}
    >
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '5px',
        borderBottom: '1px solid #333'
      }}>
        <h3 style={{ margin: 0 }}>Debug Panel</h3>
        <button 
          onClick={() => setIsOpen(false)}
          style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
        >
          ×
        </button>
      </div>
      
      <div style={{
        overflowY: 'auto',
        flex: 1,
        padding: '5px'
      }}>
        {logs.map((log, index) => (
          <div 
            key={index}
            style={{
              color: log.level === 'error' ? '#ff5555' : 
                    log.level === 'warn' ? '#ffaa33' : '#aaaaaa',
              marginBottom: '2px',
              fontSize: '12px',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all'
            }}
          >
            [{log.timestamp.toLocaleTimeString()}] {log.message}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DebugPanel;
