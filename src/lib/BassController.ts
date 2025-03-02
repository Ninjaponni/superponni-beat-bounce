
import * as THREE from 'three';

export class BassController {
  private scene: THREE.Scene;
  private bass: THREE.Object3D;
  private position: THREE.Vector3;
  private velocity: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  private config: any;
  private isActive: boolean = false;
  private hitStreakCount: number = 0;
  private lastHitQuality: string = '';
  private trailEffects: THREE.Object3D[] = [];
  
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
    
    // Ensure physics.bass settings exist with defaults
    if (!this.config.physics.bass) {
      this.config.physics.bass = {
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
      const gravity = this.getSetting('physics.bass.gravity', 9.8);
      const airResistance = this.getSetting('physics.bass.airResistance', 0.99);
      const bounceFactor = this.getSetting('physics.bass.bounceFactor', 0.8);
      
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
      
      // Update trail effects if present
      this.updateTrailEffects(dt);
    } catch (error) {
      console.error("Error in BassController.update:", error);
    }
  }
  
  // Update trail effects
  private updateTrailEffects(dt: number): void {
    // Update existing trail effects
    for (let i = this.trailEffects.length - 1; i >= 0; i--) {
      const trail = this.trailEffects[i];
      
      // Update scale and opacity of material
      if (trail instanceof THREE.Mesh) {
        const material = trail.material as THREE.MeshBasicMaterial;
        if (material) {
          material.opacity -= dt * 1.5;
          trail.scale.x += dt * 0.5;
          trail.scale.y += dt * 0.5;
          trail.scale.z += dt * 0.5;
          
          // Remove when fully faded
          if (material.opacity <= 0) {
            this.scene.remove(trail);
            this.trailEffects.splice(i, 1);
          }
        }
      }
    }
  }
  
  // Handle hit from player
  handleHit(quality: string): void {
    try {
      // Set force based on hit quality
      let force = 0;
      let horizontalForce = 0;
      let effectColor = 0xFFFFFF;
      
      switch (quality) {
        case 'perfect':
          force = 5.0;
          horizontalForce = 0.5;
          effectColor = 0x63AF30; // Green
          this.showPerfectEffect();
          this.hitStreakCount++;
          break;
        case 'good':
          force = 3.0;
          horizontalForce = 1.0;
          effectColor = 0xFFA500; // Orange
          this.showGoodEffect();
          this.hitStreakCount++;
          break;
        case 'ok':
          force = 1.5;
          horizontalForce = 1.5;
          effectColor = 0x4587FF; // Blue
          this.hitStreakCount++;
          break;
        default:
          // Miss - no force
          this.hitStreakCount = 0;
          return;
      }
      
      // Apply upward velocity
      this.velocity.y = force;
      
      // Add some random horizontal movement
      this.velocity.x = (Math.random() - 0.5) * horizontalForce;
      this.velocity.z = (Math.random() - 0.5) * horizontalForce;
      
      // Update bass material color briefly for feedback
      if (this.bass instanceof THREE.Mesh) {
        const originalMaterial = this.bass.material as THREE.MeshStandardMaterial;
        const originalColor = originalMaterial.color.clone();
        
        originalMaterial.color.set(effectColor);
        setTimeout(() => {
          if (originalMaterial) {
            originalMaterial.color.copy(originalColor);
          }
        }, 200);
      }
      
      // Create trail effect
      this.createTrailEffect(quality);
      
      // Check for special effects for combos
      if (window.gameState && window.gameState.combo) {
        if (window.gameState.combo >= 25) {
          this.addPermanentEffect();
        }
      }
      
      this.lastHitQuality = quality;
      console.log(`Bass hit with quality: ${quality}, force: ${force}, streak: ${this.hitStreakCount}`);
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
  
  // Visual effect for good hits
  private showGoodEffect(): void {
    try {
      // Create smaller particle effects for "good" hits
      const particleCount = 10;
      
      for (let i = 0; i < particleCount; i++) {
        const size = 0.05 + Math.random() * 0.05;
        const geometry = new THREE.SphereGeometry(size, 8, 8);
        const material = new THREE.MeshBasicMaterial({ 
          color: 0xFFA500, 
          transparent: true, 
          opacity: 0.7
        });
        
        const particle = new THREE.Mesh(geometry, material);
        
        // Position around the bass
        const angle = Math.random() * Math.PI * 2;
        const radius = 0.3;
        particle.position.set(
          this.position.x + Math.cos(angle) * radius,
          this.position.y,
          this.position.z + Math.sin(angle) * radius
        );
        
        this.scene.add(particle);
        
        // Animate and remove
        const speed = 0.01 + Math.random() * 0.03;
        const direction = new THREE.Vector3(
          Math.cos(angle) * speed,
          0.03 + Math.random() * 0.02,
          Math.sin(angle) * speed
        );
        
        let lifeTime = 0;
        
        const animate = () => {
          lifeTime += 0.016; // Approx 16ms per frame
          
          if (lifeTime > 1) {
            this.scene.remove(particle);
            return;
          }
          
          // Move outward
          particle.position.add(direction);
          
          // Fall down
          direction.y -= 0.001;
          
          // Fade out
          material.opacity = 0.7 * (1 - lifeTime);
          
          requestAnimationFrame(animate);
        };
        
        animate();
      }
    } catch (error) {
      console.error("Error showing good effect:", error);
    }
  }
  
  // Create trail effect behind the bass
  private createTrailEffect(quality: string): void {
    try {
      let trailColor;
      
      switch (quality) {
        case 'perfect':
          trailColor = 0x63AF30; // Green
          break;
        case 'good':
          trailColor = 0xFFA500; // Orange
          break;
        case 'ok':
          trailColor = 0x4587FF; // Blue
          break;
        default:
          trailColor = 0xFFFFFF; // White
      }
      
      // Create a trail element
      const trailGeometry = new THREE.SphereGeometry(0.15, 8, 8);
      const trailMaterial = new THREE.MeshBasicMaterial({
        color: trailColor,
        transparent: true,
        opacity: 0.5
      });
      
      const trail = new THREE.Mesh(trailGeometry, trailMaterial);
      trail.position.copy(this.position);
      
      this.scene.add(trail);
      this.trailEffects.push(trail);
      
      // Limit number of trail effects
      if (this.trailEffects.length > 10) {
        const oldestTrail = this.trailEffects.shift();
        if (oldestTrail) {
          this.scene.remove(oldestTrail);
        }
      }
    } catch (error) {
      console.error("Error creating trail effect:", error);
    }
  }
  
  // Add permanent visual effect for high combos
  private addPermanentEffect(): void {
    try {
      // Don't add duplicates
      if (this.bass.children.find(child => child.name === 'comboEffect')) {
        return;
      }
      
      // Add a combo effect to the bass (e.g., a glowing halo)
      const haloGeometry = new THREE.RingGeometry(0.25, 0.3, 32);
      const haloMaterial = new THREE.MeshBasicMaterial({
        color: 0xFFD700, // Gold
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide
      });
      
      const halo = new THREE.Mesh(haloGeometry, haloMaterial);
      halo.name = 'comboEffect';
      halo.rotation.x = Math.PI / 2;
      
      this.bass.add(halo);
      
      // Add pulsing animation
      const pulseAnimation = () => {
        const time = Date.now() * 0.001;
        halo.scale.set(
          1 + Math.sin(time * 2) * 0.2,
          1 + Math.sin(time * 2) * 0.2,
          1
        );
        haloMaterial.opacity = 0.3 + Math.sin(time * 2) * 0.2;
        
        // Continue the animation
        requestAnimationFrame(pulseAnimation);
      };
      
      pulseAnimation();
    } catch (error) {
      console.error("Error adding permanent effect:", error);
    }
  }
}

export default BassController;
