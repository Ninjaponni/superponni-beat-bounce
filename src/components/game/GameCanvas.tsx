
import { ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

interface GameCanvasProps {
  children: ReactNode;
}

const GameCanvas = ({ children }: GameCanvasProps) => {
  return (
    <Canvas className="absolute inset-0">
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
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
