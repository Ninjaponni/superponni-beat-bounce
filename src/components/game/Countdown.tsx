
import { useState, useEffect } from 'react';

interface CountdownProps {
  value: number;
}

const Countdown = ({ value }: CountdownProps) => {
  const [scale, setScale] = useState(1);
  
  useEffect(() => {
    setScale(1.5);
    const timer = setTimeout(() => {
      setScale(1);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [value]);
  
  return (
    <div className="flex items-center justify-center">
      <div 
        className="text-6xl font-bold transition-transform duration-300 ease-out" 
        style={{ transform: `scale(${scale})` }}
      >
        {value === 0 ? 'Start!' : value}
      </div>
    </div>
  );
};

export default Countdown;
