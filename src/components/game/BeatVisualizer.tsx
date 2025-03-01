
import { useEffect, useRef } from 'react';
import { Beat } from '@/utils/RhythmEngine';

interface BeatVisualizerProps {
  beats: Beat[];
  currentTime: number;
}

const BeatVisualizer = ({ beats, currentTime }: BeatVisualizerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Konstanter for visualisering
  const containerWidth = 600; // px
  const beatWidth = 29; // px
  const outlineWidth = 77; // px
  const visibilityWindow = 2000; // ms
  
  useEffect(() => {
    // Når komponenten renderes første gang, sett opp containeren
  }, []);
  
  // Beregner x-posisjon basert på timing
  const calculateBeatPosition = (beatTime: number) => {
    const timeDiff = beatTime - currentTime;
    // Konverter tidsdifferanse til posisjon
    // Starter fra venstre og beveger seg mot høyre
    const progress = 1 - (timeDiff / visibilityWindow);
    return (containerWidth * progress) - (beatWidth / 2);
  };
  
  // Beregn opacity basert på posisjon
  const calculateOpacity = (xPos: number) => {
    // Maksimal opacity i midten, fade inn/ut på sidene
    const center = containerWidth / 2;
    const distance = Math.abs(xPos + beatWidth/2 - center);
    
    if (distance > 200) {
      return Math.max(0, 1 - (distance - 200) / 100);
    }
    return 1;
  };
  
  return (
    <div className="absolute bottom-[150px] left-1/2 transform -translate-x-1/2 h-[100px] w-[600px]">
      {/* Treffsone (hvit outline) */}
      <div 
        className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[77px] h-[77px] border-2 border-white rounded-full"
      />
      
      {/* Beat sirkler */}
      {beats.map((beat, index) => {
        const xPos = calculateBeatPosition(beat.time);
        const opacity = calculateOpacity(xPos);
        
        // Bestem fargen basert på status
        let bgColor = 'bg-white';
        if (beat.score === 'perfect') bgColor = 'bg-[#63AF30]';
        if (beat.score === 'good') bgColor = 'bg-yellow-500';
        if (beat.score === 'miss') bgColor = 'bg-[#E91F1F]';
        
        return (
          <div 
            key={index}
            className={`absolute top-1/2 transform -translate-y-1/2 rounded-full ${bgColor} transition-colors`}
            style={{
              left: `${xPos}px`,
              width: '29px',
              height: '29px',
              opacity: opacity
            }}
          />
        );
      })}
    </div>
  );
};

export default BeatVisualizer;
