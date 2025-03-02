
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
  
  // Initialize sound library with default paths
  private initSoundLibrary() {
    // Game sounds
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
  
  // Singleton pattern
  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }
  
  // Get sound URL from library (with fallback)
  private getSoundUrl(name: string): string {
    if (this.soundUrls.has(name)) {
      return this.soundUrls.get(name)!;
    } else {
      console.warn(`Sound '${name}' not found in library, using fallback`);
      return `/audio/${name}.mp3`; // Generic fallback pattern
    }
  }
  
  // Load all sounds needed for the game
  public async loadAllSounds(): Promise<void> {
    try {
      const loadPromises: Promise<void>[] = [];
      
      // Load all sounds from the library
      this.soundUrls.forEach((url, name) => {
        loadPromises.push(this.loadSound(name, url));
      });
      
      // Wait for all sounds to load (or fail)
      await Promise.allSettled(loadPromises);
      console.log("All sounds loaded successfully");
    } catch (error) {
      console.error("Failed to load all sounds:", error);
    }
  }
  
  // Load a single sound
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
      
      // If this is a critical sound, try to create a fallback buffer
      if (name === 'music' || name === 'perfect' || name === 'miss') {
        this.createFallbackSound(name);
      }
    }
  }
  
  // Create a fallback sound when loading fails
  private createFallbackSound(name: string): void {
    if (!this.audioContext) return;
    
    try {
      // Create a simple synthetic sound as fallback
      const sampleRate = this.audioContext.sampleRate;
      const buffer = this.audioContext.createBuffer(1, sampleRate * 0.5, sampleRate);
      const channelData = buffer.getChannelData(0);
      
      // Different waveforms based on sound type
      if (name === 'perfect') {
        // High beep for perfect
        for (let i = 0; i < channelData.length; i++) {
          channelData[i] = Math.sin(i * 0.02) * Math.exp(-i * 0.001);
        }
      } else if (name === 'miss') {
        // Low buzz for miss
        for (let i = 0; i < channelData.length; i++) {
          channelData[i] = Math.sin(i * 0.01) * Math.exp(-i * 0.001);
        }
      } else {
        // Default white noise
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
  
  // Play a sound effect
  public playSound(name: string, volume: number = 1.0): void {
    if (!this.audioContext) return;
    
    const sound = this.sounds.get(name);
    if (!sound) {
      console.warn(`Sound '${name}' not found`);
      return;
    }
    
    try {
      // Create source node
      const source = this.audioContext.createBufferSource();
      source.buffer = sound;
      
      // Create gain node for volume
      const gainNode = this.audioContext.createGain();
      gainNode.gain.value = volume;
      
      // Connect nodes
      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      // Play sound
      source.start(0);
    } catch (error) {
      console.error(`Failed to play sound '${name}':`, error);
    }
  }
  
  // Play a hit sound based on quality (for useGameBeatHandler.ts)
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
  
  // Play music with BPM synchronization
  public playMusic(name: string, bpm: number = 130, volume: number = 0.7): void {
    try {
      // Stop current music if playing
      this.stopMusic();
      
      // Update BPM and beat interval
      this.bpm = bpm;
      this.beatInterval = 60000 / bpm;
      
      // Create new audio element
      const audio = new Audio();
      
      // Set source from sound library
      audio.src = this.getSoundUrl(name);
      audio.loop = true;
      audio.volume = volume;
      
      // Synchronize with global rhythm engine when playback starts
      const startMusic = async () => {
        const startTime = performance.now();
        console.log(`Music '${name}' started at ${startTime}ms with BPM ${bpm}`);
        
        // Setup beat detection and callbacks
        this.setupBeatCallbacks(startTime);
        
        // Update global rhythm engine if available
        if (window.rhythmEngine) {
          window.rhythmEngine.synchronize(startTime, this.beatInterval);
        }
      };
      
      // Add event listener for when playback actually starts
      audio.addEventListener('playing', startMusic, { once: true });
      
      // Start playing
      audio.play().catch(error => {
        console.error(`Failed to play music '${name}':`, error);
        // Try fallback if available
        if (this.sounds.has(name)) {
          this.playFallbackMusic(name, volume);
        }
      });
      
      this.music = audio;
    } catch (error) {
      console.error(`Failed to play music '${name}':`, error);
      // Try fallback if available
      if (this.sounds.has(name)) {
        this.playFallbackMusic(name, volume);
      }
    }
  }
  
  // Play fallback music through AudioContext when HTML Audio fails
  private playFallbackMusic(name: string, volume: number = 0.7): void {
    if (!this.audioContext) return;
    
    const sound = this.sounds.get(name);
    if (!sound) {
      console.error(`No fallback available for music '${name}'`);
      return;
    }
    
    try {
      // Create source node
      const source = this.audioContext.createBufferSource();
      source.buffer = sound;
      source.loop = true;
      
      // Create gain node for volume
      const gainNode = this.audioContext.createGain();
      gainNode.gain.value = volume;
      
      // Connect nodes
      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      // Play sound
      source.start(0);
      
      // Store reference for stopping later
      this.music = new Audio(); // Dummy audio element to maintain interface
      this.music.volume = volume;
      
      // Store source node for stopping
      (this.music as any)._sourceNode = source;
      (this.music as any)._gainNode = gainNode;
      
      console.log(`Fallback music '${name}' started playing`);
      
      // Setup beat callbacks
      const startTime = performance.now();
      this.setupBeatCallbacks(startTime);
      
      // Update global rhythm engine if available
      if (window.rhythmEngine) {
        window.rhythmEngine.synchronize(startTime, this.beatInterval);
      }
    } catch (error) {
      console.error(`Failed to play fallback music '${name}':`, error);
    }
  }
  
  // Setup beat callbacks based on BPM
  private setupBeatCallbacks(startTime: number): void {
    // Clear any existing beat interval
    if (this.beatIntervalId !== null) {
      window.clearInterval(this.beatIntervalId);
      this.beatIntervalId = null;
    }
    
    // Calculate time to first beat
    const currentTime = performance.now();
    const timeSinceStart = currentTime - startTime;
    const beatPhase = timeSinceStart % this.beatInterval;
    const timeToFirstBeat = this.beatInterval - beatPhase;
    
    // Schedule first beat
    setTimeout(() => {
      // Trigger first beat
      this.triggerBeatCallbacks(performance.now());
      
      // Setup regular interval for subsequent beats
      this.beatIntervalId = window.setInterval(() => {
        this.triggerBeatCallbacks(performance.now());
      }, this.beatInterval);
    }, timeToFirstBeat);
    
    console.log(`Beat callbacks scheduled with interval ${this.beatInterval.toFixed(2)}ms (${this.bpm} BPM)`);
  }
  
  // Trigger all registered beat callbacks
  private triggerBeatCallbacks(time: number): void {
    this.beatCallbacks.forEach(callback => callback(time));
  }
  
  // Play game over sound effects (used in GameLogic)
  public playGameOverEffects(): void {
    // Play needle scratch effect if available
    this.playSound('needle_scratch', 1.0);
    
    // Stop music with a fade out effect
    if (this.music) {
      // Gradual volume reduction
      const fadeOutStep = 0.05;
      const fadeInterval = 100;
      const fadeOutMusic = () => {
        if (this.music && this.music.volume > fadeOutStep) {
          this.music.volume -= fadeOutStep;
          setTimeout(fadeOutMusic, fadeInterval);
        } else if (this.music) {
          this.music.pause();
          this.music = null;
          
          // Clear beat interval
          if (this.beatIntervalId !== null) {
            window.clearInterval(this.beatIntervalId);
            this.beatIntervalId = null;
          }
        }
      };
      fadeOutMusic();
    }
    
    // Play a specific game over sound
    this.playSound('defeat', 1.0);
  }
  
  // Stop the music
  public stopMusic(): void {
    if (this.music) {
      // Check if we're using fallback AudioContext source
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
    
    // Clear beat interval
    if (this.beatIntervalId !== null) {
      window.clearInterval(this.beatIntervalId);
      this.beatIntervalId = null;
    }
  }
  
  // Get the audio context
  public getAudioContext(): AudioContext | null {
    return this.audioContext;
  }
  
  // Register beat callback function
  public onBeat(callback: (time: number) => void): void {
    this.beatCallbacks.push(callback);
    console.log("Beat callback registered");
  }
  
  // Remove beat callback
  public offBeat(callback: (time: number) => void): void {
    const index = this.beatCallbacks.indexOf(callback);
    if (index !== -1) {
      this.beatCallbacks.splice(index, 1);
      console.log("Beat callback removed");
    }
  }
  
  // Get the current playback time
  public getCurrentTime(): number {
    return this.audioContext ? this.audioContext.currentTime : 0;
  }
  
  // Get beat information
  public getBeatInfo(): { bpm: number, interval: number } {
    return {
      bpm: this.bpm,
      interval: this.beatInterval
    };
  }
}

export default AudioManager;
