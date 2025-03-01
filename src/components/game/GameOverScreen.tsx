
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';

interface GameOverScreenProps {
  score: number;
  onRestart: () => void;
}

const GameOverScreen = ({ score, onRestart }: GameOverScreenProps) => {
  const [playerName, setPlayerName] = useState('');

  const handleSubmitScore = () => {
    // TODO: Her vil vi senere implementere innsending av score til Supabase
    console.log(`Submitting score: ${score} for player: ${playerName}`);
    onRestart();
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center z-10">
      <Card className="w-[350px] bg-black/80 text-white border-gray-700">
        <CardHeader>
          <CardTitle className="text-2xl text-center text-red-500">Game Over</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-xl">Din poengsum: {score}</p>
          
          <div className="space-y-2">
            <Label htmlFor="name">Ditt navn</Label>
            <Input 
              id="name" 
              placeholder="Skriv navnet ditt" 
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="bg-gray-800 border-gray-700"
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            onClick={onRestart}
            variant="outline"
            className="text-white border-gray-700 hover:bg-gray-700"
          >
            Avbryt
          </Button>
          <Button 
            onClick={handleSubmitScore}
            disabled={!playerName.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Lagre Poeng
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default GameOverScreen;
