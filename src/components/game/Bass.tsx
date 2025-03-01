
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { createBassModel } from '@/utils/createBassModel';

interface BassProps {
  bassRef?: React.RefObject<THREE.Object3D | null>;
}

const Bass = ({ bassRef }: BassProps) => {
  // Create a local ref if no external ref is provided
  const localBassRef = useRef<THREE.Object3D | null>(null);
  const [bassModel, setBassModel] = useState<THREE.Object3D | null>(null);
  
  // Use the provided ref or the local one
  const usedRef = bassRef || localBassRef;
  
  useEffect(() => {
    // Create the bass model in the effect
    if (!usedRef.current) {
      const newBassModel = createBassModel();
      // Update the ref value through proper React patterns
      if (bassRef) {
        // If external ref was provided, it's the caller's responsibility to update it
        setBassModel(newBassModel);
      } else {
        // For internal ref, we can set it directly as it's our own ref
        localBassRef.current = newBassModel;
        setBassModel(newBassModel);
      }
    }
  }, []);
  
  // Only render if we have a model
  if (!bassModel && !usedRef.current) {
    return null;
  }
  
  return (
    <primitive object={bassModel || usedRef.current} position={[0, 0, 0]} />
  );
};

export default Bass;
