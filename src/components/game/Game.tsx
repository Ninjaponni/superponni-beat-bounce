
import { useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import AssetLoader from '@/utils/AssetLoader';
import RhythmEngine, { Beat } from '@/utils/RhythmEngine';
import BeatVisualizer from './BeatVisualizer';
import ScoreDisplay from './ScoreDisplay';
import Countdown from './Countdown';
import Character from './Character';
import { toast } from "sonner";

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
  const [characterModel, setCharacterModel] = useState<THREE.Object3D | null>(null);
  const [animations, setAnimations] = useState<Map<string, THREE.AnimationClip>>(new Map());
  const [onBeat, setOnBeat] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [isVictory, setIsVictory] = useState(false);
  
  const assetLoaderRef = useRef(new AssetLoader());
  const rhythmEngineRef = useRef(new RhythmEngine(130)); // 130 BPM
  const gameTimeRef = useRef(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  // Initialize the game
  useEffect(() => {
    const initGame = async () => {
      try {
        // Set up audio context
        audioContextRef.current = new AudioContext();
        
        // Load resources
        const assetLoader = assetLoaderRef.current;
        const loaded = await assetLoader.loadAll();
        
        if (!loaded) {
          console.error('Kunne ikke laste alle ressurser');
          toast.error("Kunne ikke laste alle ressurser. Vennligst prøv igjen.");
          return;
        }
        
        // Get the character model
        const idleModel = assetLoader.getModel('idle');
        if (idleModel) {
          setCharacterModel(idleModel);
        }
        
        // Set up animations
        const anims = new Map<string, THREE.AnimationClip>();
        
        // Add all animations
        ['idle', 'kickLeft', 'kickRight', 'victory', 'defeat'].forEach(name => {
          const anim = assetLoader.getAnimation(name);
          if (anim) {
            anims.set(name, anim);
          }
        });
        
        setAnimations(anims);
        setLoading(false);
        
        // Start countdown
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
      } catch (error) {
        console.error('Error initializing game:', error);
        toast.error("Feil under initialisering av spillet. Vennligst prøv igjen.");
      }
    };
    
    initGame();
  }, []);
  
  const startGame = () => {
    if (!audioContextRef.current) return;
    
    // Start rhythm engine
    const startTime = audioContextRef.current.currentTime * 1000;
    rhythmEngineRef.current.start(startTime);
    gameTimeRef.current = startTime;
    
    // Start game loop
    setGameStarted(true);
    requestAnimationFrame(gameLoop);
  };
  
  const gameLoop = () => {
    if (!audioContextRef.current) return;
    
    // Update game time
    const currentTime = audioContextRef.current.currentTime * 1000;
    
    // Update visible beats
    const visibleBeats = rhythmEngineRef.current.getVisibleBeats(currentTime);
    setVisibleBeats(visibleBeats);
    
    // Check if game is over
    if (missCount >= 3) {
      handleGameOver(false);
      return;
    }
    
    // Continue game loop
    animationFrameRef.current = requestAnimationFrame(gameLoop);
  };
  
  const handleGameOver = (victory: boolean) => {
    setGameOver(true);
    setIsVictory(victory);
    
    // Allow time for final animation before showing game over screen
    setTimeout(() => {
      onGameOver(score);
    }, 2000);
  };
  
  // Handle key press
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!gameStarted || !audioContextRef.current) return;
      
      if (event.code === 'Space') {
        event.preventDefault();
        handleBeat();
      }
    };
    
    const handleBeat = () => {
      const currentTime = audioContextRef.current!.currentTime * 1000;
      const result = rhythmEngineRef.current.checkPlayerInput(currentTime);
      
      // Trigger character animation
      setOnBeat(false); // Reset first to ensure useEffect triggers
      setTimeout(() => setOnBeat(true), 10);
      
      if (result.hit) {
        // Play beat sound (would be implemented in a real audio system)
        
        // Update score and combo
        if (result.score === 'perfect') {
          setScore(prev => prev + 100 * (1 + combo * 0.1));
          setCombo(prev => prev + 1);
          toast.success("Perfekt treff!", { duration: 500 });
        } else if (result.score === 'good') {
          setScore(prev => prev + 50 * (1 + combo * 0.05));
          setCombo(prev => prev + 1);
          toast.success("Godt treff!", { duration: 500 });
        }
      } else {
        // Miss
        setMissCount(prev => prev + 1);
        setCombo(0);
        toast.error("Bom!", { duration: 500 });
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameStarted, combo, score]);
  
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
        
        {/* Character */}
        {characterModel && (
          <Character 
            model={characterModel} 
            animations={animations} 
            onBeat={onBeat} 
            gameOver={gameOver}
            isVictory={isVictory}
          />
        )}
        
        {/* Floor */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.01, 0]} receiveShadow>
          <planeGeometry args={[20, 20]} />
          <meshStandardMaterial color="#4a6c6f" />
        </mesh>
      </Canvas>
      
      {/* UI Elements */}
      <ScoreDisplay score={score} combo={combo} missCount={missCount} />
      <BeatVisualizer 
        beats={visibleBeats} 
        currentTime={audioContextRef.current?.currentTime ?? 0 * 1000} 
      />
    </div>
  );
};

export default Game;
