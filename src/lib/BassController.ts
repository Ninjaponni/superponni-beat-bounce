
import * as THREE from 'three';

export class BassController {
  private scene: THREE.Scene;
  private bass: THREE.Object3D;
  private position: THREE.Vector3;
  private velocity: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  private config: any;
  private isActive: boolean = false;
  
  constructor(scene: THREE.Scene, bass: THREE.Object3D, config?: any) {
    this.scene = scene;
    this.bass = bass;
    this.position = bass.position.clone();
    
    // Ensure config exists with safe defaults
    this.config = config || {};
    
    // Ensure physics config exists
    if (!this.config.physics) {
      this.config.physics = {};
    }
    
    // CRITICAL: Ensure 'lov' property exists with defaults
    if (!this.config.physics.lov) {
      console.log("Creating default 'lov' property in BassController");
      this.config.physics.lov = {
        enabled: true,
        gravity: 9.8,
        airResistance: 0.99,
        bounceFactor: 0.8,
        maxSpeed: 5
      };
    }
    
    console.log("BassController initialized with config:", this.config);
  }
  
  // Safe getter for config properties
  private getSetting(path: string, defaultValue: any) {
    const parts = path.split('.');
    let current: any = this.config;
    
    for (const part of parts) {
      if (current === undefined || current === null) {
        return defaultValue;
      }
      current = current[part];
    }
    
    return current !== undefined ? current : defaultValue;
  }
  
  // Start the controller
  start(): void {
    this.isActive = true;
    console.log("BassController started");
  }
  
  // Update method to be called each frame
  update(deltaTime: number): void {
    if (!this.isActive) return;
    
    try {
      // Get settings safely
      const gravity = this.getSetting('physics.lov.gravity', 9.8);
      const airResistance = this.getSetting('physics.lov.airResistance', 0.99);
      const bounceFactor = this.getSetting('physics.lov.bounceFactor', 0.8);
      
      // Convert to seconds if deltaTime is in ms
      const dt = deltaTime > 0.1 ? deltaTime / 1000 : deltaTime;
      
      // Apply gravity
      this.velocity.y -= gravity * dt;
      
      // Apply air resistance
      this.velocity.multiplyScalar(airResistance);
      
      // Update position
      this.position.x += this.velocity.x * dt;
      this.position.y += this.velocity.y * dt;
      this.position.z += this.velocity.z * dt;
      
      // Check ground collision
      if (this.position.y < 0) {
        this.position.y = 0;
        
        // Bounce if velocity is significant
        if (Math.abs(this.velocity.y) > 0.1) {
          this.velocity.y = -this.velocity.y * bounceFactor;
        } else {
          this.velocity.y = 0;
        }
      }
      
      // Update bass position
      this.bass.position.copy(this.position);
    } catch (error) {
      console.error("Error in BassController.update:", error);
    }
  }
  
  // Handle hit from player
  handleHit(quality: string): void {
    try {
      // Set force based on hit quality
      let force = 0;
      let horizontalForce = 0;
      
      switch (quality) {
        case 'perfect':
          force = 5.0;
          horizontalForce = 0.5;
          this.showPerfectEffect();
          break;
        case 'good':
          force = 3.0;
          horizontalForce = 1.0;
          break;
        case 'ok':
          force = 1.5;
          horizontalForce = 1.5;
          break;
        default:
          // Miss - no force
          return;
      }
      
      // Apply upward velocity
      this.velocity.y = force;
      
      // Add some random horizontal movement
      this.velocity.x = (Math.random() - 0.5) * horizontalForce;
      this.velocity.z = (Math.random() - 0.5) * horizontalForce;
      
      console.log(`Bass hit with quality: ${quality}, force: ${force}`);
    } catch (error) {
      console.error("Error in BassController.handleHit:", error);
    }
  }
  
  // Visual effect for perfect hits
  private showPerfectEffect(): void {
    try {
      // Create a ring effect around the bass
      const geometry = new THREE.RingGeometry(0.3, 0.4, 32);
      const material = new THREE.MeshBasicMaterial({ 
        color: 0x63AF30, 
        transparent: true, 
        opacity: 0.7,
        side: THREE.DoubleSide
      });
      
      const ring = new THREE.Mesh(geometry, material);
      ring.position.copy(this.position);
      ring.rotation.x = Math.PI / 2; // Flat ring
      
      this.scene.add(ring);
      
      // Animate and remove
      let scale = 1.0;
      let opacity = 0.7;
      
      const animate = () => {
        scale += 0.05;
        opacity -= 0.02;
        
        if (opacity <= 0) {
          this.scene.remove(ring);
          return;
        }
        
        ring.scale.set(scale, scale, 1);
        material.opacity = opacity;
        
        requestAnimationFrame(animate);
      };
      
      animate();
    } catch (error) {
      console.error("Error showing perfect effect:", error);
    }
  }
}

export default BassController;
