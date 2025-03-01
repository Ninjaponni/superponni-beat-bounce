
import * as THREE from 'three';

// Denne funksjonen oppretter en enkel ball-modell som vi kan bruke 
// inntil vi får en ordentlig bass-modell
export function createBassModel(): THREE.Object3D {
  // Opprett en gruppe for å holde alle delene av bassen
  const bassGroup = new THREE.Group();
  
  // Hovedball (bassen)
  const ballGeometry = new THREE.SphereGeometry(0.15, 16, 16);
  const ballMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x8B4513,  // Brun farge for bassen
    roughness: 0.7,
    metalness: 0.3
  });
  const ball = new THREE.Mesh(ballGeometry, ballMaterial);
  bassGroup.add(ball);
  
  // Marker bassen med et mønster
  const stripeGeometry = new THREE.TorusGeometry(0.1, 0.02, 16, 32);
  const stripeMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
  const stripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
  stripe.rotation.x = Math.PI / 2;
  bassGroup.add(stripe);
  
  // Legg til en annen stripe i en annen retning
  const stripe2 = stripe.clone();
  stripe2.rotation.x = 0;
  stripe2.rotation.y = Math.PI / 2;
  bassGroup.add(stripe2);
  
  return bassGroup;
}
