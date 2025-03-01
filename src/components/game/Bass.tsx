
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export const Bass: React.FC = () => {
  const bassRef = useRef<THREE.Object3D | null>(null);
  
  useEffect(() => {
    console.log('Bass-komponent montert');
    
    try {
      // Get scene from window object (set by GameCanvas)
      const scene = window.gameScene;
      if (!scene) {
        console.error('Kunne ikke finne gameScene på window-objektet');
        return;
      }
      
      // Create a simple bass (red ball)
      const geometry = new THREE.SphereGeometry(0.2, 32, 32);
      const material = new THREE.MeshStandardMaterial({ color: 0xFF0000 });
      const bass = new THREE.Mesh(geometry, material);
      bass.position.set(0, 0.5, 0);
      bass.castShadow = true;
      
      // Add to scene
      scene.add(bass);
      bassRef.current = bass;
      
      // Store reference for use in other components
      window.gameBass = bass;
      
      // Cleanup
      return () => {
        if (scene && bass) {
          scene.remove(bass);
        }
        delete window.gameBass;
      };
    } catch (error) {
      console.error('Feil i Bass-komponent:', error);
    }
  }, []);
  
  // Bass doesn't render anything in the DOM
  return null;
};

export default Bass;
