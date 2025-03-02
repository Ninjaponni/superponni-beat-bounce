
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface GameCanvasProps {
  children?: React.ReactNode;
  gameState?: 'start' | 'countdown' | 'playing' | 'gameover';
}

const GameCanvas: React.FC<GameCanvasProps> = ({ children, gameState }) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const characterRef = useRef<THREE.Mesh | null>(null);
  const bassRef = useRef<THREE.Mesh | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const clockRef = useRef<THREE.Clock>(new THREE.Clock());
  
  useEffect(() => {
    if (!canvasRef.current) return;
    
    console.log("Setting up basic Three.js scene");
    
    try {
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x87CEEB); // Sky blue background
      sceneRef.current = scene;
      
      window.gameScene = scene;
      
      const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.set(0, 1.5, 5);
      camera.lookAt(0, 0, 0);
      cameraRef.current = camera;
      
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      canvasRef.current.appendChild(renderer.domElement);
      rendererRef.current = renderer;
      
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      scene.add(ambientLight);
      
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(1, 1, 1);
      scene.add(directionalLight);
      
      const planeGeometry = new THREE.PlaneGeometry(20, 20);
      const planeMaterial = new THREE.MeshBasicMaterial({ color: 0x3CB371, side: THREE.DoubleSide });
      const plane = new THREE.Mesh(planeGeometry, planeMaterial);
      plane.rotation.x = -Math.PI / 2;
      plane.position.y = -0.5;
      scene.add(plane);
      
      const characterGeometry = new THREE.BoxGeometry(0.5, 1, 0.5);
      const characterMaterial = new THREE.MeshStandardMaterial({ color: 0x1E90FF });
      const character = new THREE.Mesh(characterGeometry, characterMaterial);
      character.position.y = 0.5;
      character.castShadow = true;
      scene.add(character);
      characterRef.current = character;
      
      window.gameAnimationFunctions = [];
      
      const animate = () => {
        if (!sceneRef.current || !cameraRef.current || !rendererRef.current) return;
        
        const deltaTime = clockRef.current.getDelta();
        
        if (window.gameAnimationFunctions && gameState === 'playing') {
          window.gameAnimationFunctions.forEach(fn => {
            try {
              fn(deltaTime);
            } catch (error) {
              console.error("Error in animation function:", error);
            }
          });
        }
        
        if (window.bassController && gameState === 'playing') {
          try {
            window.bassController.update(deltaTime);
          } catch (error) {
            console.error("Error updating bass controller:", error);
          }
        }
        
        if (characterRef.current && gameState === 'playing') {
          characterRef.current.rotation.y += 0.01;
        }
        
        rendererRef.current.render(sceneRef.current, cameraRef.current);
        
        animationFrameRef.current = requestAnimationFrame(animate);
      };
      
      clockRef.current.start();
      animate();
      
      const handleResize = () => {
        if (!cameraRef.current || !rendererRef.current) return;
        
        cameraRef.current.aspect = window.innerWidth / window.innerHeight;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(window.innerWidth, window.innerHeight);
      };
      
      window.addEventListener('resize', handleResize);
      
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.code === 'Space' && gameState === 'playing' && window.bassController) {
          console.log("Space key pressed - GameCanvas event handler");
          try {
            window.bassController.handleHit('good');
          } catch (error) {
            console.error("Error handling key press:", error);
          }
        }
      };
      
      window.addEventListener('keydown', handleKeyDown);
      
      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('keydown', handleKeyDown);
        
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        
        if (canvasRef.current && rendererRef.current?.domElement) {
          canvasRef.current.removeChild(rendererRef.current.domElement);
        }
        
        if (rendererRef.current) {
          rendererRef.current.dispose();
        }
        
        delete window.gameScene;
        delete window.gameBass;
        delete window.gameAnimationFunctions;
        delete window.bassController;
      };
    } catch (error) {
      console.error("Error in GameCanvas setup:", error);
    }
  }, [gameState]);
  
  return (
    <div ref={canvasRef} className="absolute inset-0">
      {children}
    </div>
  );
};

export default GameCanvas;
