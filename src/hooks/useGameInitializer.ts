
import { useEffect, RefObject } from 'react';
import * as THREE from 'three';
import AssetLoader from '@/utils/AssetLoader';
import AudioManager from '@/utils/AudioManager';
import { toast } from "sonner";

interface UseGameInitializerProps {
  assetLoaderRef: RefObject<AssetLoader>;
  audioManagerRef: RefObject<AudioManager>;
  startGame: () => void;
  setCharacterModel: (model: THREE.Object3D) => void;
  setAnimations: (animations: Map<string, THREE.AnimationClip>) => void;
  setLoading: (loading: boolean) => void;
  setCountdown: (value: React.SetStateAction<number>) => void;
  bassRef: RefObject<THREE.Object3D | null>;
  animationFrameRef: RefObject<number | null>;
}

export function useGameInitializer({
  assetLoaderRef,
  audioManagerRef,
  startGame,
  setCharacterModel,
  setAnimations,
  setLoading,
  setCountdown,
  bassRef,
  animationFrameRef
}: UseGameInitializerProps) {
  useEffect(() => {
    const initGame = async () => {
      try {
        console.log('Initialiserer spill');
        
        // Add safety net for 'lov' errors
        if (typeof window.gameConfig === 'undefined') window.gameConfig = {};
        if (typeof window.gameConfig.lov === 'undefined') {
          window.gameConfig.lov = {
            enabled: true,
            maxSpeed: 5,
            bounceHeight: 2,
            gravity: 9.8
          };
        }
        
        const audioManager = audioManagerRef.current;
        if (!audioManager) {
          toast.error("Kunne ikke initialisere lydmanager");
          setLoading(false); // Continue anyway
          return;
        }
        
        await audioManager.loadAllSounds().catch(error => {
          console.error('Feil ved lasting av lyder:', error);
          // Continue without sounds if needed
        });
        
        const assetLoader = assetLoaderRef.current;
        if (!assetLoader) {
          toast.error("Kunne ikke initialisere asset loader");
          setLoading(false); // Continue anyway
          return;
        }
        
        try {
          const loaded = await assetLoader.loadAll();
          
          if (!loaded) {
            console.error('Kunne ikke laste alle ressurser');
            toast.error("Kunne ikke laste alle ressurser. Vennligst prøv igjen.");
            // Continue with what we have
          }
        } catch (error) {
          console.error('Feil ved lasting av assets:', error);
          // Continue despite asset loading errors
        }
        
        try {
          const idleModel = assetLoaderRef.current.getModel('idle');
          if (idleModel) {
            setCharacterModel(idleModel);
          }
          
          const anims = new Map<string, THREE.AnimationClip>();
          
          ['idle', 'kickLeft', 'kickRight', 'victory', 'defeat'].forEach(name => {
            try {
              const anim = assetLoaderRef.current.getAnimation(name);
              if (anim) {
                anims.set(name, anim);
              }
            } catch (e) {
              console.warn(`Kunne ikke laste animasjon ${name}:`, e);
            }
          });
          
          setAnimations(anims);
        } catch (error) {
          console.error('Feil ved oppsett av karakter:', error);
          // Continue despite character setup errors
        }
        
        // Always proceed to countdown
        setLoading(false);
        
        const countdownInterval = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              clearInterval(countdownInterval);
              
              // Try to start the game, but continue regardless
              try {
                startGame();
              } catch (error) {
                console.error('Feil ved start av spill:', error);
                // Force game to start despite errors
                setLoading(false);
              }
              
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
          try {
            audioManagerRef.current?.stopMusic();
          } catch (e) {
            console.error('Feil ved stopp av musikk:', e);
          }
        };
      } catch (error) {
        console.error('Fatal feil under initialisering av spillet:', error);
        toast.error("Feil under initialisering av spillet. Vennligst prøv igjen.");
        setLoading(false); // Try to continue despite errors
      }
    };
    
    initGame();
  }, []);
}

export default useGameInitializer;
