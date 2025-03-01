
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { Audio } from 'three';
import { AudioLoader, LoadingManager } from 'three';

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
      // Last modeller og animasjoner
      await Promise.all([
        this.loadModel('idle', '/models/Idle.fbx'),
        this.loadModel('kickLeft', '/models/Kick Soccerball L.fbx'),
        this.loadModel('kickRight', '/models/Kick Soccerball R.fbx'),
        this.loadModel('victory', '/models/Victory.fbx'),
        this.loadModel('defeat', '/models/Defeat.fbx'),
        
        // TODO: Legg til bass modell
        // this.loadModel('bass', '/models/bass.fbx'),
        
        // Last lyder
        // Disse filene må opprettes eller erstattes med faktiske filer
        this.loadAudio('beat', '/audio/beat.mp3'),
        this.loadAudio('perfect', '/audio/perfect.wav'),
        this.loadAudio('good', '/audio/good.wav'),
        this.loadAudio('miss', '/audio/miss.wav'),
        this.loadAudio('music', '/audio/vi_e_trondera.mp3')
      ]);
      
      return true;
    } catch (error) {
      console.error("Kunne ikke laste alle ressurser:", error);
      return false;
    }
  }
  
  private async loadModel(name: string, path: string): Promise<void> {
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
      throw error;
    }
  }
  
  private async loadAudio(name: string, path: string): Promise<void> {
    try {
      const loader = new AudioLoader(this.loadingManager);
      const buffer = await loader.loadAsync(path);
      this.audio.set(name, buffer);
      console.log(`Loaded audio: ${name}`);
    } catch (error) {
      console.error(`Kunne ikke laste lyd ${name}:`, error);
      throw error;
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
