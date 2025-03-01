
import GameLogic from './GameLogic';

interface GameProps {
  onGameOver: (score: number, perfectHits?: number, maxCombo?: number) => void;
}

const Game = ({ onGameOver }: GameProps) => {
  return <GameLogic onGameOver={onGameOver} />;
};

export default Game;
