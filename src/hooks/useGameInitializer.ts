
import { useState, useEffect, RefObject } from 'react';
import * as THREE from 'three';
import AssetLoader from '@/utils/AssetLoader';
import AudioManager from '@/utils/AudioManager';
import { toast } from "sonner";
import { createBassModel } from '@/utils/createBassModel';

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
        const audioManager = audioManagerRef.current;
        if (!audioManager) {
          toast.error("Kunne ikke initialisere lydmanager");
          return;
        }
        
        await audioManager.loadAllSounds();
        
        const assetLoader = assetLoaderRef.current;
        if (!assetLoader) {
          toast.error("Kunne ikke initialisere asset loader");
          return;
        }
        
        const loaded = await assetLoader.loadAll();
        
        if (!loaded) {
          console.error('Kunne ikke laste alle ressurser');
          toast.error("Kunne ikke laste alle ressurser. Vennligst prøv igjen.");
          return;
        }
        
        const idleModel = assetLoader.getModel('idle');
        if (idleModel) {
          setCharacterModel(idleModel);
        }
        
        const anims = new Map<string, THREE.AnimationClip>();
        
        ['idle', 'kickLeft', 'kickRight', 'victory', 'defeat'].forEach(name => {
          const anim = assetLoader.getAnimation(name);
          if (anim) {
            anims.set(name, anim);
          }
        });
        
        setAnimations(anims);
        
        // Oppretter bass-model direkte
        const bassModel = createBassModel();
        // Bruk setState for å oppdatere bassRef
        setLoading(false);
        
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
          audioManagerRef.current?.stopMusic();
        };
      } catch (error) {
        console.error('Error initializing game:', error);
        toast.error("Feil under initialisering av spillet. Vennligst prøv igjen.");
      }
    };
    
    initGame();
  }, []);
}

export default useGameInitializer;
