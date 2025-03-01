
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface StartScreenProps {
  onStart: () => void;
}

const StartScreen = ({ onStart }: StartScreenProps) => {
  return (
    <div className="absolute inset-0 flex items-center justify-center z-10">
      <Card className="w-[350px] bg-black/80 text-white border-gray-700">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Superponni</CardTitle>
          <CardDescription className="text-center text-gray-400">Kom å Spælla Basse</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p>Trykk på mellomromstasten i takt med beatet</p>
          <p>Perfekt timing gir mest poeng!</p>
          <p>3 bom og spillet er over</p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button 
            onClick={onStart} 
            className="px-8 py-2 bg-green-600 hover:bg-green-700 text-white"
          >
            Start Spillet
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default StartScreen;
