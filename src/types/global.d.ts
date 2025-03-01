
interface LogEntry {
  level: 'info' | 'warn' | 'error';
  message: string;
  timestamp: Date;
}

declare global {
  interface Window {
    _debugLogs: LogEntry[];
    gameConfig: {
      physics: {
        lov: {
          enabled: boolean;
          maxSpeed: number;
          gravity: number;
          airResistance: number;
          bounceFactor: number;
        }
      };
      difficulty: string;
    };
  }
}

export {};
