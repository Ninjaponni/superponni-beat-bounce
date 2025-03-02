export class AudioManager {
  private static instance: AudioManager;
  private audioContext: AudioContext | null = null;
  private sounds: Map<string, AudioBuffer> = new Map();
  private soundUrls: Map<string, string> = new Map();
  private music: HTMLAudioElement | null = null;
  private bpm: number = 130; // Default BPM
  private beatInterval: number = 60000 / 130; // ms between beats (default)
  private beatCallbacks: Array<(time: number) => void> = [];
  private beatIntervalId: number | null = null;
  
  protected constructor() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.initSoundLibrary();
      console.log("AudioContext created successfully");
    } catch (error) {
      console.error("Failed to create AudioContext:", error);
    }
  }
  
  private initSoundLibrary() {
    this.soundUrls.set('perfect', '/audio/perfect.wav');
    this.soundUrls.set('good', '/audio/good.wav');
    this.soundUrls.set('ok', '/audio/ok.wav');
    this.soundUrls.set('miss', '/audio/miss.wav');
    this.soundUrls.set('music', '/audio/vi_e_trondera.mp3');
    this.soundUrls.set('countdown', '/audio/countdown.wav');
    this.soundUrls.set('start', '/audio/start.wav');
    this.soundUrls.set('victory', '/audio/victory.wav');
    this.soundUrls.set('defeat', '/audio/defeat.wav');
    this.soundUrls.set('needle_scratch', '/audio/needle_scratch.wav');
    
    console.log("Sound library initialized with default paths");
  }
  
  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }
  
  private getSoundUrl(name: string): string {
    if (this.soundUrls.has(name)) {
      return this.soundUrls.get(name)!;
    } else {
      console.warn(`Sound '${name}' not found in library, using fallback`);
      return `/audio/${name}.mp3`;
    }
  }
  
  public async loadAllSounds(): Promise<void> {
    try {
      const loadPromises: Promise<void>[] = [];
      
      this.soundUrls.forEach((url, name) => {
        loadPromises.push(this.loadSound(name, url));
      });
      
      await Promise.allSettled(loadPromises);
      console.log("All sounds loaded successfully");
    } catch (error) {
      console.error("Failed to load all sounds:", error);
    }
  }
  
  public async loadSound(name: string, url: string): Promise<void> {
    if (!this.audioContext) return;
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      this.sounds.set(name, audioBuffer);
      console.log(`Sound '${name}' loaded successfully`);
    } catch (error) {
      console.error(`Failed to load sound '${name}' from ${url}:`, error);
      
      if (name === 'music' || name === 'perfect' || name === 'miss') {
        this.createFallbackSound(name);
      }
    }
  }
  
  private createFallbackSound(name: string): void {
    if (!this.audioContext) return;
    
    try {
      const sampleRate = this.audioContext.sampleRate;
      const buffer = this.audioContext.createBuffer(1, sampleRate * 0.5, sampleRate);
      const channelData = buffer.getChannelData(0);
      
      if (name === 'perfect') {
        for (let i = 0; i < channelData.length; i++) {
          channelData[i] = Math.sin(i * 0.02) * Math.exp(-i * 0.001);
        }
      } else if (name === 'miss') {
        for (let i = 0; i < channelData.length; i++) {
          channelData[i] = Math.sin(i * 0.01) * Math.exp(-i * 0.001);
        }
      } else {
        for (let i = 0; i < channelData.length; i++) {
          channelData[i] = (Math.random() * 2 - 1) * Math.exp(-i * 0.0005);
        }
      }
      
      this.sounds.set(name, buffer);
      console.log(`Created fallback sound for '${name}'`);
    } catch (error) {
      console.error(`Failed to create fallback sound for '${name}':`, error);
    }
  }
  
  public playSound(name: string, volume: number = 1.0): void {
    if (!this.audioContext) return;
    
    const sound = this.sounds.get(name);
    if (!sound) {
      console.warn(`Sound '${name}' not found`);
      return;
    }
    
    try {
      const source = this.audioContext.createBufferSource();
      source.buffer = sound;
      
      const gainNode = this.audioContext.createGain();
      gainNode.gain.value = volume;
      
      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      source.start(0);
    } catch (error) {
      console.error(`Failed to play sound '${name}':`, error);
    }
  }
  
  public playHitSound(quality: string): void {
    switch (quality) {
      case 'perfect':
        this.playSound('perfect', 1.0);
        break;
      case 'good':
        this.playSound('good', 0.8);
        break;
      case 'ok':
        this.playSound('ok', 0.6);
        break;
      default:
        console.warn(`Unknown hit quality: ${quality}`);
        break;
    }
  }
  
  public playMusic(name: string, volume: number = 0.7): void {
    try {
      this.stopMusic();
      
      this.bpm = 130; // Default BPM for "Vi e trøndera"
      this.beatInterval = 60000 / this.bpm;
      
      const audio = new Audio();
      
      audio.src = this.getSoundUrl(name);
      audio.loop = true;
      audio.volume = volume;
      
      const startMusic = async () => {
        const startTime = performance.now();
        console.log(`Music '${name}' started at ${startTime}ms with BPM ${this.bpm}`);
        
        this.setupBeatCallbacks(startTime);
        
        if (window.rhythmEngine) {
          window.rhythmEngine.synchronize(startTime, this.beatInterval);
        }
      };
      
      audio.addEventListener('playing', startMusic, { once: true });
      
      audio.play().catch(error => {
        console.error(`Failed to play music '${name}':`, error);
        if (this.sounds.has(name)) {
          this.playFallbackMusic(name, volume);
        }
      });
      
      this.music = audio;
    } catch (error) {
      console.error(`Failed to play music '${name}':`, error);
      if (this.sounds.has(name)) {
        this.playFallbackMusic(name, volume);
      }
    }
  }
  
  private playFallbackMusic(name: string, volume: number = 0.7): void {
    if (!this.audioContext) return;
    
    const sound = this.sounds.get(name);
    if (!sound) {
      console.error(`No fallback available for music '${name}'`);
      return;
    }
    
    try {
      const source = this.audioContext.createBufferSource();
      source.buffer = sound;
      source.loop = true;
      
      const gainNode = this.audioContext.createGain();
      gainNode.gain.value = volume;
      
      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      source.start(0);
      
      this.music = new Audio();
      this.music.volume = volume;
      
      (this.music as any)._sourceNode = source;
      (this.music as any)._gainNode = gainNode;
      
      console.log(`Fallback music '${name}' started playing`);
      
      const startTime = performance.now();
      this.setupBeatCallbacks(startTime);
      
      if (window.rhythmEngine) {
        try {
          window.rhythmEngine.synchronize(startTime, this.beatInterval);
        } catch (error) {
          console.warn("Failed to synchronize with rhythm engine:", error);
        }
      } else {
        console.log("Rhythm engine not available, skipping synchronization");
      }
    } catch (error) {
      console.error(`Failed to play fallback music '${name}':`, error);
    }
  }
  
  private setupBeatCallbacks(startTime: number): void {
    if (this.beatIntervalId !== null) {
      window.clearInterval(this.beatIntervalId);
      this.beatIntervalId = null;
    }
    
    const currentTime = performance.now();
    const timeSinceStart = currentTime - startTime;
    const beatPhase = timeSinceStart % this.beatInterval;
    const timeToFirstBeat = this.beatInterval - beatPhase;
    
    setTimeout(() => {
      this.triggerBeatCallbacks(performance.now());
      
      this.beatIntervalId = window.setInterval(() => {
        this.triggerBeatCallbacks(performance.now());
      }, this.beatInterval);
    }, timeToFirstBeat);
    
    console.log(`Beat callbacks scheduled with interval ${this.beatInterval.toFixed(2)}ms (${this.bpm} BPM)`);
    
    if (window.rhythmEngine) {
      try {
        window.rhythmEngine.synchronize(startTime, this.beatInterval);
        console.log("RhythmEngine synchronized with AudioManager");
      } catch (error) {
        console.warn("Failed to synchronize with rhythm engine:", error);
      }
    } else {
      console.warn("Global rhythm engine not available for synchronization");
    }
  }
  
  private triggerBeatCallbacks(time: number): void {
    this.beatCallbacks.forEach(callback => callback(time));
  }
  
  public playGameOverEffects(): void {
    this.playSound('needle_scratch', 1.0);
    
    if (this.music) {
      const fadeOutStep = 0.05;
      const fadeInterval = 100;
      const fadeOutMusic = () => {
        if (this.music && this.music.volume > fadeOutStep) {
          this.music.volume -= fadeOutStep;
          setTimeout(fadeOutMusic, fadeInterval);
        } else if (this.music) {
          this.music.pause();
          this.music = null;
          
          if (this.beatIntervalId !== null) {
            window.clearInterval(this.beatIntervalId);
            this.beatIntervalId = null;
          }
        }
      };
      fadeOutMusic();
    }
    
    this.playSound('defeat', 1.0);
  }
  
  public stopMusic(): void {
    if (this.music) {
      if ((this.music as any)._sourceNode) {
        try {
          (this.music as any)._sourceNode.stop();
        } catch (error) {
          console.error("Error stopping fallback music source:", error);
        }
      } else {
        this.music.pause();
      }
      
      this.music = null;
    }
    
    if (this.beatIntervalId !== null) {
      window.clearInterval(this.beatIntervalId);
      this.beatIntervalId = null;
    }
  }
  
  public getAudioContext(): AudioContext | null {
    return this.audioContext;
  }
  
  public onBeat(callback: (time: number) => void): void {
    this.beatCallbacks.push(callback);
    console.log("Beat callback registered");
  }
  
  public offBeat(callback: (time: number) => void): void {
    const index = this.beatCallbacks.indexOf(callback);
    if (index !== -1) {
      this.beatCallbacks.splice(index, 1);
      console.log("Beat callback removed");
    }
  }
  
  public getCurrentTime(): number {
    return this.audioContext ? this.audioContext.currentTime : 0;
  }
  
  public getBeatInfo(): { bpm: number, interval: number } {
    return {
      bpm: this.bpm,
      interval: this.beatInterval
    };
  }
}

export default AudioManager;
