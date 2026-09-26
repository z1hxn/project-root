import { applications, type AppId } from './apps';
export function PlasmaLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <g fill="currentColor">
        <circle cx="7" cy="7" r="2.4" />
        <circle cx="5" cy="16" r="2.8" />
        <circle cx="8" cy="26" r="3.1" />
        <path d="m17 5 11 11-11 11-4-4 7-7-7-7z" />
      </g>
    </svg>
  );
}
export function RootIcon({ size = 36 }: { size?: number }) {
  return (
    <img src="/brand/project-root-mark.svg" alt="" width={size} height={size} draggable={false} />
  );
}
export function AppIcon({ id, size = 32 }: { id: AppId; size?: number }) {
  const app = applications.find((a) => a.id === id)!;
  return id === 'root' ? (
    <RootIcon size={size} />
  ) : (
    <img
      className="native-app-icon"
      src={`/assets/icons/${app.asset}`}
      alt=""
      width={size}
      height={size}
      draggable={false}
    />
  );
}
