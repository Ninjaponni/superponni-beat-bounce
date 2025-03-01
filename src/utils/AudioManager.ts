
export class AudioManager {
  private static instance: AudioManager;
  private audioContext: AudioContext | null = null;
  private sounds: Map<string, AudioBuffer> = new Map();
  private music: HTMLAudioElement | null = null;
  
  private constructor() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      console.log("AudioContext created successfully");
    } catch (error) {
      console.error("Failed to create AudioContext:", error);
    }
  }
  
  // Singleton pattern
  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }
  
  // Get audio context
  public getAudioContext(): AudioContext | null {
    return this.audioContext;
  }
  
  // Get current playback time
  public getCurrentTime(): number {
    return this.audioContext ? this.audioContext.currentTime : 0;
  }
  
  // Load a sound file
  public async loadSound(name: string, url: string): Promise<void> {
    if (!this.audioContext) return;
    
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      this.sounds.set(name, audioBuffer);
      console.log(`Sound '${name}' loaded successfully`);
    } catch (error) {
      console.error(`Failed to load sound '${name}':`, error);
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
  
  // Play hit sound based on quality
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
      case 'miss':
        this.playSound('miss', 0.5);
        break;
    }
  }
  
  // Play background music with looping
  public playMusic(url: string, volume: number = 0.7): void {
    try {
      // Stop current music if playing
      if (this.music) {
        this.music.pause();
        this.music = null;
      }
      
      // Create new audio element
      const audio = new Audio(url);
      audio.loop = true;
      audio.volume = volume;
      
      // Try to play (might require user interaction first)
      const playPromise = audio.play();
      if (playPromise) {
        playPromise.catch(error => {
          console.warn("Music autoplay prevented, requires user interaction:", error);
        });
      }
      
      this.music = audio;
      console.log("Music started playing");
    } catch (error) {
      console.error("Failed to play music:", error);
    }
  }
  
  // Stop music
  public stopMusic(): void {
    if (this.music) {
      this.music.pause();
      this.music = null;
    }
  }
}

export default AudioManager;
