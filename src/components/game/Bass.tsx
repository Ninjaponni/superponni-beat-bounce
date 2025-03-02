
import React, { useEffect, useState } from 'react';
import * as THREE from 'three';
import BassController from '@/lib/BassController';

export const Bass: React.FC = () => {
  const [bass, setBass] = useState<THREE.Object3D | null>(null);
  
  useEffect(() => {
    console.log("Bass component mounting");
    
    try {
      // Get the game scene
      const scene = window.gameScene;
      if (!scene) {
        console.error("Game scene not found!");
        return;
      }
      
      // Create a simple bass model
      const geometry = new THREE.SphereGeometry(0.2, 32, 32);
      const material = new THREE.MeshStandardMaterial({ color: 0xFF0000 });
      const bassModel = new THREE.Mesh(geometry, material);
      bassModel.position.set(0, 0.5, 1);
      bassModel.castShadow = true;
      
      // Add to scene
      scene.add(bassModel);
      setBass(bassModel);
      
      // Expose globally for debugging
      window.gameBass = bassModel;
      
      // Try to initialize a BassController
      try {
        console.log("Attempting to initialize BassController");
        
        // Create config with physics.bass properties
        const safeConfig = {
          physics: {
            bass: {
              gravity: 9.8,
              airResistance: 0.99,
              bounceFactor: 0.8,
              maxSpeed: 5
            }
          }
        };
        
        // Initialize controller with config
        const controller = new BassController(scene, bassModel, safeConfig);
        window.bassController = controller;
        controller.start();
        console.log("BassController initialized successfully");
      } catch (controllerError) {
        console.error("Failed to initialize BassController:", controllerError);
        // Continue with simple bass model
      }
      
      // Add basic animation
      const animate = () => {
        if (!bassModel) return;
        
        // Simple bouncing animation if no controller
        if (!window.bassController) {
          bassModel.position.y = 0.5 + Math.sin(Date.now() * 0.002) * 0.1;
        }
      };
      
      // Add to animation loop if exists
      if (window.gameAnimationFunctions) {
        window.gameAnimationFunctions.push(animate);
      }
      
      // Cleanup
      return () => {
        if (scene && bassModel) {
          scene.remove(bassModel);
        }
        
        // Remove from animation functions
        if (window.gameAnimationFunctions) {
          window.gameAnimationFunctions = window.gameAnimationFunctions.filter(fn => fn !== animate);
        }
        
        // Clean up global references
        delete window.gameBass;
        delete window.bassController;
      };
    } catch (error) {
      console.error("Error in Bass component:", error);
    }
  }, []);
  
  return null;
};

export default Bass;
