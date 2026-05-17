// Hero composition: a kitebase actor at the center wearing the Kite Agent
// Passport, surrounded by the channels it can act through. No stack jargon.
//
// Layered:
//   - SVG layer (back) drawing soft curved connection lines + traveling pulses
//   - Channel tiles (real brand icons + colors) positioned in a circle
//   - Center: KitebaseLogo + a small Kite Agent Passport card

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { KitebaseLogo } from './KitebaseLogo';

interface Channel {
  name: string;
  color: string;
  fg: string;
  // SVG path drawn inside a 24x24 viewBox
  icon: JSX.Element;
}

const CHANNELS: Channel[] = [
  {
    name: 'Telegram',
    color: '#229ED9',
    fg: '#FFFFFF',
    icon: (
      <path
        d="M21.55 3.13 2.6 10.74c-1.29.52-1.28 1.25-.24 1.57l4.86 1.52 11.25-7.1c.53-.34 1.02-.16.62.21l-9.11 8.23-.35 5.18c.51 0 .73-.23 1.01-.51l2.43-2.36 5.05 3.73c.93.51 1.59.25 1.83-.86l3.31-15.59c.34-1.36-.51-1.97-1.71-1.63Z"
        fill="currentColor"
      />
    ),
  },
  {
    name: 'Discord',
    color: '#5865F2',
    fg: '#FFFFFF',
    icon: (
      <path
        d="M20.317 4.369A19.79 19.79 0 0 0 16.5 3.2a.07.07 0 0 0-.073.034c-.211.375-.444.864-.608 1.247a18.27 18.27 0 0 0-5.487 0 12.51 12.51 0 0 0-.617-1.247.073.073 0 0 0-.073-.034A19.74 19.74 0 0 0 5.825 4.37a.06.06 0 0 0-.03.025C2.79 8.886 1.97 13.273 2.38 17.605a.08.08 0 0 0 .03.054 19.9 19.9 0 0 0 5.99 3.03.07.07 0 0 0 .08-.025c.46-.63.87-1.293 1.22-1.99a.073.073 0 0 0-.04-.1c-.66-.25-1.29-.55-1.9-.9a.073.073 0 0 1-.007-.122c.128-.096.256-.196.378-.297a.07.07 0 0 1 .073-.01c3.99 1.82 8.3 1.82 12.24 0a.07.07 0 0 1 .075.01c.123.1.25.2.378.297a.073.073 0 0 1-.006.122c-.61.355-1.24.65-1.9.9a.073.073 0 0 0-.04.1c.36.7.77 1.36 1.22 1.99a.07.07 0 0 0 .08.025 19.84 19.84 0 0 0 6-3.03.073.073 0 0 0 .03-.054c.5-5.04-.84-9.39-3.55-13.21a.06.06 0 0 0-.03-.026ZM8.52 14.97c-1.18 0-2.15-1.083-2.15-2.413 0-1.33.95-2.412 2.15-2.412 1.21 0 2.17 1.09 2.15 2.412 0 1.33-.95 2.413-2.15 2.413Zm7 0c-1.18 0-2.15-1.083-2.15-2.413 0-1.33.95-2.412 2.15-2.412 1.21 0 2.17 1.09 2.15 2.412 0 1.33-.94 2.413-2.15 2.413Z"
        fill="currentColor"
      />
    ),
  },
  {
    name: 'Slack',
    color: '#4A154B',
    fg: '#FFFFFF',
    icon: (
      <>
        <path
          d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.522A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52ZM6.313 15.165a2.527 2.527 0 0 1 2.522-2.52 2.527 2.527 0 0 1 2.52 2.52v6.313A2.528 2.528 0 0 1 8.835 24a2.528 2.528 0 0 1-2.522-2.522v-6.313ZM8.835 5.042a2.528 2.528 0 0 1-2.522-2.52A2.528 2.528 0 0 1 8.835 0a2.528 2.528 0 0 1 2.52 2.522v2.52H8.835ZM8.835 6.313a2.528 2.528 0 0 1 2.52 2.522 2.527 2.527 0 0 1-2.52 2.52H2.522A2.527 2.527 0 0 1 0 8.835a2.528 2.528 0 0 1 2.522-2.522h6.313ZM18.956 8.835a2.528 2.528 0 0 1 2.522-2.522A2.528 2.528 0 0 1 24 8.835a2.528 2.528 0 0 1-2.522 2.52h-2.522v-2.52ZM17.688 8.835a2.527 2.527 0 0 1-2.523 2.52 2.526 2.526 0 0 1-2.52-2.52V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.313ZM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52ZM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313Z"
          fill="currentColor"
        />
      </>
    ),
  },
  {
    name: 'WhatsApp',
    color: '#25D366',
    fg: '#FFFFFF',
    icon: (
      <path
        d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.198-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.611-.916-2.207-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.478 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347Zm-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.002-5.45 4.436-9.884 9.888-9.884a9.83 9.83 0 0 1 6.994 2.899 9.825 9.825 0 0 1 2.895 6.994c-.003 5.45-4.437 9.883-9.888 9.883Zm8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"
        fill="currentColor"
      />
    ),
  },
  {
    name: 'Email',
    color: '#002259',
    fg: '#FFFFFF',
    icon: (
      <path
        d="M2 4h20a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Zm10.06 8.683L2.638 5.246 2 5.81v.575l9.348 7.392a1 1 0 0 0 1.23-.005L22 6.252v-.42l-.61-.582-9.33 7.433Z"
        fill="currentColor"
      />
    ),
  },
  {
    name: 'Signal',
    color: '#3A76F0',
    fg: '#FFFFFF',
    icon: (
      <path
        d="M11.7 1.005a11.001 11.001 0 0 0-7.86 3.13l-.84-.85a1 1 0 1 0-1.42 1.41l.85.85a11 11 0 0 0-1.43 12.1l-.97 3.31a1 1 0 0 0 1.24 1.24l3.31-.97a11 11 0 0 0 12.1-1.43l.85.85a1 1 0 1 0 1.42-1.41l-.85-.85A11 11 0 0 0 12 1c-.1 0-.2 0-.3.005ZM12 3a9 9 0 0 1 7.42 14.13l-1.42-1.43a7 7 0 1 0-10.7-10.7L5.87 3.58A8.97 8.97 0 0 1 12 3Zm-7.42 2.85L6 7.27a7 7 0 0 0 10.73 10.73l1.42 1.42A8.99 8.99 0 0 1 4.7 7.27l-.12.58Z"
        fill="currentColor"
      />
    ),
  },
];

// Polar layout: 6 channels at 60° intervals, starting from 12 o'clock CW.
// All distances are in viewBox units (the SVG is 100x100, container is aspect-
// square, so 1 unit ≈ 1% of container width).
const CENTER_X = 50;
const CENTER_Y = 50;
const RING_R = 38;     // distance from center to channel tile center
const ORB_R = 11;      // outer radius of the central kitebase mark
const TILE_HALF = 7;   // half the visual size of a channel tile

function polarAt(idx: number, dist: number): { x: number; y: number } {
  const angleDeg = -90 + idx * 60; // start top, go clockwise
  const a = (angleDeg * Math.PI) / 180;
  return {
    x: CENTER_X + dist * Math.cos(a),
    y: CENTER_Y + dist * Math.sin(a),
  };
}
const polar = (idx: number) => polarAt(idx, RING_R);

export function HeroIllustration() {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const ctx = gsap.context(() => {
      // initial state
      gsap.set('.hi-tile', { opacity: 0, scale: 0.85, transformOrigin: 'center center' });
      gsap.set('.hi-line', { strokeDashoffset: 200, opacity: 0 });
      gsap.set('.hi-pulse', { opacity: 0 });
      gsap.set('.hi-center', { opacity: 0, scale: 0.8 });

      // entrance
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.to('.hi-center', { opacity: 1, scale: 1, duration: 0.7 })
        .to(
          '.hi-line',
          { strokeDashoffset: 0, opacity: 0.7, duration: 1.0, stagger: 0.08 },
          '-=0.3',
        )
        .to(
          '.hi-tile',
          { opacity: 1, scale: 1, duration: 0.45, stagger: 0.08 },
          '-=0.6',
        );

      // traveling pulses: travel from orb edge to tile edge along each line
      const pulses = root.querySelectorAll<SVGCircleElement>('.hi-pulse');
      pulses.forEach((p, i) => {
        const from = polarAt(i, ORB_R);
        const to = polarAt(i, RING_R - TILE_HALF);
        gsap.set(p, { attr: { cx: from.x, cy: from.y }, opacity: 0 });
        gsap
          .timeline({ repeat: -1, delay: 1.5 + i * 0.4 })
          .to(p, { opacity: 1, duration: 0.2 })
          .to(
            p,
            { attr: { cx: to.x, cy: to.y }, duration: 2.2, ease: 'sine.inOut' },
            '<',
          )
          .to(p, { opacity: 0, duration: 0.3 }, '-=0.3')
          .set(p, { attr: { cx: from.x, cy: from.y } });
      });
    }, root);

    return () => ctx.revert();
  }, []);

  // line endpoints: start at orb edge, end at tile edge (so lines visually
  // connect to both, not disappear inside them)
  const lines = CHANNELS.map((_, i) => {
    const from = polarAt(i, ORB_R);
    const to = polarAt(i, RING_R - TILE_HALF);
    return { x1: from.x, y1: from.y, x2: to.x, y2: to.y };
  });

  return (
    <div
      ref={rootRef}
      className="relative mx-auto aspect-square w-full max-w-[560px]"
    >
      {/* ambient halo */}
      <div className="pointer-events-none absolute inset-8 -z-10 rounded-full bg-kbblue-300/40 blur-3xl" />

      {/* connection lines (back layer) */}
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="hi-line-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#79ADF8" stopOpacity="0.9" />
            <stop offset="1" stopColor="#ADD9FF" stopOpacity="0.6" />
          </linearGradient>
        </defs>
        {lines.map((l, i) => (
          <line
            key={i}
            className="hi-line"
            x1={l.x1}
            y1={l.y1}
            x2={l.x2}
            y2={l.y2}
            stroke="url(#hi-line-grad)"
            strokeWidth="0.7"
            strokeLinecap="round"
            strokeDasharray="200"
            strokeDashoffset="200"
          />
        ))}
        {/* anchor dots at the tile-edge end of each line */}
        {lines.map((l, i) => (
          <circle
            key={`anchor-${i}`}
            className="hi-line"
            cx={l.x2}
            cy={l.y2}
            r="1"
            fill="#0074EC"
            opacity="0.7"
          />
        ))}
        {/* traveling pulses */}
        {CHANNELS.map((_, i) => (
          <circle
            key={`pulse-${i}`}
            className="hi-pulse"
            r="1.1"
            fill="#0DDE53"
          />
        ))}
      </svg>

      {/* channel tiles */}
      {CHANNELS.map((c, i) => {
        const p = polar(i);
        return (
          <div
            key={c.name}
            className="hi-tile absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1.5"
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
          >
            <div
              className="flex h-14 w-14 items-center justify-center rounded-2xl shadow-card md:h-16 md:w-16"
              style={{ background: c.color, color: c.fg }}
            >
              <svg
                viewBox="0 0 24 24"
                className="h-7 w-7 md:h-8 md:w-8"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                {c.icon}
              </svg>
            </div>
            <span className="rounded-full bg-white/85 px-2 py-0.5 text-[10px] font-semibold text-navy shadow-search backdrop-blur">
              {c.name}
            </span>
          </div>
        );
      })}

      {/* center: kitebase orb */}
      <div
        className="hi-center absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
      >
        <div className="relative">
          <div className="pointer-events-none absolute -inset-6 -z-10 rounded-full bg-white/40 blur-2xl" />
          <KitebaseLogo size={96} />
        </div>
      </div>
    </div>
  );
}
