import { useState, type ReactNode } from 'react';
import { Check } from 'lucide-react';
import { api } from '../api';
import { HermesKiteMark } from './HermesKiteMark';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './ui/alertDialog';
import { Alert } from './ui/alert';
import { Button } from './ui/button';
import {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './ui/card';
import { Field } from './ui/field';
import type { Deployment } from '../types';

interface Props {
  onDeployed: (d: Deployment) => void;
  onCancel: () => void;
}

// Modal-shaped deploy form. Renders into a Dialog's content - no outer Card
// (the DialogContent provides the surface). The actor name + telegram fields
// gather input; clicking "Deploy actor" raises an AlertDialog for confirmation
// before the API call.
const DEFAULT_NAME = 'Aegis';

export function DeployView({ onDeployed, onCancel }: Props) {
  const [name, setName] = useState('');
  const [wantTelegram, setWantTelegram] = useState(false);
  const [telegram, setTelegram] = useState('');
  const [telegramAllowed, setTelegramAllowed] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const effectiveName = name.trim() || DEFAULT_NAME;

  async function deploy() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const d = await api.createDeployment({
        agentName: effectiveName,
        telegramBotToken: wantTelegram && telegram.trim() ? telegram.trim() : undefined,
        telegramAllowedUserId:
          wantTelegram && telegramAllowed.trim() ? telegramAllowed.trim() : undefined,
      });
      setConfirmOpen(false);
      onDeployed(d);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="p-8">
      <div className="relative w-fit">
        <HermesKiteMark height={48} />
        <div className="absolute -inset-4 -z-10 rounded-full bg-kbblue-300/30 blur-2xl" />
      </div>
      <CardHeader className="gap-1 px-0 pt-5">
        <CardTitle className="text-3xl">Spawn a new actor</CardTitle>
        <CardDescription>
          Pick a name. Everything else is wired for you.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 px-0 pt-2">
        <Field
          label="actor name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={DEFAULT_NAME}
          hint={
            name.trim()
              ? 'this is the name your actor goes by on-chain'
              : `leave blank to use the default name "${DEFAULT_NAME}"`
          }
          autoFocus
        />
        <TelegramToggle
          on={wantTelegram}
          onChange={(v) => {
            setWantTelegram(v);
            if (!v) {
              setTelegram('');
              setTelegramAllowed('');
            }
          }}
        />
        {wantTelegram && (
          <div className="space-y-3 rounded-2xl border border-kbblue-300/40 bg-kbblue-100/30 p-4">
            <Field
              label="bot token"
              value={telegram}
              onChange={(e) => setTelegram(e.target.value)}
              placeholder="123456789:ABCdefGHIjklMNOpqr…"
              hint="from @BotFather on Telegram"
            />
            <Field
              label="your telegram user id  (recommended)"
              value={telegramAllowed}
              onChange={(e) => setTelegramAllowed(e.target.value)}
              placeholder="e.g. 12345678"
              hint="lock the bot to just you. DM @userinfobot on Telegram to get your id. Blank = anyone who finds the bot can chat."
            />
          </div>
        )}

        {/* "What's included" card - hidden when Telegram fields are open
            so the modal doesn't grow to full page */}
        {!wantTelegram && (
          <div className="rounded-2xl border border-kbblue-300/40 bg-kbblue-100/40 p-3">
            <div className="text-[10.5px] font-semibold uppercase tracking-wider text-kbblue-700">
              included with every actor
            </div>
            <ul className="mt-2 space-y-1.5">
              <Perk>Free AI inference, no key required</Perk>
              <Perk>Its own on-chain wallet and identity</Perk>
              <Perk>Chat works immediately — even before setup finishes</Perk>
              <Perk>Add Telegram, Discord, Slack and more anytime</Perk>
            </ul>
          </div>
        )}

        {error && <Alert variant="destructive">{error}</Alert>}
      </CardContent>
      <CardFooter className="justify-between px-0 pt-2">
        <Button variant="ghost" size="sm" onClick={onCancel} disabled={busy}>
          cancel
        </Button>
        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogTrigger asChild>
            <Button size="lg">Deploy actor</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogMedia>
                <div className="relative">
                  <HermesKiteMark height={48} />
                  <div className="absolute -inset-3 -z-10 rounded-full bg-kbblue-300/30 blur-2xl" />
                </div>
              </AlertDialogMedia>
              <AlertDialogTitle>Ready to spawn "{effectiveName}"?</AlertDialogTitle>
              <div className="mt-1 space-y-3 text-sm text-nautral-700">
                <p>Your actor will come online in about three minutes. While you wait:</p>
                <ul className="space-y-1.5">
                  <Perk>It already has its own wallet and identity</Perk>
                  <Perk>AI inference is on — you can chat right away</Perk>
                  <Perk>No card needed, no monthly fee on your end</Perk>
                </ul>
              </div>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                disabled={busy}
                onClick={(e) => {
                  e.preventDefault();
                  void deploy();
                }}
              >
                {busy ? 'deploying…' : 'Deploy actor'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </div>
  );
}

function Perk({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-[12.5px] leading-relaxed text-navy">
      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
        <Check className="h-3 w-3" strokeWidth={3} />
      </span>
      <span>{children}</span>
    </li>
  );
}

function TelegramToggle({
  on,
  onChange,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className={`flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition ${
        on
          ? 'border-kbblue-300 bg-kbblue-100/50'
          : 'border-kbblue-300/40 bg-white/60 hover:border-kbblue-300/70 hover:bg-white'
      }`}
      aria-pressed={on}
    >
      <span className="flex items-center gap-3">
        <svg
          viewBox="0 0 24 24"
          className="h-7 w-7"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="12" fill="#229ED9" />
          <path
            d="M17.5 7.5 5.7 12.2c-.7.3-.7.7-.1.9l3 .9 7-4.4c.3-.2.6-.1.4.1l-5.7 5.1-.2 3.2c.3 0 .4-.1.6-.3l1.5-1.4 3.1 2.3c.6.3 1 .2 1.1-.5l2-9.7c.2-.8-.3-1.1-1-.8Z"
            fill="white"
          />
        </svg>
        <span>
          <span className="block text-[13.5px] font-semibold text-navy">
            Wire Telegram now
          </span>
          <span className="block text-[11.5px] text-nautral-600">
            optional — takes ~30 seconds. You can always add it later.
          </span>
        </span>
      </span>
      <span
        role="switch"
        aria-checked={on}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
          on ? 'bg-kbblue-500' : 'bg-nautral-300'
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
            on ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </span>
    </button>
  );
}
