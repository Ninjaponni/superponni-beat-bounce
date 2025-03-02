
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { Audio, AudioLoader, LoadingManager, BoxGeometry, MeshBasicMaterial, Mesh, Object3D } from 'three';
import { toast } from "sonner";

type ResourceType = 'model' | 'animation' | 'audio' | 'texture';

interface Resource {
  type: ResourceType;
  name: string;
  url: string;
  required: boolean;
}

interface LoadingProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export class AssetLoader {
  private models: Map<string, any> = new Map();
  private animations: Map<string, any> = new Map();
  private audio: Map<string, AudioBuffer> = new Map();
  private textures: Map<string, any> = new Map();
  private loadingManager: LoadingManager;
  private progressCallback: ((progress: LoadingProgress) => void) | null = null;
  
  constructor() {
    this.loadingManager = new LoadingManager();
    
    this.loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
      console.log(`Laster: ${itemsLoaded}/${itemsTotal} ${url}`);
      
      if (this.progressCallback) {
        this.progressCallback({
          loaded: itemsLoaded,
          total: itemsTotal,
          percentage: Math.round((itemsLoaded / itemsTotal) * 100)
        });
      }
    };
    
    this.loadingManager.onError = (url) => {
      console.error(`Feil ved lasting: ${url}`);
      toast.error(`Kunne ikke laste: ${url}`, {
        description: "Spillet vil forsøke å bruke en forenklet versjon i stedet."
      });
    };
  }
  
  setProgressCallback(callback: (progress: LoadingProgress) => void): void {
    this.progressCallback = callback;
  }
  
  async loadAll(): Promise<boolean> {
    try {
      // Definer alle ressurser som skal lastes
      const resources: Resource[] = [
        // Modeller og animasjoner
        { type: 'model', name: 'idle', url: '/models/Idle.fbx', required: true },
        { type: 'model', name: 'kickLeft', url: '/models/Kick Soccerball L.fbx', required: false },
        { type: 'model', name: 'kickRight', url: '/models/Kick Soccerball R.fbx', required: false },
        { type: 'model', name: 'victory', url: '/models/Victory.fbx', required: false },
        { type: 'model', name: 'defeat', url: '/models/Defeat.fbx', required: false },
        
        // Lydeffekter og musikk
        { type: 'audio', name: 'beat', url: '/audio/beat.mp3', required: false },
        { type: 'audio', name: 'perfect', url: '/audio/perfect.wav', required: false },
        { type: 'audio', name: 'good', url: '/audio/good.wav', required: false },
        { type: 'audio', name: 'miss', url: '/audio/miss.wav', required: false },
        { type: 'audio', name: 'music', url: '/audio/vi_e_trondera.mp3', required: true }
      ];
      
      // Last alle ressurser, med progress-oppdatering
      const results = await Promise.allSettled(
        resources.map(resource => this.loadResource(resource))
      );
      
      // Håndter resultater og sjekk for manglende påkrevde ressurser
      const missingRequired = results
        .map((result, index) => ({ result, resource: resources[index] }))
        .filter(({result, resource}) => result.status === 'rejected' && resource.required);
      
      // Logg resultater
      console.log("Ressurslasting fullført:", {
        total: resources.length,
        successful: results.filter(r => r.status === 'fulfilled').length,
        failed: results.filter(r => r.status === 'rejected').length,
        missingRequired: missingRequired.length
      });
      
      // Opprett fallback-ressurser for alle ressurser som feilet
      this.createFallbackResources(
        results
          .map((result, index) => ({ result, resource: resources[index] }))
          .filter(({result}) => result.status === 'rejected')
          .map(({resource}) => resource)
      );
      
      // Hvis vi mangler påkrevde ressurser, returner false
      if (missingRequired.length > 0) {
        const missingNames = missingRequired.map(({resource}) => resource.name).join(', ');
        console.error('Mangler påkrevde ressurser:', missingNames);
        toast.error("Kunne ikke laste nødvendige ressurser", {
          description: `Mangler: ${missingNames}. Vennligst last siden på nytt.`
        });
        return false;
      }
      
      toast.success("Alle ressurser lastet", {
        description: "Spillet er klart til å spille!"
      });
      return true;
    } catch (error) {
      console.error("Kunne ikke laste alle ressurser:", error);
      toast.error("En feil oppstod under lasting av ressurser", {
        description: "Prøv å laste siden på nytt eller fortsett med forenklede ressurser."
      });
      
      // Vi oppretter fallback-ressurser selv om noe gikk galt
      this.createFallbackResources([
        { type: 'model', name: 'idle', url: '', required: true },
        { type: 'model', name: 'kickLeft', url: '', required: false },
        { type: 'model', name: 'kickRight', url: '', required: false },
        { type: 'model', name: 'victory', url: '', required: false },
        { type: 'model', name: 'defeat', url: '', required: false },
      ]);
      return true; // Returnerer true for å la spillet fortsette med fallbacks
    }
  }
  
  private async loadResource(resource: Resource): Promise<void> {
    try {
      console.log(`Laster ${resource.type}: ${resource.name} fra ${resource.url}`);
      
      switch (resource.type) {
        case 'model':
          await this.loadModel(resource.name, resource.url);
          break;
        case 'audio':
          await this.loadAudio(resource.name, resource.url);
          break;
        case 'texture':
          // Implementer teksturlasting etter behov
          break;
        default:
          console.warn(`Ukjent ressurstype: ${resource.type}`);
      }
    } catch (error) {
      console.error(`Feil ved lasting av ${resource.type} ${resource.name}:`, error);
      throw error; // Propagerer feilen for å bli fanget av Promise.allSettled
    }
  }
  
  private createFallbackResources(failedResources: Resource[]): void {
    console.log(`Oppretter fallback-ressurser for ${failedResources.length} ressurser`);
    
    // Grupper etter type for enklere håndtering
    const byType = failedResources.reduce((acc, resource) => {
      if (!acc[resource.type]) {
        acc[resource.type] = [];
      }
      acc[resource.type].push(resource.name);
      return acc;
    }, {} as Record<ResourceType, string[]>);
    
    // Opprett fallbacks for modeller
    if (byType.model) {
      byType.model.forEach(modelName => {
        console.log(`Oppretter fallback for modell: ${modelName}`);
        const geometry = new BoxGeometry(0.5, 1, 0.5);
        const color = this.getFallbackColor(modelName);
        const material = new MeshBasicMaterial({ color });
        const fallbackModel = new Mesh(geometry, material);
        
        // Gi modellen et gjenkjennelig navn for debugging
        fallbackModel.name = `fallback-${modelName}`;
        
        // Legg til en dummy-animasjon
        const dummyAnimation = {
          name: modelName,
          duration: 1,
          tracks: []
        };
        
        this.models.set(modelName, fallbackModel);
        this.animations.set(modelName, dummyAnimation);
      });
    }
    
    // Opprett fallbacks for lyd
    if (byType.audio) {
      byType.audio.forEach(audioName => {
        console.log(`Oppretter tom lydbuffer for: ${audioName}`);
        // Oppretter en tom AudioBuffer - spill vil håndtere null-sjekk
        this.audio.set(audioName, null);
      });
    }
  }
  
  // Velg farge basert på modellnavn for bedre visuell gjenkjenning
  private getFallbackColor(modelName: string): number {
    switch (modelName) {
      case 'idle': return 0x00ff00; // grønn
      case 'kickLeft': return 0xff0000; // rød
      case 'kickRight': return 0x0000ff; // blå
      case 'victory': return 0xffff00; // gul
      case 'defeat': return 0xff00ff; // magenta
      default: return 0x808080; // grå
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
      
      console.log(`Lastet modell: ${name}`);
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
      console.log(`Lastet lyd: ${name}`);
    } catch (error) {
      console.error(`Kunne ikke laste lyd ${name}:`, error);
      throw error;
    }
  }
  
  // Getter-metoder for ressursene
  getModel(name: string) {
    return this.models.get(name);
  }
  
  getAnimation(name: string) {
    return this.animations.get(name);
  }
  
  getAudio(name: string) {
    return this.audio.get(name);
  }
  
  // Sjekk om en bestemt ressurs er lastet
  hasResource(type: ResourceType, name: string): boolean {
    switch (type) {
      case 'model': return this.models.has(name);
      case 'animation': return this.animations.has(name);
      case 'audio': return this.audio.has(name);
      case 'texture': return this.textures.has(name);
      default: return false;
    }
  }
  
  // Hent en liste over alle lastede ressurser, nyttig for debugging
  getLoadedResources(): { type: string, name: string, isFallback: boolean }[] {
    const resources = [];
    
    this.models.forEach((value, key) => {
      resources.push({
        type: 'model',
        name: key,
        isFallback: value.name?.startsWith('fallback-') ?? false
      });
    });
    
    this.animations.forEach((value, key) => {
      if (!this.models.has(key)) {
        resources.push({
          type: 'animation',
          name: key,
          isFallback: false
        });
      }
    });
    
    this.audio.forEach((value, key) => {
      resources.push({
        type: 'audio',
        name: key,
        isFallback: value === null
      });
    });
    
    return resources;
  }
}

export default AssetLoader;
