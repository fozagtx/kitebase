// Co-branded Hermes × Kite mark using the real assets:
//   - hermesIcon.png ← https://hermes-agent.nousresearch.com/icon.png (48x48 anime portrait)
//   - kite.svg       ← https://gokite.ai/images/Kite_Logo.svg

interface Props {
  /** "pair" = both logos merged; "kiteOnly" = just Kite; "hermesOnly" = just Hermes. */
  variant?: 'pair' | 'kiteOnly' | 'hermesOnly';
  /** Height of the Hermes circular avatar in px. */
  height?: number;
  className?: string;
}

export function HermesKiteMark({ variant = 'pair', height = 32, className }: Props) {
  const ring = Math.max(2, Math.round(height * 0.05));
  const hermes = (
    <img
      src="/logos/hermesIcon.png"
      alt="Hermes Agent"
      width={height}
      height={height}
      style={{
        width: height,
        height,
        borderRadius: '50%',
        objectFit: 'cover',
        border: `${ring}px solid #FFFFFF`,
        boxShadow: '0 0 0 1px rgba(38, 112, 220, 0.2)',
      }}
    />
  );
  const kite = (
    <img
      src="/logos/kite.svg"
      alt="Kite"
      height={height * 0.65}
      style={{ height: height * 0.65 }}
    />
  );

  if (variant === 'hermesOnly') return <div className={className}>{hermes}</div>;
  if (variant === 'kiteOnly') return <div className={className}>{kite}</div>;
  return (
    <div className={`inline-flex items-center gap-2.5 ${className ?? ''}`}>
      {hermes}
      <span
        className="font-semibold text-kbblue-700"
        style={{ fontSize: height * 0.42, lineHeight: 1 }}
      >
        ×
      </span>
      {kite}
    </div>
  );
}
