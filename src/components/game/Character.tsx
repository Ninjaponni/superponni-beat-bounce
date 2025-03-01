
import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AnimationMixer, AnimationAction } from 'three';

interface CharacterProps {
  model: THREE.Object3D | null;
  animations: Map<string, THREE.AnimationClip>;
  onBeat: boolean;
  gameOver: boolean;
  isVictory: boolean;
}

const Character = ({ model, animations, onBeat, gameOver, isVictory }: CharacterProps) => {
  const mixerRef = useRef<AnimationMixer | null>(null);
  const actionsRef = useRef<Map<string, AnimationAction>>(new Map());
  const currentAnimationRef = useRef<string>('idle');
  const isTransitioningRef = useRef<boolean>(false);
  const characterRef = useRef<THREE.Group>(new THREE.Group());
  
  // Setup character and animations on mount
  useEffect(() => {
    if (!model || !animations || animations.size === 0) return;
    
    // Clone the model to avoid reference issues
    const character = model.clone();
    characterRef.current.add(character);
    
    // Create animation mixer
    const mixer = new THREE.AnimationMixer(character);
    mixerRef.current = mixer;
    
    // Setup all animations
    animations.forEach((clip, name) => {
      const action = mixer.clipAction(clip);
      actionsRef.current.set(name, action);
      
      // Start idle animation immediately
      if (name === 'idle') {
        action.play();
      }
    });
    
    return () => {
      // Cleanup
      mixer.stopAllAction();
      actionsRef.current.clear();
    };
  }, [model, animations]);
  
  // Handle play animation requests
  useEffect(() => {
    // Handle game over animations
    if (gameOver) {
      playAnimation(isVictory ? 'victory' : 'defeat');
      return;
    }
    
    // Handle beat animations
    if (onBeat && !isTransitioningRef.current) {
      // Randomly choose left or right kick
      const kick = Math.random() > 0.5 ? 'kickLeft' : 'kickRight';
      playAnimation(kick);
    }
  }, [onBeat, gameOver, isVictory]);
  
  // Animation playback function
  const playAnimation = (name: string, fadeTime: number = 0.2) => {
    if (isTransitioningRef.current || !actionsRef.current.has(name) || name === currentAnimationRef.current) {
      return;
    }
    
    isTransitioningRef.current = true;
    
    // Get current and new animations
    const currentAction = actionsRef.current.get(currentAnimationRef.current);
    const newAction = actionsRef.current.get(name);
    
    if (currentAction && newAction) {
      // Fade out current animation
      currentAction.fadeOut(fadeTime);
      
      // Fade in new animation
      newAction.reset();
      newAction.fadeIn(fadeTime);
      newAction.play();
      
      // For kick animations, return to idle when finished
      if (name.includes('kick')) {
        // Calculate how long the animation takes
        const animDuration = newAction.getClip().duration;
        
        // Wait until animation is done before going back to idle
        setTimeout(() => {
          if (!gameOver) { // Only return to idle if game isn't over
            playAnimation('idle', fadeTime);
          }
          isTransitioningRef.current = false;
        }, animDuration * 1000); // Convert to milliseconds
      } else {
        // For other animations, just update current
        currentAnimationRef.current = name;
        isTransitioningRef.current = false;
      }
    }
  };
  
  // Update animation mixer on each frame
  useFrame((_, delta) => {
    if (mixerRef.current) {
      mixerRef.current.update(delta);
    }
  });
  
  return <primitive object={characterRef.current} position={[0, -1, 0]} />;
};

export default Character;
