
import { ReactNode, useEffect, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

// Scene setup component that exposes the scene globally
const SceneSetup = () => {
  const { scene } = useThree();
  
  useEffect(() => {
    // Make scene available globally
    window.gameScene = scene;
    
    return () => {
      delete window.gameScene;
    };
  }, [scene]);
  
  return null;
};

interface GameCanvasProps {
  children: ReactNode;
}

const GameCanvas = ({ children }: GameCanvasProps) => {
  return (
    <Canvas className="absolute inset-0" shadows>
      <SceneSetup />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
      <color attach="background" args={['#1a1a2e']} />
      <OrbitControls enabled={false} />
      
      {children}
      
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.01, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#4a6c6f" />
      </mesh>
    </Canvas>
  );
};

export default GameCanvas;
