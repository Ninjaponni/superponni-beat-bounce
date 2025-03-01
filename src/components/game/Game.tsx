
import { useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import AssetLoader from '@/utils/AssetLoader';
import RhythmEngine, { Beat } from '@/utils/RhythmEngine';
import BeatVisualizer from './BeatVisualizer';
import ScoreDisplay from './ScoreDisplay';
import Countdown from './Countdown';

interface GameProps {
  onGameOver: (score: number) => void;
}

const Game = ({ onGameOver }: GameProps) => {
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(3);
  const [gameStarted, setGameStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [missCount, setMissCount] = useState(0);
  const [visibleBeats, setVisibleBeats] = useState<Beat[]>([]);
  
  const assetLoaderRef = useRef(new AssetLoader());
  const rhythmEngineRef = useRef(new RhythmEngine(130)); // 130 BPM
  const gameTimeRef = useRef(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  // Initialiser spillet
  useEffect(() => {
    const initGame = async () => {
      // Sett opp lydkontekst
      audioContextRef.current = new AudioContext();
      
      // Last ressurser
      const assetLoader = assetLoaderRef.current;
      const loaded = await assetLoader.loadAll();
      
      if (!loaded) {
        console.error('Kunne ikke laste alle ressurser');
        return;
      }
      
      setLoading(false);
      
      // Start nedtelling
      const countdownInterval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            startGame();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => {
        clearInterval(countdownInterval);
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    };
    
    initGame();
  }, []);
  
  const startGame = () => {
    if (!audioContextRef.current) return;
    
    // Start rytmemotor
    const startTime = audioContextRef.current.currentTime * 1000;
    rhythmEngineRef.current.start(startTime);
    gameTimeRef.current = startTime;
    
    // Start gameloop
    setGameStarted(true);
    requestAnimationFrame(gameLoop);
  };
  
  const gameLoop = () => {
    if (!audioContextRef.current) return;
    
    // Oppdater spilltid
    const currentTime = audioContextRef.current.currentTime * 1000;
    
    // Oppdater synlige beats
    const visibleBeats = rhythmEngineRef.current.getVisibleBeats(currentTime);
    setVisibleBeats(visibleBeats);
    
    // Sjekk om spillet er over
    if (missCount >= 3) {
      onGameOver(score);
      return;
    }
    
    // Fortsett spilløkke
    animationFrameRef.current = requestAnimationFrame(gameLoop);
  };
  
  // Håndter tastetrykk
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!gameStarted || !audioContextRef.current) return;
      
      if (event.code === 'Space') {
        event.preventDefault();
        
        const currentTime = audioContextRef.current.currentTime * 1000;
        const result = rhythmEngineRef.current.checkPlayerInput(currentTime);
        
        if (result.hit) {
          // Spark-animasjon vil trigges i Character-komponenten
          if (result.score === 'perfect') {
            setScore(prev => prev + 100 * (1 + combo * 0.1));
            setCombo(prev => prev + 1);
            // Spill perfekt lydeffekt
          } else if (result.score === 'good') {
            setScore(prev => prev + 50 * (1 + combo * 0.05));
            setCombo(prev => prev + 1);
            // Spill god lydeffekt
          }
        } else {
          // Bom
          setMissCount(prev => prev + 1);
          setCombo(0);
          // Spill bom-lydeffekt
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameStarted, combo, onGameOver, score]);
  
  if (loading || countdown > 0) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black text-white">
        {loading ? (
          <p className="text-2xl">Laster spillet...</p>
        ) : (
          <Countdown value={countdown} />
        )}
      </div>
    );
  }
  
  return (
    <div className="relative w-full h-full">
      {/* 3D Scene */}
      <Canvas className="absolute inset-0">
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <color attach="background" args={['#1a1a2e']} />
        <OrbitControls enabled={false} />
        {/* Her vil vi senere legge til karakteren og bassen */}
      </Canvas>
      
      {/* UI Elementer */}
      <ScoreDisplay score={score} combo={combo} missCount={missCount} />
      <BeatVisualizer 
        beats={visibleBeats} 
        currentTime={audioContextRef.current?.currentTime ?? 0 * 1000} 
      />
    </div>
  );
};

export default Game;
