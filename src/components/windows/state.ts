import { applications, type AppId } from '@/components/desktop/apps';
export interface WindowState {
  id: AppId;
  x: number;
  y: number;
  width: number;
  height: number;
  z: number;
  minimized: boolean;
  maximized: boolean;
  desktop: number;
  snap: 'left' | 'right' | null;
  shaded: boolean;
  above: boolean;
}
export type WindowAction =
  | { type: 'open'; id: AppId; desktop?: number }
  | { type: 'close' | 'focus' | 'minimize' | 'maximize' | 'shade' | 'above'; id: AppId }
  | { type: 'move'; id: AppId; x: number; y: number }
  | { type: 'resize'; id: AppId; width: number; height: number; x?: number; y?: number }
  | { type: 'snap'; id: AppId; side: 'left' | 'right' | null }
  | { type: 'desktop'; id: AppId; desktop: number }
  | { type: 'showDesktop'; restore?: boolean };
export const initialWindows: WindowState[] = [
  {
    id: 'root',
    x: 210,
    y: 62,
    width: 1040,
    height: 700,
    z: 1,
    minimized: false,
    maximized: false,
    desktop: 0,
    snap: null,
    shaded: false,
    above: false,
  },
];
export function windowReducer(state: WindowState[], action: WindowAction): WindowState[] {
  const top = Math.max(0, ...state.map((w) => w.z)) + 1;
  if (action.type === 'showDesktop')
    return state.map((w) => ({ ...w, minimized: !action.restore }));
  if (action.type === 'close') return state.filter((w) => w.id !== action.id);
  if (action.type === 'open' && !state.some((w) => w.id === action.id)) {
    const app = applications.find((a) => a.id === action.id)!;
    return [
      ...state,
      {
        id: action.id,
        x: 140 + (state.length % 5) * 32,
        y: 48 + (state.length % 5) * 28,
        width: app.width,
        height: app.height,
        z: top,
        minimized: false,
        maximized: false,
        desktop: action.desktop ?? 0,
        snap: null,
        shaded: false,
        above: false,
      },
    ];
  }
  return state.map((w) => {
    if (w.id !== action.id) return w;
    switch (action.type) {
      case 'open':
        return { ...w, minimized: false, shaded: false, z: top };
      case 'focus':
        return { ...w, z: top };
      case 'minimize':
        return { ...w, minimized: true };
      case 'maximize':
        return { ...w, maximized: !w.maximized, snap: null, shaded: false, z: top };
      case 'move':
        return { ...w, x: action.x, y: action.y, snap: null };
      case 'resize':
        return {
          ...w,
          width: action.width,
          height: action.height,
          x: action.x ?? w.x,
          y: action.y ?? w.y,
        };
      case 'snap':
        return { ...w, snap: action.side, maximized: false, shaded: false };
      case 'shade':
        return { ...w, shaded: !w.shaded };
      case 'above':
        return { ...w, above: !w.above };
      case 'desktop':
        return { ...w, desktop: action.desktop };
      default:
        return w;
    }
  });
}
export function clampPosition(
  x: number,
  y: number,
  width: number,
  height: number,
  viewportWidth: number,
  viewportHeight: number,
) {
  return {
    x: Math.max(0, Math.min(x, Math.max(0, viewportWidth - width))),
    y: Math.max(0, Math.min(y, Math.max(0, viewportHeight - height - 62))),
  };
}
