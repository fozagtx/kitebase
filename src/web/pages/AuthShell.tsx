import { useState, type FormEvent } from 'react';
import { useAuth } from '../auth';
import { KitebaseLogo } from '../components/KitebaseLogo';
import { Alert } from '../components/ui/alert';
import { Button } from '../components/ui/button';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { Field } from '../components/ui/field';

interface AuthShellProps {
  onBack?: () => void;
}

export function AuthShell({ onBack }: AuthShellProps = {}) {
  const { signup, login } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === 'signup') await signup(email, password);
      else await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-full flex-col items-center justify-center px-6">
      {onBack && (
        <Button
          variant="link"
          size="xs"
          className="mb-4 h-auto p-0 text-xs text-nautral-600 hover:text-navy"
          onClick={onBack}
        >
          ← back
        </Button>
      )}
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <div className="relative w-fit">
            <KitebaseLogo size={56} />
            <div className="absolute -inset-5 -z-10 rounded-full bg-kbblue-300/30 blur-2xl" />
          </div>
          <div
            className="mt-2 font-serif text-3xl text-navy"
            style={{ letterSpacing: '-0.025em' }}
          >
            kitebase
          </div>
          <CardDescription>
            {mode === 'signup' ? 'Create your workspace' : 'Welcome back'}
          </CardDescription>
        </CardHeader>
        <form onSubmit={submit} className="space-y-3">
          <Field
            label="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoFocus
          />
          <Field
            label="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="at least 8 characters"
          />
          {error && <Alert variant="destructive">{error}</Alert>}
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={busy || !email || password.length < 8}
          >
            {busy
              ? mode === 'signup'
                ? 'creating account…'
                : 'logging in…'
              : mode === 'signup'
                ? 'Try kitebase'
                : 'Log in'}
          </Button>
        </form>
        <div className="text-center text-xs text-nautral-600">
          {mode === 'signup' ? (
            <>
              already have an account?{' '}
              <Button
                variant="link"
                size="xs"
                type="button"
                onClick={() => setMode('login')}
                className="h-auto p-0 text-xs"
              >
                log in
              </Button>
            </>
          ) : (
            <>
              new here?{' '}
              <Button
                variant="link"
                size="xs"
                type="button"
                onClick={() => setMode('signup')}
                className="h-auto p-0 text-xs"
              >
                create an account
              </Button>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
