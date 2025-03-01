
export class AudioManager {
  private static instance: AudioManager;
  private audioContext: AudioContext | null = null;
  private sounds: Map<string, AudioBuffer> = new Map();
  private music: HTMLAudioElement | null = null;
  
  // Changed from private to protected to allow extension if needed
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
  
  // Load all game sounds at once
  public async loadAllSounds(): Promise<void> {
    try {
      const soundFiles = [
        { name: 'perfect', url: '/audio/perfect.wav' },
        { name: 'good', url: '/audio/good.wav' },
        { name: 'ok', url: '/audio/beat.mp3' },
        { name: 'miss', url: '/audio/miss.wav' },
        { name: 'music', url: '/audio/vi_e_trondera.mp3' }
      ];
      
      const promises = soundFiles.map(({ name, url }) => 
        this.loadSound(name, url).catch(err => {
          console.warn(`Failed to load sound ${name}:`, err);
          // Continue despite error
        })
      );
      
      await Promise.allSettled(promises);
      console.log('All sounds loaded or attempted');
    } catch (error) {
      console.error('Error loading sounds:', error);
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
  
  // Play game over effects
  public playGameOverEffects(): void {
    try {
      this.playSound('miss', 1.0);
      
      // Fade out music if playing
      if (this.music) {
        const fadeOut = () => {
          if (!this.music) return;
          
          if (this.music.volume > 0.05) {
            this.music.volume -= 0.05;
            setTimeout(fadeOut, 100);
          } else {
            this.stopMusic();
          }
        };
        
        fadeOut();
      }
    } catch (error) {
      console.error('Error playing game over effects:', error);
    }
  }
  
  // Register beat callback
  public onBeat(callback: (time: number) => void): void {
    // Implementation depends on how you want to trigger beats
    // This is a placeholder that could be implemented with audio analysis or time-based triggers
    console.log('Beat callback registered but not implemented');
  }
  
  // Play background music with looping
  public playMusic(name: string, volume: number = 0.7): void {
    try {
      // Get the URL for the music
      const sound = this.sounds.get(name);
      if (!sound) {
        console.warn(`Music '${name}' not found`);
        return;
      }
      
      // Stop current music if playing
      if (this.music) {
        this.music.pause();
        this.music = null;
      }
      
      // Create new audio element with blob URL
      const blob = new Blob([this.audioBufferToWav(sound)], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);
      
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
  
  // Convert AudioBuffer to WAV format for creating audio element
  // This is a simplified version, might not work for all cases
  private audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
    const numOfChannels = buffer.numberOfChannels;
    const length = buffer.length * numOfChannels * 2;
    const rate = buffer.sampleRate;
    
    const dataView = new DataView(new ArrayBuffer(44 + length));
    
    // Write WAV header
    writeString(dataView, 0, 'RIFF');
    dataView.setUint32(4, 36 + length, true);
    writeString(dataView, 8, 'WAVE');
    writeString(dataView, 12, 'fmt ');
    dataView.setUint32(16, 16, true);
    dataView.setUint16(20, 1, true);
    dataView.setUint16(22, numOfChannels, true);
    dataView.setUint32(24, rate, true);
    dataView.setUint32(28, rate * numOfChannels * 2, true);
    dataView.setUint16(32, numOfChannels * 2, true);
    dataView.setUint16(34, 16, true);
    writeString(dataView, 36, 'data');
    dataView.setUint32(40, length, true);
    
    // Write audio data
    const channelData = [];
    for (let i = 0; i < numOfChannels; i++) {
      channelData.push(buffer.getChannelData(i));
    }
    
    let offset = 44;
    for (let i = 0; i < buffer.length; i++) {
      for (let c = 0; c < numOfChannels; c++) {
        const sample = Math.max(-1, Math.min(1, channelData[c][i]));
        const value = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        dataView.setInt16(offset, value, true);
        offset += 2;
      }
    }
    
    function writeString(dataView: DataView, offset: number, string: string) {
      for (let i = 0; i < string.length; i++) {
        dataView.setUint8(offset + i, string.charCodeAt(i));
      }
    }
    
    return dataView.buffer;
  }
}

export default AudioManager;
