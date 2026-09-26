import type { OSSettings } from '@/lib/os-settings';
import type { GameProgress } from '@/game/missions';
export interface UserProfile {
  gameProgress: GameProgress;
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
