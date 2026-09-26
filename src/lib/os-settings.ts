import { z } from 'zod';
export const osSettingsSchema = z
  .object({
    theme: z.enum(['breeze', 'breeze-dark', 'breeze-twilight']).default('breeze'),
    accent: z.enum(['#3daee9', '#1abc9c', '#9b59b6', '#e74c3c', '#f39c12']).default('#3daee9'),
    wallpaper: z.enum(['scarlet-tree', 'hanabi', 'midnight', 'solid']).default('scarlet-tree'),
    backgroundColor: z
      .string()
      .regex(/^#[0-9a-fA-F]{6}$/)
      .default('#1d3557'),
    fontSize: z.number().int().min(11).max(16).default(13),
    fontFamily: z.enum(['Noto Sans', 'system-ui']).default('Noto Sans'),
    scale: z.enum(['100', '110', '125']).default('100'),
    animationSpeed: z.number().int().min(0).max(3).default(1),
    panelFloating: z.boolean().default(true),
    panelPosition: z.enum(['bottom', 'top']).default('bottom'),
    panelHeight: z.number().int().min(38).max(64).default(46),
    desktopIcons: z.boolean().default(true),
    iconSize: z.number().int().min(32).max(64).default(48),
    clickMode: z.enum(['single', 'double']).default('double'),
    focusMode: z.enum(['click', 'follow']).default('click'),
    virtualDesktops: z.number().int().min(1).max(4).default(2),
    volume: z.number().int().min(0).max(100).default(70),
    muted: z.boolean().default(false),
    systemSounds: z.boolean().default(true),
    doNotDisturb: z.boolean().default(false),
    notificationPreviews: z.boolean().default(true),
    wifi: z.boolean().default(true),
    airplaneMode: z.boolean().default(false),
    bluetooth: z.boolean().default(false),
    brightness: z.number().int().min(45).max(100).default(100),
    nightLight: z.boolean().default(false),
    warmth: z.number().int().min(0).max(60).default(25),
    clock24h: z.boolean().default(true),
    showSeconds: z.boolean().default(false),
    showDate: z.boolean().default(true),
    timezone: z
      .enum(['Asia/Seoul', 'UTC', 'America/New_York', 'Europe/Berlin', 'Asia/Tokyo'])
      .default('Asia/Seoul'),
    lockAfter: z.enum(['0', '1', '5', '15', '30']).default('0'),
    showHiddenFiles: z.boolean().default(false),
  })
  .strict();
export type OSSettings = z.infer<typeof osSettingsSchema>;
export const defaultOSSettings: OSSettings = osSettingsSchema.parse({});
export function readOSSettings(value: unknown): OSSettings {
  const parsed = osSettingsSchema.safeParse(value);
  return parsed.success ? parsed.data : defaultOSSettings;
}
export const wallpapers = [
  {
    id: 'scarlet-tree',
    name: 'Scarlet Tree',
    image: '/assets/wallpapers/scarlet-tree.webp',
    author: 'axo1otl',
  },
  {
    id: 'hanabi',
    name: 'Hanabi',
    image: '/assets/wallpapers/hanabi.webp',
    author: 'Krystian Zajdel',
  },
  {
    id: 'midnight',
    name: 'Midnight',
    image: '/assets/wallpapers/hanabi.webp',
    author: 'Krystian Zajdel · dimmed',
  },
  { id: 'solid', name: '단색', image: '', author: '' },
] as const;
