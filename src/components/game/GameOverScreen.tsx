
import React from 'react';

interface GameOverScreenProps {
  score: number;
  onRestart: () => void;
  perfectHits?: number;
  maxCombo?: number;
}

const GameOverScreen: React.FC<GameOverScreenProps> = ({ 
  score, 
  onRestart, 
  perfectHits = 0, 
  maxCombo = 0 
}) => {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-80 text-white">
      <h1 className="text-4xl font-bold mb-8">Game Over</h1>
      
      <div className="bg-slate-800 p-8 rounded-lg shadow-lg mb-8 w-full max-w-md">
        <h2 className="text-2xl font-semibold mb-6 text-center">Din score</h2>
        
        <div className="space-y-4">
          <div className="flex justify-between border-b border-slate-600 pb-2">
            <span className="text-slate-300">Poeng:</span>
            <span className="text-xl font-bold">{score}</span>
          </div>
          
          <div className="flex justify-between border-b border-slate-600 pb-2">
            <span className="text-slate-300">Perfekte treff:</span>
            <span className="text-green-400">{perfectHits}</span>
          </div>
          
          <div className="flex justify-between pb-2">
            <span className="text-slate-300">Lengste combo:</span>
            <span className="text-yellow-400">{maxCombo}x</span>
          </div>
        </div>
      </div>
      
      <button
        onClick={onRestart}
        className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-full transition duration-200 text-lg"
      >
        Spill igjen
      </button>
      
      <p className="mt-4 text-sm text-gray-400">Trykk 'R' for å spille på nytt</p>
    </div>
  );
};

export default GameOverScreen;
