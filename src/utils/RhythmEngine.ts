
export type BeatScore = 'perfect' | 'good' | 'miss';

export interface Beat {
  time: number;
  hit: boolean;
  score: BeatScore | '';
}

export class RhythmEngine {
  private bpm: number;
  private beatInterval: number; // ms mellom hver beat
  private nextBeatTime: number = 0;
  private beats: Beat[] = [];
  private startTime: number = 0;
  
  constructor(bpm: number = 130) {
    this.bpm = bpm;
    this.beatInterval = 60000 / bpm; // ms mellom hver beat
  }
  
  start(startTime: number) {
    this.startTime = startTime;
    this.nextBeatTime = startTime;
    
    // Generer beats basert på sangen
    this.generateBeats();
  }
  
  // Generer beats basert på sangen
  private generateBeats() {
    this.beats = [];
    
    // Her ville du legge inn spesifikke beats basert på låten
    // For eksempel:
    const beatCount = 100; // antall beats i låten
    
    for (let i = 0; i < beatCount; i++) {
      this.beats.push({
        time: this.nextBeatTime + (i * this.beatInterval),
        hit: false,
        score: ''
      });
    }
  }
  
  // Sjekk et trykk fra spilleren
  checkPlayerInput(currentTime: number): { hit: boolean, score: BeatScore, beatIndex: number } {
    // Finn nærmeste beat
    let closestBeatIndex = -1;
    let closestBeatDiff = Number.MAX_VALUE;
    
    for (let i = 0; i < this.beats.length; i++) {
      const beat = this.beats[i];
      
      // Hopp over beats som allerede er truffet
      if (beat.hit) continue;
      
      // Sjekk kun beats som er innenfor et rimelig tidsvindu
      // (f.eks. 500ms før og etter)
      const timeDiff = Math.abs(currentTime - beat.time);
      if (timeDiff < 500 && timeDiff < closestBeatDiff) {
        closestBeatDiff = timeDiff;
        closestBeatIndex = i;
      }
    }
    
    // Hvis ingen beat funnet innenfor tidsvinduet
    if (closestBeatIndex === -1) {
      return { hit: false, score: 'miss', beatIndex: -1 };
    }
    
    // Kalkuler score basert på timing
    let score: BeatScore = 'miss';
    if (closestBeatDiff < 50) {
      score = 'perfect';
    } else if (closestBeatDiff < 150) {
      score = 'good';
    } else if (closestBeatDiff < 300) {
      score = 'good';
    } else {
      score = 'miss';
    }
    
    // Merk beatet som truffet hvis det ikke er miss
    if (score !== 'miss') {
      this.beats[closestBeatIndex].hit = true;
      this.beats[closestBeatIndex].score = score;
    }
    
    return { hit: score !== 'miss', score, beatIndex: closestBeatIndex };
  }
  
  // Hent beats for rendering
  getVisibleBeats(currentTime: number, visibilityWindow: number = 2000) {
    return this.beats.filter(beat => {
      const timeDiff = beat.time - currentTime;
      return timeDiff > -1000 && timeDiff < visibilityWindow;
    });
  }
  
  // Reset engine
  reset() {
    this.beats = [];
    this.nextBeatTime = 0;
  }
}

export default RhythmEngine;
