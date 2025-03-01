
import { AudioLoader } from 'three';

type SoundType = 'beat' | 'perfect' | 'good' | 'miss' | 'music' | 'countdown' | 'start' | 'victory' | 'defeat' | 'scratch';

export class AudioManager {
  private context: AudioContext | null = null;
  private sounds: Map<SoundType, AudioBuffer> = new Map();
  private musicSource: AudioBufferSourceNode | null = null;
  private musicGainNode: GainNode | null = null;
  private bpm: number = 130;
  private beatCallbacks: ((time: number) => void)[] = [];
  private nextBeatTime: number = 0;
  private isPlaying: boolean = false;
  private timerId: number | null = null;
  
  constructor() {
    // Initialiser AudioContext med feilhåndtering
    try {
      this.context = new AudioContext();
    } catch (error) {
      console.error('Web Audio API ikke støttet:', error);
    }
    
    // Bind metoder
    this.scheduleBeat = this.scheduleBeat.bind(this);
    this.scheduler = this.scheduler.bind(this);
  }
  
  async loadSound(name: SoundType, url: string): Promise<void> {
    if (!this.context) return;
    
    try {
      const loader = new AudioLoader();
      const audioBuffer = await loader.loadAsync(url);
      
      // Konverter Three.js AudioBuffer til Web Audio API AudioBuffer
      const webAudioBuffer = this.context.createBuffer(
        audioBuffer.numberOfChannels,
        audioBuffer.length,
        audioBuffer.sampleRate
      );
      
      // Kopier data fra Three.js buffer til Web Audio buffer
      for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
        const channelData = webAudioBuffer.getChannelData(channel);
        channelData.set(audioBuffer.getChannelData(channel));
      }
      
      this.sounds.set(name, webAudioBuffer);
      console.log(`Lyden "${name}" lastet`);
    } catch (error) {
      console.error(`Kunne ikke laste lyden "${name}":`, error);
    }
  }
  
  async loadAllSounds(): Promise<void> {
    const soundsToLoad: Array<{ name: SoundType; url: string }> = [
      { name: 'music', url: '/audio/vi_e_trondera.mp3' },
      { name: 'perfect', url: '/audio/perfect.wav' },
      { name: 'good', url: '/audio/good.wav' },
      { name: 'miss', url: '/audio/miss.wav' },
      { name: 'countdown', url: '/audio/countdown.wav' },
      { name: 'start', url: '/audio/start.wav' },
      { name: 'victory', url: '/audio/victory.wav' },
      { name: 'defeat', url: '/audio/defeat.wav' },
      { name: 'scratch', url: '/audio/needle_scratch.wav' }
    ];
    
    // Vi bruker Promise.allSettled for å fortsette selv om noen lyder feiler
    const promises = soundsToLoad.map(sound => 
      this.loadSound(sound.name, sound.url)
    );
    
    await Promise.allSettled(promises);
    console.log('Lydassets ferdig lastet');
  }
  
  playSound(name: SoundType, volume: number = 1.0): void {
    if (!this.context) return;
    
    const buffer = this.sounds.get(name);
    if (!buffer) {
      console.warn(`Lyden "${name}" finnes ikke`);
      return;
    }
    
    // Opprett source node
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    
    // Opprett gain node for volum
    const gainNode = this.context.createGain();
    gainNode.gain.value = volume;
    
    // Koble til og spill
    source.connect(gainNode);
    gainNode.connect(this.context.destination);
    
    // Start avspilling
    source.start(0);
    
    // Automatisk opprydding når lyden er ferdig
    source.onended = () => {
      source.disconnect();
      gainNode.disconnect();
    };
  }
  
  playMusic(name: SoundType = 'music', volume: number = 0.7): void {
    if (!this.context) return;
    
    const buffer = this.sounds.get(name);
    if (!buffer) {
      console.warn(`Musikken "${name}" finnes ikke`);
      return;
    }
    
    // Stopp eksisterende musikk
    this.stopMusic();
    
    // Opprett source node for musikken
    this.musicSource = this.context.createBufferSource();
    this.musicSource.buffer = buffer;
    this.musicSource.loop = true;
    
    // Opprett gain node for volum
    this.musicGainNode = this.context.createGain();
    this.musicGainNode.gain.value = volume;
    
    // Koble til
    this.musicSource.connect(this.musicGainNode);
    this.musicGainNode.connect(this.context.destination);
    
    // Start beat scheduling
    this.isPlaying = true;
    this.nextBeatTime = this.context.currentTime;
    
    // Start avspilling
    this.musicSource.start(0);
    
    // Start beat-scheduler
    this.timerId = window.setInterval(this.scheduler, 25); // Sjekk hvert 25ms
    
    console.log('Musikk startet med beat-tracking');
  }
  
  // Beat scheduling - viktig for rytmepresisjon
  private scheduler(): void {
    if (!this.context) return;
    
    // Planlegg beats så lenge vi er innenfor 100ms fremover
    while (this.nextBeatTime < this.context.currentTime + 0.1) {
      this.scheduleBeat(this.nextBeatTime);
      
      // Gå til neste beat
      const secondsPerBeat = 60.0 / this.bpm;
      this.nextBeatTime += secondsPerBeat;
    }
  }
  
  // Planlegger en enkelt beat
  private scheduleBeat(time: number): void {
    // Kall callbacks for denne beaten
    this.beatCallbacks.forEach(callback => callback(time));
  }
  
  // Registrerer en callback som blir kalt for hver beat
  onBeat(callback: (time: number) => void): void {
    this.beatCallbacks.push(callback);
  }
  
  // Fjerner en beat callback
  offBeat(callback: (time: number) => void): void {
    this.beatCallbacks = this.beatCallbacks.filter(cb => cb !== callback);
  }
  
  stopMusic(fadeOutTime: number = 0): void {
    if (!this.context || !this.musicSource || !this.musicGainNode) return;
    
    // Hvis vi har fade-out tid
    if (fadeOutTime > 0) {
      const currentTime = this.context.currentTime;
      
      // Bevar nåværende volum
      const currentVolume = this.musicGainNode.gain.value;
      
      // Sett opp en gradvis fade
      this.musicGainNode.gain.setValueAtTime(currentVolume, currentTime);
      this.musicGainNode.gain.linearRampToValueAtTime(0, currentTime + fadeOutTime);
      
      // Stopp musikken etter fade
      setTimeout(() => {
        if (this.musicSource) {
          this.musicSource.stop();
          this.musicSource = null;
        }
      }, fadeOutTime * 1000);
    } else {
      // Stopp umiddelbart
      this.musicSource.stop();
      this.musicSource = null;
    }
    
    // Stopp beat scheduling
    this.isPlaying = false;
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }
  
  playGameOverEffects(): void {
    // Spill needle scratch effekt
    this.playSound('scratch');
    
    // Fade ut musikken
    this.stopMusic(0.5);
  }
  
  // Setter BPM (beats per minute)
  setBPM(bpm: number): void {
    this.bpm = bpm;
  }
  
  // Hjelpemetode for å spille riktig lydeffekt basert på treffkvalitet
  playHitSound(hitQuality: string): void {
    switch (hitQuality) {
      case 'perfect':
        this.playSound('perfect');
        break;
      case 'good':
        this.playSound('good');
        break;
      default:
        this.playSound('miss');
    }
  }
  
  // Spiller nedtelling og startlyd
  playCountdownSequence(): Promise<void> {
    return new Promise(resolve => {
      this.playSound('countdown');
      
      // Vent på at nedtelling er ferdig (ca 3 sekunder)
      setTimeout(() => {
        this.playSound('start');
        resolve();
      }, 3000);
    });
  }
  
  // Gir tilgang til AudioContext for andre komponenter
  getAudioContext(): AudioContext | null {
    return this.context;
  }
  
  // Gir nåværende tid i AudioContext (presist for rytmespill)
  getCurrentTime(): number {
    return this.context ? this.context.currentTime : 0;
  }
}

export default AudioManager;
