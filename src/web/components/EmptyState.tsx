import { HermesKiteMark } from './HermesKiteMark';
import { Button } from './ui/button';

interface Props {
  onDeploy: () => void;
}

export function EmptyState({ onDeploy }: Props) {
  return (
    <div className="flex h-full items-center justify-center px-6 py-12">
      <div className="max-w-md text-center">
        <div className="relative mx-auto mb-7 w-fit">
          <HermesKiteMark height={64} />
          <div className="absolute -inset-6 -z-10 rounded-full bg-kbblue-300/30 blur-3xl" />
        </div>
        <h2 className="font-serif text-4xl text-navy" style={{ letterSpacing: '-0.025em' }}>
          Deploy your first actor on Kite
        </h2>
        <Button size="lg" className="mt-7" onClick={onDeploy}>
          Deploy your first actor
        </Button>
      </div>
    </div>
  );
}
