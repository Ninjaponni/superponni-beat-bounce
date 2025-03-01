
interface ScoreDisplayProps {
  score: number;
  combo: number;
  missCount: number;
}

const ScoreDisplay = ({ score, combo, missCount }: ScoreDisplayProps) => {
  return (
    <div className="absolute top-4 left-0 right-0 flex justify-between px-4">
      <div className="bg-black/50 rounded p-2 text-white">
        <div className="text-2xl font-bold">{Math.floor(score)}</div>
        <div className="text-sm opacity-80">Poeng</div>
      </div>
      
      {combo > 1 && (
        <div className="bg-yellow-500/80 rounded p-2 text-white">
          <div className="text-xl font-bold">{combo}x</div>
          <div className="text-sm opacity-80">Combo</div>
        </div>
      )}
      
      <div className="bg-red-500/80 rounded p-2 text-white">
        <div className="flex space-x-1">
          {[...Array(3)].map((_, i) => (
            <div 
              key={i} 
              className={`w-4 h-4 rounded-full ${i < missCount ? 'bg-red-600' : 'bg-white/30'}`}
            />
          ))}
        </div>
        <div className="text-sm opacity-80">Bom</div>
      </div>
    </div>
  );
};

export default ScoreDisplay;
