
export class AudioManager {
  private static instance: AudioManager;
  private audioContext: AudioContext | null = null;
  private sounds: Map<string, AudioBuffer> = new Map();
  private music: HTMLAudioElement | null = null;
  
  protected constructor() {
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
  
  // Load all sounds needed for the game
  public async loadAllSounds(): Promise<void> {
    try {
      // You can add actual sound files when they're available
      await this.loadSound('perfect', '/audio/vi_e_trondera.mp3');
      await this.loadSound('good', '/audio/vi_e_trondera.mp3');
      await this.loadSound('ok', '/audio/vi_e_trondera.mp3');
      await this.loadSound('miss', '/audio/vi_e_trondera.mp3');
      await this.loadSound('music', '/audio/vi_e_trondera.mp3');
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
  
  // Play music (with loop)
  public playMusic(name: string, volume: number = 0.7): void {
    try {
      // Get the preloaded audio buffer
      const audioBuffer = this.sounds.get(name);
      if (!audioBuffer || !this.audioContext) {
        console.warn(`Music '${name}' not found or audio context not available`);
        return;
      }
      
      // Stop current music if playing
      if (this.music) {
        this.music.pause();
        this.music = null;
      }
      
      // Create new audio element for simplicity
      const audio = new Audio();
      // Set source - this is a fallback in case we can't play through AudioContext
      audio.src = `/audio/vi_e_trondera.mp3`;
      audio.loop = true;
      audio.volume = volume;
      audio.play();
      
      this.music = audio;
      console.log(`Music '${name}' started playing`);
    } catch (error) {
      console.error(`Failed to play music '${name}':`, error);
    }
  }
  
  // Stop the music
  public stopMusic(): void {
    if (this.music) {
      this.music.pause();
      this.music = null;
    }
  }
  
  // Get the current playback time
  public getCurrentTime(): number {
    return this.audioContext ? this.audioContext.currentTime : 0;
  }
}

export default AudioManager;
