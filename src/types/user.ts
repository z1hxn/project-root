import type { OSSettings } from '@/lib/os-settings';
export interface UserProfile {
  username: string;
  email: string;
  displayName: string;
  setupCompleted: boolean;
  introCompleted: boolean;
  wallpaper: string;
  createdAt: string;
  osSettings: OSSettings;
  briefingCompleted: boolean;
}
