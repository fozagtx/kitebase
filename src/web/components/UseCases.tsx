// Use-case grid: what an actor's Kite Agent Passport unlocks.
// Cards live in one container with an animated circuit-trace background and
// real brand logos (Google's S2 favicon service, with initials as fallback).

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface UseCase {
  category: string;
  service: string;
  domain?: string;
  prompt: string;
}

const CASES: UseCase[] = [
  { category: 'Shopping',  service: 'Amazon',       domain: 'amazon.com',       prompt: 'Buy me snacks under $25' },
  { category: 'Image gen', service: 'fal.ai',       domain: 'fal.ai',           prompt: 'Generate a LinkedIn banner' },
  { category: 'Mail',      service: 'AgentMail',    domain: 'agentmail.to',     prompt: 'Plan a 3-day Tokyo trip, email it' },
  { category: 'Search',    service: 'EXA',          domain: 'exa.ai',           prompt: 'Top 5 Hacker News posts today' },
  { category: 'Scrape',    service: 'Firecrawl',    domain: 'firecrawl.dev',    prompt: 'Summarise the React docs' },
  { category: 'Reddit',    service: 'StableEnrich', domain: 'stableenrich.com', prompt: 'Trending AI discussions' },
  { category: 'Crypto',    service: 'Nansen',       domain: 'nansen.ai',        prompt: 'Active prediction markets' },
  { category: 'Email',     service: 'StableEmail',  domain: 'stableemail.com',  prompt: 'Product update to subscribers' },
  { category: 'Phone',     service: 'StablePhone',  domain: 'stablephone.com',  prompt: 'Book a table for 7pm' },
  { category: 'Weather',   service: 'Weather',      domain: 'openweathermap.org', prompt: 'Weather in New York?' },
  { category: 'Search',    service: 'Parallel',     domain: 'parallel.ai',      prompt: 'Compare AI coding models' },
  { category: 'Storage',   service: 'Storage',                                  prompt: 'Save these startup ideas' },
];

// Circuit traces drawn across a 100 x 60 viewBox (matches grid aspect).
const TRACES: string[] = [
  'M 0 8  L 28 8  L 28 22 L 60 22 L 60 12 L 100 12',
  'M 0 30 L 18 30 L 18 18 L 46 18 L 46 38 L 76 38 L 76 28 L 100 28',
  'M 0 52 L 22 52 L 22 42 L 52 42 L 52 56 L 84 56 L 84 46 L 100 46',
  'M 12 0  L 12 14 L 38 14 L 38 32 L 68 32 L 68 60',
  'M 56 0  L 56 10 L 92 10 L 92 60',
  'M 36 60 L 36 50 L 24 50 L 24 60',
];

function LogoChip({ service, domain }: { service: string; domain?: string }) {
  const [errored, setErrored] = useState(false);
  const showInitials = !domain || errored;
  return (
    <span
      className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white ring-1 ring-kbblue-300/40 transition-transform duration-200 group-hover:scale-110"
      aria-hidden="true"
    >
      {showInitials ? (
        <span className="font-mono text-[10px] font-bold text-kbblue-700">
          {service.slice(0, 2).toUpperCase()}
        </span>
      ) : (
        <img
          src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
          alt=""
          width={20}
          height={20}
          className="h-5 w-5 object-contain"
          onError={() => setErrored(true)}
          loading="lazy"
        />
      )}
    </span>
  );
}

export function UseCases() {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const ctx = gsap.context(() => {
      const cards = root.querySelectorAll<HTMLElement>('.uc-card');
      gsap.set(cards, { opacity: 0, y: 16 });
      ScrollTrigger.batch(cards, {
        start: 'top 88%',
        onEnter: (batch) =>
          gsap.to(batch, {
            opacity: 1,
            y: 0,
            duration: 0.5,
            ease: 'power2.out',
            stagger: 0.05,
            overwrite: true,
          }),
      });

      const traces = root.querySelectorAll<SVGPathElement>('.uc-trace');
      traces.forEach((t) => {
        const len = t.getTotalLength();
        gsap.set(t, {
          strokeDasharray: len,
          strokeDashoffset: len,
          opacity: 0.35,
        });
      });
      ScrollTrigger.create({
        trigger: root,
        start: 'top 80%',
        once: true,
        onEnter: () => {
          gsap.to(traces, {
            strokeDashoffset: 0,
            duration: 1.4,
            ease: 'power2.out',
            stagger: 0.12,
          });
        },
      });

      const pulses = root.querySelectorAll<SVGPathElement>('.uc-pulse');
      pulses.forEach((p, i) => {
        const len = p.getTotalLength();
        gsap.set(p, { strokeDasharray: `4 ${len}`, strokeDashoffset: len, opacity: 0 });
        gsap
          .timeline({ repeat: -1, delay: 1.2 + i * 0.7 })
          .to(p, { opacity: 1, duration: 0.15 })
          .to(p, { strokeDashoffset: 0, duration: 3.5, ease: 'sine.inOut' }, '<')
          .to(p, { opacity: 0, duration: 0.4 }, '-=0.4')
          .set(p, { strokeDashoffset: len });
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section className="mx-auto max-w-5xl px-6 py-16" ref={rootRef}>
      <div className="mx-auto mb-8 max-w-2xl text-center">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-nautral-500">
          what passports unlock
        </div>
        <h2
          className="mt-2 font-serif text-3xl text-navy md:text-4xl"
          style={{ letterSpacing: '-0.025em' }}
        >
          Your actor can pay for anything.
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-nautral-700">
          One identity, every tool. Autonomous, spend-bounded, x402-priced access.
        </p>
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-kbblue-300/40 bg-white/70 p-3 shadow-card backdrop-blur md:p-4">
        <svg
          aria-hidden="true"
          viewBox="0 0 100 60"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-0 h-full w-full"
        >
          <defs>
            <linearGradient id="uc-trace-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#79ADF8" stopOpacity="0.5" />
              <stop offset="1" stopColor="#0074EC" stopOpacity="0.7" />
            </linearGradient>
            <linearGradient id="uc-pulse-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#0DDE53" stopOpacity="0" />
              <stop offset="0.5" stopColor="#0DDE53" stopOpacity="1" />
              <stop offset="1" stopColor="#0DDE53" stopOpacity="0" />
            </linearGradient>
          </defs>
          {TRACES.map((d, i) => (
            <g key={i}>
              <path
                className="uc-trace"
                d={d}
                stroke="url(#uc-trace-grad)"
                strokeWidth="0.35"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              <path
                className="uc-pulse"
                d={d}
                stroke="url(#uc-pulse-grad)"
                strokeWidth="0.9"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </g>
          ))}
        </svg>

        <div className="relative grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
          {CASES.map((c) => (
            <article
              key={c.service + c.prompt}
              tabIndex={0}
              className="uc-card group relative cursor-default rounded-xl border border-transparent bg-skeleton/80 p-3 outline-none transition-all duration-200 hover:-translate-y-1 hover:border-kbblue-300/70 hover:bg-white hover:shadow-card focus-visible:border-kbblue-300/70 focus-visible:ring-2 focus-visible:ring-kbblue-300"
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100"
                style={{
                  background:
                    'radial-gradient(180px 140px at 50% 0%, rgba(0,116,236,0.18), transparent 70%)',
                }}
              />
              <div className="relative flex items-center gap-2">
                <LogoChip service={c.service} domain={c.domain} />
                <div className="min-w-0">
                  <div className="truncate text-[12.5px] font-semibold text-navy">
                    {c.service}
                  </div>
                  <div className="text-[9.5px] uppercase tracking-wider text-nautral-500">
                    {c.category}
                  </div>
                </div>
              </div>
              <div className="relative mt-2 truncate font-mono text-[10.5px] text-nautral-600 group-hover:text-navy">
                "{c.prompt}"
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
