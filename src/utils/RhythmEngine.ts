
export type BeatScore = 'perfect' | 'good' | 'miss';

export interface Beat {
  time: number;
  hit: boolean;
  score: BeatScore | '';
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
  }
  
  // Check player input
  checkPlayerInput(currentTime: number): { hit: boolean, score: BeatScore, beatIndex: number } {
    // Find closest beat
    let closestBeatIndex = -1;
    let closestBeatDiff = Number.MAX_VALUE;
    
    for (let i = 0; i < this.beats.length; i++) {
      const beat = this.beats[i];
      
      // Skip beats that are already hit
      if (beat.hit) continue;
      
      // Only check beats within a reasonable time window
      // (e.g., 500ms before and after)
      const timeDiff = Math.abs(currentTime - beat.time);
      if (timeDiff < 500 && timeDiff < closestBeatDiff) {
        closestBeatDiff = timeDiff;
        closestBeatIndex = i;
      }
    }
    
    // If no beat found within the time window
    if (closestBeatIndex === -1) {
      return { hit: false, score: 'miss', beatIndex: -1 };
    }
    
    // Calculate score based on timing
    let score: BeatScore = 'miss';
    if (closestBeatDiff < 50) {
      score = 'perfect';
    } else if (closestBeatDiff < 150) {
      score = 'good';
    } else if (closestBeatDiff < 300) {
      score = 'good'; // Changed from 'ok' to match our score types
    } else {
      score = 'miss';
    }
    
    // Mark the beat as hit if it's not a miss
    if (score !== 'miss') {
      this.beats[closestBeatIndex].hit = true;
      this.beats[closestBeatIndex].score = score;
    }
    
    return { hit: score !== 'miss', score, beatIndex: closestBeatIndex };
  }
  
  // Get beats for rendering
  getVisibleBeats(currentTime: number, visibilityWindow: number = 2000): Beat[] {
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
