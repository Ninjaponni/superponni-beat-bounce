
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface GameCanvasProps {
  gameState: 'start' | 'countdown' | 'playing' | 'gameover';
}

const GameCanvas: React.FC<GameCanvasProps> = ({ gameState }) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const characterRef = useRef<THREE.Mesh | null>(null);
  const bassRef = useRef<THREE.Mesh | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  // Setup the basic Three.js scene
  useEffect(() => {
    if (!canvasRef.current) return;
    
    console.log("Setting up basic Three.js scene");
    
    try {
      // Basic scene setup
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x87CEEB); // Sky blue background
      sceneRef.current = scene;
      
      // Make scene available globally
      window.gameScene = scene;
      
      // Setup camera
      const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.set(0, 1.5, 5);
      camera.lookAt(0, 0, 0);
      cameraRef.current = camera;
      
      // Setup renderer
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      canvasRef.current.appendChild(renderer.domElement);
      rendererRef.current = renderer;
      
      // Add lights
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      scene.add(ambientLight);
      
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(1, 1, 1);
      scene.add(directionalLight);
      
      // Add a simple green ground
      const planeGeometry = new THREE.PlaneGeometry(20, 20);
      const planeMaterial = new THREE.MeshBasicMaterial({ color: 0x3CB371, side: THREE.DoubleSide });
      const plane = new THREE.Mesh(planeGeometry, planeMaterial);
      plane.rotation.x = -Math.PI / 2;
      plane.position.y = -0.5;
      scene.add(plane);
      
      // Add a simple character (blue box)
      const characterGeometry = new THREE.BoxGeometry(0.5, 1, 0.5);
      const characterMaterial = new THREE.MeshStandardMaterial({ color: 0x1E90FF });
      const character = new THREE.Mesh(characterGeometry, characterMaterial);
      character.position.y = 0.5;
      character.castShadow = true;
      scene.add(character);
      characterRef.current = character;
      
      // Add a simple bass (red sphere)
      const bassGeometry = new THREE.SphereGeometry(0.2, 16, 16);
      const bassMaterial = new THREE.MeshStandardMaterial({ color: 0xFF0000 });
      const bass = new THREE.Mesh(bassGeometry, bassMaterial);
      bass.position.set(1, 0.2, 0);
      bass.castShadow = true;
      scene.add(bass);
      bassRef.current = bass;
      
      // Make bass available globally
      window.gameBass = bass;
      
      // Simple animation loop
      const animate = () => {
        if (!scene || !camera || !renderer) return;
        
        // Rotate character slightly when in playing state
        if (characterRef.current && gameState === 'playing') {
          characterRef.current.rotation.y += 0.01;
        }
        
        // Bounce the bass in playing state
        if (bassRef.current && gameState === 'playing') {
          bassRef.current.position.y = 0.2 + Math.sin(Date.now() * 0.002) * 0.1;
        }
        
        // Render scene
        renderer.render(scene, camera);
        
        // Continue animation loop
        animationFrameRef.current = requestAnimationFrame(animate);
      };
      
      animate();
      
      // Handle window resize
      const handleResize = () => {
        if (!camera || !renderer) return;
        
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      };
      
      window.addEventListener('resize', handleResize);
      
      // Setup keyboard event for bass kicking
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.code === 'Space' && gameState === 'playing' && bassRef.current) {
          // Basic animation when space is pressed
          bassRef.current.position.z += 1;
          setTimeout(() => {
            if (bassRef.current) {
              bassRef.current.position.z -= 1;
            }
          }, 200);
        }
      };
      
      window.addEventListener('keydown', handleKeyDown);
      
      // Cleanup function
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
      };
    } catch (error) {
      console.error("Error in GameCanvas setup:", error);
    }
  }, [gameState]);
  
  return <div ref={canvasRef} className="absolute inset-0" />;
};

export default GameCanvas;
