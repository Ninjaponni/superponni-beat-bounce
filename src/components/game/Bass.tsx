
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { createBassModel } from '@/utils/createBassModel';

interface BassProps {
  bassRef?: React.RefObject<THREE.Object3D | null>;
}

const Bass = ({ bassRef }: BassProps) => {
  // Create a local ref if no external ref is provided
  const localBassRef = useRef<THREE.Object3D | null>(null);
  
  // Use the provided ref or the local one
  const usedRef = bassRef || localBassRef;
  
  useEffect(() => {
    // Create the bass model in the effect
    if (!usedRef.current) {
      usedRef.current = createBassModel();
    }
  }, []);
  
  // Only render if we have a model
  if (!usedRef.current) {
    return null;
  }
  
  return (
    <primitive object={usedRef.current} position={[0, 0, 0]} />
  );
};

export default Bass;
