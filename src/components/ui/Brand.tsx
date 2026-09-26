import { ArrowUpRight } from 'lucide-react';
export function Mark({ small = false }: { small?: boolean }) {
  return (
    <span className={`brand-mark ${small ? 'small' : ''}`} aria-hidden="true">
      <ArrowUpRight strokeWidth={2.5} />
    </span>
  );
}
export function Brand() {
  return (
    <span className="brand">
      <Mark />
      PROJECT ROOT<span className="brand-dot">®</span>
    </span>
  );
}
