
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { Audio } from 'three';
import { AudioLoader, LoadingManager, BoxGeometry, MeshBasicMaterial, Mesh, Object3D } from 'three';

export class AssetLoader {
  private models: Map<string, any> = new Map();
  private animations: Map<string, any> = new Map();
  private audio: Map<string, AudioBuffer> = new Map();
  private loadingManager: LoadingManager;
  
  constructor() {
    this.loadingManager = new LoadingManager();
    
    this.loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
      console.log(`Loading: ${itemsLoaded}/${itemsTotal} ${url}`);
    };
    
    this.loadingManager.onError = (url) => {
      console.error(`Error loading: ${url}`);
    };
  }
  
  async loadAll(): Promise<boolean> {
    try {
      // Prøv å laste modeller og animasjoner, men ikke stopp hvis enkelte filer mangler
      const loadingPromises = [
        this.loadModel('idle', '/models/Idle.fbx', true),
        this.loadModel('kickLeft', '/models/Kick Soccerball L.fbx', true),
        this.loadModel('kickRight', '/models/Kick Soccerball R.fbx', true),
        this.loadModel('victory', '/models/Victory.fbx', true),
        this.loadModel('defeat', '/models/Defeat.fbx', true),
        
        // TODO: Legg til bass modell
        // this.loadModel('bass', '/models/bass.fbx'),
        
        // Prøv å laste lyder, men ikke stopp hvis de mangler
        this.loadAudio('beat', '/audio/beat.mp3', true),
        this.loadAudio('perfect', '/audio/perfect.wav', true),
        this.loadAudio('good', '/audio/good.wav', true),
        this.loadAudio('miss', '/audio/miss.wav', true),
        this.loadAudio('music', '/audio/vi_e_trondera.mp3', true)
      ];
      
      // Vent på at alle forsøkene fullføres (uavhengig av om de lykkes)
      await Promise.allSettled(loadingPromises);
      
      // Opprett fallback-ressurser for manglende filer
      this.createFallbackResources();
      
      return true;
    } catch (error) {
      console.error("Kunne ikke laste alle ressurser:", error);
      // Vi oppretter fallback-ressurser selv om noe gikk galt
      this.createFallbackResources();
      return true; // Returnerer true for å la spillet fortsette
    }
  }
  
  private createFallbackResources(): void {
    // Sjekk om vi mangler noen grunnleggende modeller og opprett fallbacks
    const requiredModels = ['idle', 'kickLeft', 'kickRight', 'victory', 'defeat'];
    
    for (const modelName of requiredModels) {
      if (!this.models.has(modelName)) {
        console.log(`Oppretter fallback for modell: ${modelName}`);
        const geometry = new BoxGeometry(0.5, 1, 0.5);
        const material = new MeshBasicMaterial({ color: 0x00ff00 });
        const fallbackModel = new Mesh(geometry, material);
        
        // Legg til en dummy-animasjon
        const dummyAnimation = {
          name: modelName,
          duration: 1,
          tracks: []
        };
        
        this.models.set(modelName, fallbackModel);
        this.animations.set(modelName, dummyAnimation);
      }
    }
  }
  
  private async loadModel(name: string, path: string, allowFailure: boolean = false): Promise<void> {
    try {
      const loader = new FBXLoader(this.loadingManager);
      const model = await loader.loadAsync(path);
      
      // Lagre modeller og animasjoner separat
      this.models.set(name, model);
      
      if (model.animations.length > 0) {
        this.animations.set(name, model.animations[0]);
      }
      
      console.log(`Loaded model: ${name}`);
    } catch (error) {
      console.error(`Kunne ikke laste modell ${name}:`, error);
      if (!allowFailure) {
        throw error;
      }
    }
  }
  
  private async loadAudio(name: string, path: string, allowFailure: boolean = false): Promise<void> {
    try {
      const loader = new AudioLoader(this.loadingManager);
      const buffer = await loader.loadAsync(path);
      this.audio.set(name, buffer);
      console.log(`Loaded audio: ${name}`);
    } catch (error) {
      console.error(`Kunne ikke laste lyd ${name}:`, error);
      if (!allowFailure) {
        throw error;
      }
    }
  }
  
  getModel(name: string) {
    return this.models.get(name);
  }
  
  getAnimation(name: string) {
    return this.animations.get(name);
  }
  
  getAudio(name: string) {
    return this.audio.get(name);
  }
}

export default AssetLoader;
