// Telegram channel settings for an actor. Saves the BotFather token AND the
// optional allowed-users list to the control plane. The VPS's kitebase-sync
// timer notices the configVersion bump within ~60 seconds and reloads
// hermes with the new env. When PUBLIC_BASE_URL is unset on the control
// plane, hot-reload is disabled and the UI falls back to "redeploy required".

import { useEffect, useState } from 'react';
import { api } from '../api';
import type { Deployment } from '../types';
import { Alert } from './ui/alert';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Field } from './ui/field';

interface Props {
  deployment: Deployment;
  onUpdated: () => void;
}

export function TelegramSettings({ deployment: d, onUpdated }: Props) {
  const [token, setToken] = useState('');
  const [allowed, setAllowed] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [liveReload, setLiveReload] = useState<boolean | null>(null);

  useEffect(() => {
    api
      .health()
      .then((h) => setLiveReload(h.liveReloadEnabled))
      .catch(() => setLiveReload(false));
  }, []);

  async function save() {
    if (busy) return;
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const r = await api.setTelegramConfig(
        d.id,
        token.trim() || null,
        allowed.trim() || null,
      );
      setLiveReload(r.liveReloadEnabled);
      setSuccess(
        r.telegramBotUsername
          ? r.liveReloadEnabled
            ? `Saved (@${r.telegramBotUsername}). The live actor will pick this up within ~60 seconds.`
            : `Saved (@${r.telegramBotUsername}). Hot-reload is off (control plane has no public URL). Destroy + redeploy to push to the VPS.`
          : 'Token cleared.'
      );
      setToken('');
      setAllowed('');
      onUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function clear() {
    if (busy) return;
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      await api.setTelegramConfig(d.id, null, null);
      setSuccess('Token cleared.');
      setToken('');
      setAllowed('');
      onUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card size="sm" className="gap-3 p-5">
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wider text-nautral-500">
          telegram
        </div>
        <div className="mt-0.5 text-sm text-navy">
          {d.channels.telegramBotUsername ? (
            <>
              currently wired:{' '}
              <span className="font-mono text-kbblue-700">
                @{d.channels.telegramBotUsername}
              </span>
            </>
          ) : (
            <span className="text-nautral-600">no telegram bot wired yet.</span>
          )}
        </div>
      </div>
      <Field
        label="bot token"
        value={token}
        onChange={(e) => setToken(e.target.value)}
        placeholder="123456789:ABCdefGHIjklMNOpqrSTUvwxYZ"
        hint="from @BotFather on Telegram."
        autoComplete="off"
      />
      <Field
        label="your telegram user id (recommended)"
        value={allowed}
        onChange={(e) => setAllowed(e.target.value)}
        placeholder="e.g. 12345678"
        hint="lock the bot to just you. DM @userinfobot on Telegram to get your id. Leave blank and anyone who finds the bot can chat with it."
        autoComplete="off"
      />
      {error && <Alert variant="destructive">{error}</Alert>}
      {success && <Alert>{success}</Alert>}
      <div className="flex items-center gap-2">
        <Button
          onClick={save}
          disabled={busy || !token.trim()}
          size="sm"
        >
          {busy ? 'saving…' : 'save'}
        </Button>
        {d.channels.telegramBotUsername && (
          <Button variant="outline" onClick={clear} disabled={busy} size="sm">
            clear
          </Button>
        )}
      </div>
      <p className="text-[10.5px] leading-relaxed text-nautral-500">
        {liveReload === null
          ? 'checking control plane…'
          : liveReload
            ? 'Live updates on. The VPS polls every ~60 seconds and reloads hermes when this changes.'
            : 'Hot-reload disabled (control plane has no public URL). Set PUBLIC_BASE_URL on the server to enable in-place updates.'}
      </p>
    </Card>
  );
}
