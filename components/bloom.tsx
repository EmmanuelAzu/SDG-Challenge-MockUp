const PETALS = [
  { rot: -18, d: 'M0 -6 C 13 -9.0, 11.0 -24.6, 0 -30 C -11.0 -24.6, -13 -9.0, 0 -6Z' },
  { rot: 54, d: 'M0 -6 C 14 -9.9, 11.9 -27.1, 0 -33 C -11.9 -27.1, -14 -9.9, 0 -6Z' },
  { rot: 126, d: 'M0 -6 C 15 -10.8, 12.8 -29.5, 0 -36 C -12.8 -29.5, -15 -10.8, 0 -6Z' },
  { rot: 198, d: 'M0 -6 C 16 -11.7, 13.6 -32.0, 0 -39 C -13.6 -32.0, -16 -11.7, 0 -6Z' },
  { rot: 270, d: 'M0 -6 C 17 -12.6, 14.4 -34.4, 0 -42 C -14.4 -34.4, -17 -12.6, 0 -6Z' },
];

/** Five-petal bloom: one petal fills per completed milestone. */
export function Bloom({ progress = 0, size = 120 }: { progress?: number; size?: number }) {
  return (
    <svg
      viewBox="-48 -48 96 96"
      width={size}
      height={size}
      role="img"
      aria-label={`${progress} of 5 milestones complete`}
    >
      {PETALS.map((p, i) => (
        <path
          key={i}
          transform={`rotate(${p.rot})`}
          d={p.d}
          fill={i < progress ? '#D81B60' : 'none'}
          stroke="#F48FB1"
          strokeWidth={1.5}
        />
      ))}
      <circle r="9.5" fill="#F2B33D" />
      <circle r="5.2" fill="none" stroke="#FFD878" strokeWidth="1.6" />
    </svg>
  );
}
