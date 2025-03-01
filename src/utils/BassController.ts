import * as THREE from 'three';

export interface BassHitResult {
  hit: boolean;
  score: 'perfect' | 'good' | 'miss';
}

export class BassController {
  private scene: THREE.Scene;
  private bass: THREE.Object3D | null = null;
  private group: THREE.Group; // Gruppe som inneholder alle visuelle elementer
  
  // Fysikk-variabler
  private position: THREE.Vector3 = new THREE.Vector3(0, 0.5, 1.5); // Startposisjon foran karakteren
  private velocity: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  private gravity: number = 9.8;
  private groundLevel: number = 0.1; // Y-koordinat for bakken
  private bounceFactor: number = 0.7; // Hvor mye bassen spretter
  private airResistance: number = 0.98; // Luftmotstand
  
  // Spill-variabler
  private isActive: boolean = false;
  private missCount: number = 0;
  private maxMisses: number = 3;
  private onGameOver: () => void = () => {};
  
  // Visuelle effekter
  private trail: THREE.Mesh[] = [];
  private trailLength: number = 10;
  private showTrail: boolean = false;
  private particleSystem: THREE.Points | null = null;
  private shadow: THREE.Mesh | null = null;
  
  constructor(scene: THREE.Scene) {
    this.scene = scene;
    
    // Opprett gruppe for alle objekter relatert til bassen
    this.group = new THREE.Group();
    this.scene.add(this.group);
    
    this.setupParticleSystem();
    this.createShadow();
  }
  
  // Getter for å hente gruppen for rendering
  get object3D(): THREE.Object3D {
    return this.group;
  }
  
  // Setter opp bassen med en modell
  setBassModel(model: THREE.Object3D): void {
    if (this.bass) {
      this.group.remove(this.bass);
    }
    
    this.bass = model.clone();
    
    // Sikre at størrelsen er fornuftig (bassen bør være ca 30-40cm)
    const box = new THREE.Box3().setFromObject(this.bass);
    const size = box.getSize(new THREE.Vector3());
    const scale = 0.35 / Math.max(size.x, size.y, size.z);
    
    this.bass.scale.set(scale, scale, scale);
    this.bass.position.copy(this.position);
    
    this.group.add(this.bass);
  }
  
  // Oppretter skyggen under bassen
  private createShadow(): void {
    const shadowGeometry = new THREE.CircleGeometry(0.2, 16);
    const shadowMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.3,
      depthWrite: false
    });
    
    this.shadow = new THREE.Mesh(shadowGeometry, shadowMaterial);
    this.shadow.rotation.x = -Math.PI / 2; // Legg flatt på bakken
    this.shadow.position.set(this.position.x, this.groundLevel + 0.01, this.position.z); // Litt over bakken
    this.shadow.name = 'bass-shadow';
    
    this.group.add(this.shadow);
  }
  
  // Setter opp partikkelsystemet for effekter
  private setupParticleSystem(): void {
    const particleCount = 30;
    const particleGeometry = new THREE.BufferGeometry();
    const particles = new Float32Array(particleCount * 3);
    
    // Fyll med startposisjoner (alle på (0,0,0) initialt)
    for (let i = 0; i < particleCount; i++) {
      particles[i * 3] = 0;     // x
      particles[i * 3 + 1] = 0;  // y
      particles[i * 3 + 2] = 0;  // z
    }
    
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particles, 3));
    
    // Partikkelmaterial (små lysende punkter)
    const particleMaterial = new THREE.PointsMaterial({
      color: 0xFFFF00,
      size: 0.05,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    
    this.particleSystem = new THREE.Points(particleGeometry, particleMaterial);
    this.particleSystem.visible = false; // Skjult til vi trenger det
    this.group.add(this.particleSystem);
  }
  
  // Starter bassespillet
  start(): void {
    this.isActive = true;
    this.missCount = 0;
    
    // Tilbakestill bassen til startposisjon
    this.position.set(0, 0.5, 1.5);
    this.velocity.set(0, 0, 0);
    
    // Oppdater bassemodellen
    if (this.bass) {
      this.bass.position.copy(this.position);
      this.bass.visible = true;
    }
    
    // Nullstill trail
    this.clearTrail();
  }
  
  // Oppdaterer basse-fysikken
  update(deltaTime: number): void {
    if (!this.isActive || !this.bass) return;
    
    // Konverter til sekunder hvis deltaTime er i ms
    const dt = deltaTime > 0.1 ? deltaTime / 1000 : deltaTime;
    
    // Begrens deltaTime for å unngå store hopp ved lag
    const cappedDt = Math.min(dt, 0.1);
    
    // Oppdater hastighet med gravitasjon
    this.velocity.y -= this.gravity * cappedDt;
    
    // Bruk luftmotstand
    this.velocity.multiplyScalar(this.airResistance);
    
    // Oppdater posisjon basert på hastighet
    this.position.x += this.velocity.x * cappedDt;
    this.position.y += this.velocity.y * cappedDt;
    this.position.z += this.velocity.z * cappedDt;
    
    // Håndter kollisjon med bakken
    if (this.position.y < this.groundLevel) {
      // Bassen treffer bakken
      this.position.y = this.groundLevel;
      
      // Hvis bassen har nok hastighet, sprett
      if (Math.abs(this.velocity.y) > 1.0) {
        // Revers y-hastighet med bounce-faktor
        this.velocity.y = -this.velocity.y * this.bounceFactor;
        
        // Reduser x og z hastighet litt på grunn av friksjon
        this.velocity.x *= 0.9;
        this.velocity.z *= 0.9;
        
        // Spill treff-effekt
        this.playGroundHitEffect();
      } else {
        // Bassen har stoppet å sprette - teller som en miss
        this.velocity.set(0, 0, 0);
        this.handleMiss();
      }
    }
    
    // Begrens hvor langt bassen kan bevege seg
    const bounds = {
      x: { min: -5, max: 5 },
      z: { min: -3, max: 5 }
    };
    
    // Hvis bassen går utenfor banen, send den tilbake med redusert hastighet
    if (this.position.x < bounds.x.min) {
      this.position.x = bounds.x.min;
      this.velocity.x = -this.velocity.x * 0.7;
    } else if (this.position.x > bounds.x.max) {
      this.position.x = bounds.x.max;
      this.velocity.x = -this.velocity.x * 0.7;
    }
    
    if (this.position.z < bounds.z.min) {
      this.position.z = bounds.z.min;
      this.velocity.z = -this.velocity.z * 0.7;
    } else if (this.position.z > bounds.z.max) {
      this.position.z = bounds.z.max;
      this.velocity.z = -this.velocity.z * 0.7;
    }
    
    // Oppdater bass-modellen og dens rotasjon
    this.bass.position.copy(this.position);
    
    // Roter bassen basert på bevegelse for mer realistisk effekt
    const rotationSpeed = 3.0;
    this.bass.rotation.x += this.velocity.z * rotationSpeed * cappedDt;
    this.bass.rotation.z -= this.velocity.x * rotationSpeed * cappedDt;
    
    // Oppdater skyggeposisjon og størrelse
    if (this.shadow) {
      this.shadow.position.x = this.position.x;
      this.shadow.position.z = this.position.z;
      
      // Skyggestørrelse basert på høyde
      const shadowScale = Math.max(0.2, 0.4 - this.position.y * 0.1);
      this.shadow.scale.set(shadowScale, shadowScale, 1);
      
      // Skygge-opacity
      const material = this.shadow.material as THREE.MeshBasicMaterial;
      material.opacity = Math.max(0.1, 0.4 - this.position.y * 0.1);
    }
    
    // Oppdater trail hvis aktivert
    if (this.showTrail) {
      this.updateTrail();
    }
  }
  
  // Håndterer spillerens treff på beaten
  handleHit(score: 'perfect' | 'good' | 'miss'): void {
    if (!this.isActive) return;
    
    // Beregn kraft basert på kvaliteten på treffet
    let force = 0;
    let horizontalRandomness = 0;
    
    switch (score) {
      case 'perfect':
        force = 10.0;
        horizontalRandomness = 0.2;
        this.showPerfectHitEffect();
        break;
      case 'good':
        force = 7.0;
        horizontalRandomness = 0.6;
        break;
      case 'miss':
        // Ingen kraft
        this.handleMiss();
        return;
    }
    
    // Legg til en oppadrettet kraft
    this.velocity.y = force;
    
    // Legg til litt tilfeldig horisontal bevegelse
    this.velocity.x += (Math.random() * 2 - 1) * horizontalRandomness;
    this.velocity.z += (Math.random() * 2 - 1) * horizontalRandomness;
    
    // Aktiver trail ved perfekte treff
    this.showTrail = (score === 'perfect');
    if (this.showTrail) {
      this.clearTrail(); // Start med ny trail
    }
  }
  
  // Håndterer en miss
  private handleMiss(): void {
    this.missCount++;
    
    // Sjekk om spillet er over
    if (this.missCount >= this.maxMisses) {
      this.isActive = false;
      
      // Kall game over callback
      this.onGameOver();
    } else {
      // Resett bassen til en posisjon foran spilleren
      this.position.set(0, 0.5, 1.5);
      this.velocity.set(0, 0, 0);
      
      // Vis "miss" visuell feedback
      this.showMissEffect();
    }
  }
  
  // Visuelle effekter når bassen treffer bakken
  private playGroundHitEffect(): void {
    if (!this.particleSystem) return;
    
    // Få tilgang til partikkelsystemets geometri
    const geometry = this.particleSystem.geometry;
    const positions = geometry.getAttribute('position').array;
    
    // Opprett en liten støveffekt ved treffpunktet
    for (let i = 0; i < positions.length / 3; i++) {
      // Sett partikkelposisjon nær treffpunktet med litt tilfeldig offset
      positions[i * 3] = this.position.x + (Math.random() * 0.3 - 0.15);
      positions[i * 3 + 1] = this.groundLevel + (Math.random() * 0.1);
      positions[i * 3 + 2] = this.position.z + (Math.random() * 0.3 - 0.15);
    }
    
    // Oppdater posisjonsattributtet
    geometry.getAttribute('position').needsUpdate = true;
    
    // Gjør partiklene synlige
    this.particleSystem.visible = true;
    
    // Skjul partiklene etter kort tid
    setTimeout(() => {
      if (this.particleSystem) {
        this.particleSystem.visible = false;
      }
    }, 300);
  }
  
  // Viser en effekt for perfekte treff
  private showPerfectHitEffect(): void {
    if (!this.bass) return;
    
    // Opprett en pulserende ring
    const ringGeometry = new THREE.RingGeometry(0.2, 0.3, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0x63AF30,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.position.copy(this.position);
    ring.rotation.x = -Math.PI / 2; // Legg flatt
    this.group.add(ring);
    
    // Animer ringen
    const startTime = performance.now();
    const duration = 500; // ms
    
    const animateRing = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1.0);
      
      // Skaler ringen utover
      const scale = 1.0 + progress * 2.0;
      ring.scale.set(scale, scale, 1);
      
      // Fade ut
      (ring.material as THREE.MeshBasicMaterial).opacity = 0.7 * (1 - progress);
      
      if (progress < 1.0) {
        requestAnimationFrame(animateRing);
      } else {
        // Fjern ringen når animasjonen er ferdig
        this.group.remove(ring);
        ring.geometry.dispose();
        (ring.material as THREE.MeshBasicMaterial).dispose();
      }
    };
    
    requestAnimationFrame(animateRing);
  }
  
  // Viser en effekt for misses
  private showMissEffect(): void {
    if (!this.bass) return;
    
    // Lagre originale materialer
    const originalMaterials: Map<THREE.Mesh, THREE.Material | THREE.Material[]> = new Map();
    const flashMaterial = new THREE.MeshBasicMaterial({ color: 0xE91F1F });
    
    // Sett rød farge på alle mesh i bassen
    this.bass.traverse(child => {
      if (child instanceof THREE.Mesh) {
        originalMaterials.set(child, child.material);
        child.material = flashMaterial;
      }
    });
    
    // Tilbakestill etter kort tid
    setTimeout(() => {
      if (!this.bass) return;
      
      this.bass.traverse(child => {
        if (child instanceof THREE.Mesh && originalMaterials.has(child)) {
          child.material = originalMaterials.get(child)!;
        }
      });
    }, 200);
  }
  
  // Metoder for trail-effekt
  private updateTrail(): void {
    if (!this.bass) return;
    
    // Bare oppdater trail når bassen er i bevegelse
    if (this.velocity.length() < 0.5) return;
    
    // Opprett et nytt trail-element
    const trailGeometry = new THREE.SphereGeometry(0.05, 8, 8);
    const trailMaterial = new THREE.MeshBasicMaterial({
      color: 0x63AF30,
      transparent: true,
      opacity: 0.7
    });
    
    const trailElement = new THREE.Mesh(trailGeometry, trailMaterial);
    trailElement.position.copy(this.position);
    this.group.add(trailElement);
    
    // Begrens trail-lengde
    if (this.trail.length > this.trailLength) {
      const oldestElement = this.trail.shift();
      if (oldestElement) {
        this.group.remove(oldestElement);
        oldestElement.geometry.dispose();
        (oldestElement.material as THREE.MeshBasicMaterial).dispose();
      }
    }
    
    // Oppdater opacity basert på posisjon i trail
    this.trail.forEach((element, index) => {
      const opacity = 0.7 * (index / this.trail.length);
      (element.material as THREE.MeshBasicMaterial).opacity = opacity;
    });
  }
  
  // Fjern trail
  private clearTrail(): void {
    this.trail.forEach(element => {
      this.group.remove(element);
      element.geometry.dispose();
      (element.material as THREE.MeshBasicMaterial).dispose();
    });
    this.trail = [];
  }
  
  // Setter callback for game over
  setOnGameOver(callback: () => void): void {
    this.onGameOver = callback;
  }
  
  // Hent antall misses
  getMissCount(): number {
    return this.missCount;
  }
  
  // Sjekk om bassen er aktiv
  isGameActive(): boolean {
    return this.isActive;
  }
  
  // Reset alt
  reset(): void {
    this.isActive = false;
    this.missCount = 0;
    this.position.set(0, 0.5, 1.5);
    this.velocity.set(0, 0, 0);
    
    if (this.bass) {
      this.bass.position.copy(this.position);
      this.bass.rotation.set(0, 0, 0);
    }
    
    this.clearTrail();
    this.showTrail = false;
    
    if (this.particleSystem) {
      this.particleSystem.visible = false;
    }
  }
}
