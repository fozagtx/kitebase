// Animated terminal demo: a kitebase actor on assignment, reasoning out loud,
// signing purchases with its Kite Agent Passport, paying via x402, reporting back.
//
// The reveal plays once when the section scrolls into view, then loops with a
// long pause so the user doesn't catch it mid-flight. Per-line typing-cursor
// hop adds rhythm without being noisy.

import { useEffect, useRef, type ReactNode } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

type Line =
  | { kind: 'header'; text: string }
  | { kind: 'check'; text: string }
  | { kind: 'arrow'; text: string }
  | { kind: 'add'; text: string; price?: string; meta?: string }
  | { kind: 'remove'; text: string }
  | { kind: 'cost'; text: string }
  | { kind: 'sig'; text: string }
  | { kind: 'final'; text: string }
  | { kind: 'blank' };

const SCRIPT: Line[] = [
  { kind: 'header', text: 'kitebase ▸ Aegis · book a flight to Lagos this Friday' },
  { kind: 'blank' },
  { kind: 'check', text: 'Identity: did:kite:kitebase/aegis · AA wallet 0xB087…B8Da' },
  { kind: 'check', text: 'Budget: $200 USDC remaining this week  [guardrail pass]' },
  { kind: 'blank' },
  { kind: 'arrow', text: 'Searching flights via x402 partners…' },
  { kind: 'cost', text: '$0.002 USDC · skyscanner-mcp.kite' },
  { kind: 'blank' },
  { kind: 'add', text: 'Lufthansa LH570', price: '$187 USDC', meta: '8h 10m' },
  { kind: 'add', text: 'KLM 0598',        price: '$142 USDC', meta: '6h 40m' },
  { kind: 'add', text: 'Air France AF690', price: '$165 USDC', meta: '7h 25m' },
  { kind: 'blank' },
  { kind: 'arrow', text: 'Optimising for arrival time + price…' },
  { kind: 'remove', text: 'Lufthansa LH570  (longer layover)' },
  { kind: 'check', text: 'Selecting KLM 0598 · $142 · 1 stop · 11:25 arrival' },
  { kind: 'blank' },
  { kind: 'arrow', text: 'Signing purchase with Kite Agent Passport…' },
  { kind: 'sig', text: 'sig: 0xab21…4ef9   ⚡ $0.002 USDC settlement · x402' },
  { kind: 'blank' },
  { kind: 'final', text: '✅ Booking confirmed · ref HK9PLM' },
  { kind: 'final', text: '   pinged you on Telegram with the itinerary' },
];

function renderLine(line: Line): { className: string; render: () => ReactNode } {
  switch (line.kind) {
    case 'header':
      return {
        className: '',
        render: () => <span className="text-white">{line.text}</span>,
      };
    case 'check':
      return {
        className: '',
        render: () => (
          <span>
            <span className="text-success">✓ </span>
            <span className="text-kbblue-300">{line.text}</span>
          </span>
        ),
      };
    case 'arrow':
      return {
        className: '',
        render: () => (
          <span>
            <span className="text-kbblue-500">▸ </span>
            <span className="text-white/90">{line.text}</span>
          </span>
        ),
      };
    case 'add':
      return {
        className: '',
        render: () => (
          <span className="flex items-baseline justify-between gap-3">
            <span>
              <span className="text-success">+ </span>
              <span className="text-white/90">{line.text}</span>
            </span>
            <span className="flex items-baseline gap-3">
              {line.meta && <span className="text-white/45">{line.meta}</span>}
              {line.price && <span className="text-success">{line.price}</span>}
            </span>
          </span>
        ),
      };
    case 'remove':
      return {
        className: '',
        render: () => (
          <span>
            <span className="text-error">− </span>
            <span className="text-white/55 line-through">{line.text}</span>
          </span>
        ),
      };
    case 'cost':
      return {
        className: '',
        render: () => (
          <span>
            <span className="text-success">⚡ </span>
            <span className="text-success">{line.text}</span>
          </span>
        ),
      };
    case 'sig':
      return {
        className: '',
        render: () => <span className="text-kbblue-300">{line.text}</span>,
      };
    case 'final':
      return {
        className: '',
        render: () => <span className="text-success">{line.text}</span>,
      };
    case 'blank':
      return { className: 'h-2', render: () => <span>&nbsp;</span> };
  }
}

export function TerminalDemo() {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const ctx = gsap.context(() => {
      const lines = root.querySelectorAll<HTMLDivElement>('.term-line');
      const cursor = root.querySelector<HTMLSpanElement>('.term-cursor');

      const reset = () => {
        gsap.set(lines, { opacity: 0, y: 4 });
        if (cursor) gsap.set(cursor, { opacity: 0 });
      };
      reset();

      const playOnce = () => {
        const tl = gsap.timeline();
        lines.forEach((line, i) => {
          const delay = i === 0 ? 0 : '+=0.09';
          tl.to(
            line,
            { opacity: 1, y: 0, duration: 0.18, ease: 'power1.out' },
            delay,
          );
        });
        if (cursor) {
          tl.to(cursor, { opacity: 1, duration: 0.1 });
          tl.to(cursor, {
            opacity: 0,
            duration: 0.45,
            repeat: 4,
            yoyo: true,
            ease: 'none',
          });
        }
        return tl;
      };

      ScrollTrigger.create({
        trigger: root,
        start: 'top 80%',
        once: true,
        onEnter: () => {
          const loop = gsap.timeline({ repeat: -1, repeatDelay: 3.5 });
          loop.add(playOnce()).add(() => reset(), '+=0.2');
        },
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={rootRef} className="mx-auto w-full max-w-3xl">
      <div className="overflow-hidden rounded-2xl border border-navy/20 bg-navy shadow-[0_24px_60px_-20px_rgba(0,34,89,0.45)]">
        {/* chrome */}
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
          </div>
          <div className="font-mono text-[11px] text-white/60">
            Kite Agent Passport ▸ booking flight to Lagos
          </div>
          <div className="w-12" />
        </div>

        {/* body */}
        <div className="px-5 py-4 font-mono text-[12.5px] leading-relaxed">
          {SCRIPT.map((line, i) => {
            const s = renderLine(line);
            return (
              <div key={i} className={`term-line ${s.className}`}>
                {s.render()}
              </div>
            );
          })}
          <div className="mt-1">
            <span className="term-cursor inline-block h-[12px] w-[7px] translate-y-[1px] bg-success" />
          </div>
        </div>
      </div>
    </div>
  );
}
