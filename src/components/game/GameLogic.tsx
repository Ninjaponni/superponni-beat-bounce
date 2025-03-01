
import { useState, useRef, useEffect } from 'react';
import * as THREE from 'three';
import AssetLoader from '@/utils/AssetLoader';
import RhythmEngine, { Beat } from '@/utils/RhythmEngine';
import AudioManager from '@/utils/AudioManager';
import BeatVisualizer from './BeatVisualizer';
import ScoreDisplay from './ScoreDisplay';
import Countdown from './Countdown';
import Character from './Character';
import Bass from './Bass';
import GameCanvas from './GameCanvas';
import { toast } from "sonner";
import useGameBeatHandler from '@/hooks/useGameBeatHandler';
import useGameInitializer from '@/hooks/useGameInitializer';

interface GameLogicProps {
  onGameOver: (score: number, perfectHits?: number, maxCombo?: number) => void;
}

const GameLogic = ({ onGameOver }: GameLogicProps) => {
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
  const bassRef = useRef<THREE.Object3D | null>(null);
  const gameTimeRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);
  
  const startGame = () => {
    const audioManager = audioManagerRef.current;
    const audioContext = audioManager.getAudioContext();
    
    if (!audioContext) {
      toast.error("Kunne ikke starte lydkontekst. Sjekk at nettleseren din støtter Web Audio API.");
      return;
    }
    
    const startTime = audioManager.getCurrentTime() * 1000;
    rhythmEngineRef.current.start(startTime);
    gameTimeRef.current = startTime;
    
    audioManager.playMusic('music');
    
    audioManager.onBeat(time => {
      console.log(`Beat at time: ${time}`);
    });
    
    setGameStarted(true);
    requestAnimationFrame(gameLoop);
  };
  
  const gameLoop = () => {
    const audioManager = audioManagerRef.current;
    const audioContext = audioManager.getAudioContext();
    
    if (!audioContext) return;
    
    const currentTime = audioManager.getCurrentTime() * 1000;
    
    const visibleBeats = rhythmEngineRef.current.getVisibleBeats(currentTime);
    setVisibleBeats(visibleBeats);
    
    if (missCount >= 3) {
      handleGameOver(false);
      return;
    }
    
    animationFrameRef.current = requestAnimationFrame(gameLoop);
  };
  
  const handleGameOver = (victory: boolean) => {
    setGameOver(true);
    setIsVictory(victory);
    
    const audioManager = audioManagerRef.current;
    if (victory) {
      audioManager.playSound('victory');
    } else {
      audioManager.playGameOverEffects();
    }
    
    setTimeout(() => {
      onGameOver(score, perfectHits, maxCombo);
    }, 2000);
  };
  
  // Initialize the game
  useGameInitializer({
    assetLoaderRef,
    audioManagerRef,
    startGame,
    setCharacterModel,
    setAnimations,
    setLoading,
    setCountdown,
    bassRef,
    animationFrameRef
  });
  
  // Handle beat inputs
  useGameBeatHandler({
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
  });
  
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
      <GameCanvas>
        {characterModel && (
          <Character 
            model={characterModel} 
            animations={animations} 
            onBeat={onBeat} 
            gameOver={gameOver}
            isVictory={isVictory}
          />
        )}
        
        {gameStarted && <Bass bassRef={bassRef} />}
      </GameCanvas>
      
      <ScoreDisplay score={score} combo={combo} missCount={missCount} />
      <BeatVisualizer 
        beats={visibleBeats} 
        currentTime={audioManagerRef.current.getCurrentTime() * 1000} 
      />
    </div>
  );
};

export default GameLogic;
