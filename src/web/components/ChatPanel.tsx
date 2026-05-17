import { useEffect, useRef, useState } from 'react';
import { api } from '../api';
import { Alert } from './ui/alert';
import { Avatar, AvatarInitials } from './ui/avatar';
import { Button } from './ui/button';
import { Card, InnerTile } from './ui/card';
import { Input } from './ui/input';
import type { ChatMessage, Deployment } from '../types';

interface Props {
  deployment: Deployment;
}

export function ChatPanel({ deployment }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .chatHistory(deployment.id)
      .then((r) => {
        if (!cancelled) setMessages(r.messages);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [deployment.id]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages.length]);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setError(null);
    const userMsg: ChatMessage = {
      id: `local-${Date.now()}`,
      deploymentId: deployment.id,
      role: 'user',
      content: text,
      createdAt: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    try {
      const r = await api.sendChat(deployment.id, text);
      setMessages(r.history);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSending(false);
    }
  }

  return (
    <Card className="flex h-full flex-col gap-3 p-5">
      <div className="flex items-center gap-3 px-1">
        <Avatar className="h-9 w-9">
          <AvatarInitials name={deployment.identity.agentName} />
        </Avatar>
        <div className="min-w-0">
          <div
            className="font-serif text-xl text-navy"
            style={{ letterSpacing: '-0.025em' }}
          >
            chat with {deployment.identity.agentName}
          </div>
          <div className="truncate text-[11px] text-nautral-500">
            Featherless · {deployment.inferenceModel}
          </div>
        </div>
      </div>

      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-1 pb-1">
        {messages.length === 0 && (
          <InnerTile className="px-4 py-3 text-center text-xs text-nautral-600">
            Say hi. The VPS may still be provisioning - chat works through the control plane
            until then.
          </InnerTile>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={
              m.role === 'user'
                ? 'ml-auto max-w-[82%] rounded-2xl bg-cta px-4 py-2.5 text-sm leading-relaxed text-white shadow-[0_1px_0_rgba(255,255,255,0.2)_inset]'
                : 'mr-auto max-w-[82%] rounded-2xl bg-white px-4 py-2.5 text-sm leading-relaxed text-navy shadow-search'
            }
          >
            {m.content}
          </div>
        ))}
        {sending && (
          <InnerTile className="mr-auto max-w-[40%] px-4 py-2.5 text-sm italic text-nautral-500">
            thinking…
          </InnerTile>
        )}
      </div>

      {error && <Alert variant="destructive">{error}</Alert>}

      <InnerTile className="flex items-center gap-2 p-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
          placeholder="Ask your actor anything…"
          className="h-9 border-0 bg-transparent shadow-none focus:border-0 focus:ring-0"
        />
        <Button size="sm" onClick={() => void send()} disabled={sending || !input.trim()}>
          send
        </Button>
      </InnerTile>
    </Card>
  );
}
