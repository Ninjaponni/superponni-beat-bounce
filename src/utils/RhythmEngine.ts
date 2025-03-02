export type BeatScore = 'perfect' | 'good' | 'ok' | 'miss';

export interface Beat {
  time: number;
  hit: boolean;
  score: BeatScore | '';
  timing?: 'early' | 'perfect' | 'late';
}

export class RhythmEngine {
  private bpm: number;
  private beatInterval: number; // ms between each beat
  private nextBeatTime: number = 0;
  private beats: Beat[] = [];
  private startTime: number = 0;
  private audioStartDelay: number = 3000; // 3 seconds countdown before first beat
  
  constructor(bpm: number = 130) {
    this.bpm = bpm;
    this.beatInterval = 60000 / bpm; // ms between each beat
  }
  
  start(startTime: number) {
    this.startTime = startTime;
    this.nextBeatTime = startTime + this.audioStartDelay; // Add delay for countdown
    
    // Generate beats based on the song
    this.generateBeats();
    
    console.log(`RhythmEngine started at ${startTime}ms with BPM ${this.bpm}`);
  }
  
  // Generate beats based on the song
  private generateBeats() {
    this.beats = [];
    
    // For now, we'll create simple evenly-spaced beats
    // In a real implementation, these would be mapped to the actual song structure
    const beatCount = 100; // number of beats in the song
    
    // Create the first beat with a longer visibility for player to understand
    this.beats.push({
      time: this.nextBeatTime,
      hit: false,
      score: ''
    });
    
    // Generate remaining beats
    for (let i = 1; i < beatCount; i++) {
      this.beats.push({
        time: this.nextBeatTime + (i * this.beatInterval),
        hit: false,
        score: ''
      });
    }
    
    console.log(`Generated ${this.beats.length} beats starting at ${this.nextBeatTime}ms`);
  }
  
  // Synchronize with audio system
  synchronize(audioStartTime: number, beatIntervalMs: number) {
    this.startTime = audioStartTime;
    this.beatInterval = beatIntervalMs;
    this.bpm = 60000 / beatIntervalMs;
    
    // Regenerate beats with new timing
    this.nextBeatTime = audioStartTime;
    this.generateBeats();
    
    console.log(`RhythmEngine synchronized to audio at ${audioStartTime}ms with interval ${beatIntervalMs.toFixed(2)}ms (${this.bpm.toFixed(1)} BPM)`);
  }
  
  // Check player input with enhanced timing feedback
  checkPlayerInput(currentTime: number): { hit: boolean, score: BeatScore, beatIndex: number, timing?: 'early' | 'perfect' | 'late' } {
    // Find closest beat
    let closestBeatIndex = -1;
    let closestBeatDiff = Number.MAX_VALUE;
    
    for (let i = 0; i < this.beats.length; i++) {
      const beat = this.beats[i];
      
      // Skip beats that are already hit
      if (beat.hit) continue;
      
      // Only check beats within a reasonable time window
      // (e.g., 500ms before and after)
      const timeDiff = currentTime - beat.time;
      const absDiff = Math.abs(timeDiff);
      if (absDiff < 500 && absDiff < closestBeatDiff) {
        closestBeatDiff = absDiff;
        closestBeatIndex = i;
      }
    }
    
    // If no beat found within the time window
    if (closestBeatIndex === -1) {
      return { hit: false, score: 'miss', beatIndex: -1 };
    }
    
    // Calculate score based on timing
    let score: BeatScore = 'miss';
    let timing: 'early' | 'perfect' | 'late' | undefined;
    
    const timeDiff = currentTime - this.beats[closestBeatIndex].time;
    
    if (Math.abs(timeDiff) < 50) {
      score = 'perfect';
      timing = 'perfect';
    } else if (Math.abs(timeDiff) < 150) {
      score = 'good';
      timing = timeDiff < 0 ? 'early' : 'late';
    } else if (Math.abs(timeDiff) < 300) {
      score = 'ok';
      timing = timeDiff < 0 ? 'early' : 'late';
    } else {
      score = 'miss';
    }
    
    // Mark the beat as hit if it's not a miss
    if (score !== 'miss') {
      this.beats[closestBeatIndex].hit = true;
      this.beats[closestBeatIndex].score = score;
      this.beats[closestBeatIndex].timing = timing;
    }
    
    console.log(`Beat check: diff=${Math.abs(timeDiff).toFixed(2)}ms, score=${score}, timing=${timing}, index=${closestBeatIndex}`);
    return { hit: score !== 'miss', score, beatIndex: closestBeatIndex, timing };
  }
  
  // Get beats for rendering
  getVisibleBeats(currentTime: number, visibilityWindow: number = 2000): Beat[] {
    return this.beats.filter(beat => {
      const timeDiff = beat.time - currentTime;
      return timeDiff > -1000 && timeDiff < visibilityWindow;
    });
  }
  
  // Get current BPM
  getBPM(): number {
    return this.bpm;
  }
  
  // Reset engine
  reset() {
    this.beats = [];
    this.nextBeatTime = 0;
  }
}

export default RhythmEngine;
