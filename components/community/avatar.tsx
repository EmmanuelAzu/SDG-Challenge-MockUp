/** Initial-in-a-circle avatar (no photos in the mock). */
export function Avatar({ name, color, size = 32 }: { name: string; color: string; size?: number }) {
  return (
    <span aria-hidden className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white" style={{ width: size, height: size, background: color, fontSize: size * 0.42 }}>
      {(name.trim()[0] ?? '?').toUpperCase()}
    </span>
  );
}
