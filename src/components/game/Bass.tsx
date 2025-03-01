
import { useRef } from 'react';
import * as THREE from 'three';

interface BassProps {
  model: THREE.Object3D;
}

const Bass = ({ model }: BassProps) => {
  const bassRef = useRef<THREE.Object3D>(model);
  
  return (
    <primitive object={bassRef.current} position={[0, 0, 0]} />
  );
};

export default Bass;
