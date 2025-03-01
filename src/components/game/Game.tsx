
import { useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import AssetLoader from '@/utils/AssetLoader';
import RhythmEngine, { Beat } from '@/utils/RhythmEngine';
import AudioManager from '@/utils/AudioManager';
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
  const [maxCombo, setMaxCombo] = useState(0);
  const [perfectHits, setPerfectHits] = useState(0);
  
  const assetLoaderRef = useRef(new AssetLoader());
  const rhythmEngineRef = useRef(new RhythmEngine(130)); // 130 BPM for "Vi e trøndera"
  const audioManagerRef = useRef(new AudioManager());
  const gameTimeRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);
  
  // Initialize the game
  useEffect(() => {
    const initGame = async () => {
      try {
        // Load audio first
        const audioManager = audioManagerRef.current;
        await audioManager.loadAllSounds();
        
        // Load visual resources
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
          // Stopp all lyd når komponenten unmountes
          audioManagerRef.current.stopMusic();
        };
      } catch (error) {
        console.error('Error initializing game:', error);
        toast.error("Feil under initialisering av spillet. Vennligst prøv igjen.");
      }
    };
    
    initGame();
  }, []);
  
  const startGame = () => {
    // Start audio
    const audioManager = audioManagerRef.current;
    const audioContext = audioManager.getAudioContext();
    
    if (!audioContext) {
      toast.error("Kunne ikke starte lydkontekst. Sjekk at nettleseren din støtter Web Audio API.");
      return;
    }
    
    // Start rhythm engine
    const startTime = audioManager.getCurrentTime() * 1000;
    rhythmEngineRef.current.start(startTime);
    gameTimeRef.current = startTime;
    
    // Start music
    audioManager.playMusic('music');
    
    // Start game loop
    setGameStarted(true);
    requestAnimationFrame(gameLoop);
  };
  
  const gameLoop = () => {
    const audioManager = audioManagerRef.current;
    const audioContext = audioManager.getAudioContext();
    
    if (!audioContext) return;
    
    // Update game time
    const currentTime = audioManager.getCurrentTime() * 1000;
    
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
    
    // Play appropriate sound
    const audioManager = audioManagerRef.current;
    if (victory) {
      audioManager.playSound('victory');
    } else {
      audioManager.playGameOverEffects();
    }
    
    // Allow time for final animation before showing game over screen
    setTimeout(() => {
      onGameOver(score);
    }, 2000);
  };
  
  // Handle key press
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
      const currentTime = audioManager.getCurrentTime() * 1000;
      const result = rhythmEngineRef.current.checkPlayerInput(currentTime);
      
      // Trigger character animation
      setOnBeat(false); // Reset first to ensure useEffect triggers
      setTimeout(() => setOnBeat(true), 10);
      
      if (result.hit) {
        // Play beat sound based on hit quality
        audioManager.playHitSound(result.score);
        
        // Update score and combo
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
        
        // Update max combo
        setMaxCombo(prev => Math.max(prev, combo + 1));
        
        // Play special sound for combo milestones
        if (combo + 1 === 5 || combo + 1 === 10) {
          audioManager.playSound(combo + 1 === 10 ? 'victory' : 'perfect', 0.8);
        }
      } else {
        // Miss
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
        currentTime={audioManagerRef.current.getCurrentTime() * 1000} 
      />
    </div>
  );
};

export default Game;
