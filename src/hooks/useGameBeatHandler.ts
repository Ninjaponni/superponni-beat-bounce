
import { useEffect } from 'react';
import RhythmEngine from '@/utils/RhythmEngine';
import AudioManager from '@/utils/AudioManager';
import { toast } from "sonner";

interface UseGameBeatHandlerProps {
  gameStarted: boolean;
  setOnBeat: (value: boolean) => void;
  setCombo: (value: number | ((prev: number) => number)) => void;
  setScore: (value: number | ((prev: number) => number)) => void;
  setMissCount: (value: number | ((prev: number) => number)) => void;
  setMaxCombo: (value: number | ((prev: number) => number)) => void;
  setPerfectHits: (value: number | ((prev: number) => number)) => void;
  combo: number;
  rhythmEngineRef: React.RefObject<RhythmEngine>;
  audioManagerRef: React.RefObject<AudioManager>;
}

export function useGameBeatHandler({
  gameStarted,
  setOnBeat,
  setCombo,
  setScore,
  setMissCount,
  setMaxCombo,
  setPerfectHits,
  combo,
  rhythmEngineRef,
  audioManagerRef
}: UseGameBeatHandlerProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!gameStarted) return;
      
      if (event.code === 'Space') {
        event.preventDefault();
        handleBeat();
      }
    };
    
    const handleBeat = () => {
      const audioManager = audioManagerRef.current;
      if (!audioManager) return;
      
      const currentTime = audioManager.getCurrentTime() * 1000;
      const rhythmEngine = rhythmEngineRef.current;
      if (!rhythmEngine) return;
      
      const result = rhythmEngine.checkPlayerInput(currentTime);
      
      setOnBeat(false);
      setTimeout(() => setOnBeat(true), 10);
      
      if (result.hit) {
        audioManager.playHitSound(result.score);
        
        if (result.score === 'perfect') {
          setScore(prev => prev + 100 * (1 + combo * 0.1));
          setCombo(prev => prev + 1);
          setPerfectHits(prev => prev + 1);
          toast.success("Perfekt treff!", { duration: 500 });
        } else if (result.score === 'good') {
          setScore(prev => prev + 50 * (1 + combo * 0.05));
          setCombo(prev => prev + 1);
          toast.success("Godt treff!", { duration: 500 });
        }
        
        setMaxCombo(prev => Math.max(prev, combo + 1));
        
        if (combo + 1 === 5 || combo + 1 === 10) {
          audioManager.playSound(combo + 1 === 10 ? 'victory' : 'perfect', 0.8);
        }
      } else {
        setMissCount(prev => prev + 1);
        setCombo(0);
        audioManager.playSound('miss');
        toast.error("Bom!", { duration: 500 });
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameStarted, combo, setOnBeat, setCombo, setScore, setMissCount, setMaxCombo, 
      setPerfectHits, rhythmEngineRef, audioManagerRef]);
}

export default useGameBeatHandler;
