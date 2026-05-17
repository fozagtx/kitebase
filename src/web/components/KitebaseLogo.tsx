// kitebase brand mark - a rounded kite (diamond) filled with the brand CTA gradient,
// with a soft horizontal spar and a white center jewel. Uses only Charms-spec colors:
//   #0044B9 → #0074EC → #4EB1FF → #ADD9FF  (the cta gradient stops)
//   white   (highlights)
// No vendor logos.

interface Props {
  size?: number;
  className?: string;
  /** when true, adds the wordmark "kitebase" in serif to the right of the mark */
  withWordmark?: boolean;
  /** override wordmark size (defaults to a sensible ratio of `size`) */
  wordmarkSize?: number;
}

export function KitebaseLogo({
  size = 40,
  className,
  withWordmark = false,
  wordmarkSize,
}: Props) {
  const wm = wordmarkSize ?? Math.round(size * 0.85);
  const mark = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id="kbLogoGrad"
          x1="20"
          y1="2"
          x2="20"
          y2="38"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0.055" stopColor="#0044B9" />
          <stop offset="0.35" stopColor="#0074EC" />
          <stop offset="0.65" stopColor="#4EB1FF" />
          <stop offset="0.95" stopColor="#ADD9FF" />
        </linearGradient>
        <linearGradient
          id="kbLogoShine"
          x1="20"
          y1="2"
          x2="20"
          y2="22"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="white" stopOpacity="0.55" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* rounded diamond - rotated square with 6px corner radius */}
      <g transform="translate(20 20) rotate(45) translate(-12 -12)">
        <rect
          x="0"
          y="0"
          width="24"
          height="24"
          rx="6"
          fill="url(#kbLogoGrad)"
        />
      </g>

      {/* top highlight, only on the upper half of the diamond */}
      <path
        d="M20 2 L37 19 L20 19 Z"
        fill="url(#kbLogoShine)"
      />

      {/* soft horizontal spar */}
      <line
        x1="6"
        y1="20"
        x2="34"
        y2="20"
        stroke="white"
        strokeOpacity="0.28"
        strokeWidth="0.8"
        strokeLinecap="round"
      />

      {/* center jewel */}
      <circle cx="20" cy="20" r="1.6" fill="white" />
    </svg>
  );

  if (!withWordmark) return <span className={className}>{mark}</span>;

  return (
    <span className={`inline-flex items-center gap-2.5 ${className ?? ''}`}>
      {mark}
      <span
        className="font-serif text-navy"
        style={{ fontSize: wm, lineHeight: 1, letterSpacing: '-0.025em' }}
      >
        kitebase
      </span>
    </span>
  );
}
