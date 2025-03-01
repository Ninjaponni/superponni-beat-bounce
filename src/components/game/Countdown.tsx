
import { useState, useEffect } from 'react';

interface CountdownProps {
  value: number;
}

const Countdown = ({ value }: CountdownProps) => {
  const [scale, setScale] = useState(1);
  const [color, setColor] = useState('#ffffff');
  
  useEffect(() => {
    // Pulse animation on each count change
    setScale(1.5);
    
    // Set different colors for different count values
    switch(value) {
      case 3:
        setColor('#ff6b6b');
        break;
      case 2:
        setColor('#feca57');
        break;
      case 1:
        setColor('#1dd1a1');
        break;
      case 0:
        setColor('#54a0ff');
        break;
      default:
        setColor('#ffffff');
    }
    
    const timer = setTimeout(() => {
      setScale(1);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [value]);
  
  return (
    <div className="flex items-center justify-center">
      <div 
        className="text-8xl font-bold transition-all duration-300 ease-out" 
        style={{ 
          transform: `scale(${scale})`,
          color: color
        }}
      >
        {value === 0 ? 'Start!' : value}
      </div>
    </div>
  );
};

export default Countdown;
