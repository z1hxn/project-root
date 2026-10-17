'use client';
import { createContext, useContext, type Dispatch, type SetStateAction } from 'react';
import type { UserProfile } from '@/types/user';
import type { OSSettings } from '@/lib/os-settings';
import type { GameFile } from '@/game/filesystem';
import type { AppId } from '@/components/desktop/apps';
import type { IncidentReport, LinkReport, BuildReport } from '@/game/missions';
export type SessionAction = 'logout' | 'shutdown' | 'restart' | 'lock';
export interface EditorDocument {
  path: string | null;
  text: string;
  saved: string;
}
export interface WorkspaceContextValue {
  editorDocuments: Record<string, EditorDocument>;
  setEditorDocument: (instanceId: string, document: EditorDocument) => void;
  restoreEditorWindow: (instanceId: string) => void;
  openText: (path: string) => void;
  profile: UserProfile;
  onProfile: (p: UserProfile) => void;
  settings: OSSettings;
  saveSettings: (settings: OSSettings) => Promise<void>;
  openApp: (id: AppId) => void;
  browserNavigation: { url: string; requestId: number } | null;
  openBrowserUrl: (url: string) => void;
  clearBrowserNavigation: (requestId: number) => void;
  sessionAction: (action: SessionAction) => void;
  fullscreenActive: boolean;
  toggleFullscreen: () => Promise<void>;
  files: GameFile[];
  setFiles: Dispatch<SetStateAction<GameFile[]>>;
  notify: (message: string, source?: AppId | 'plasma') => void;
  recordVisit: (url: string) => Promise<void>;
  rollbackMission: (stage: 1 | 2 | 3 | 4) => Promise<void>;
  submitLinkReport: (report: LinkReport) => Promise<void>;
  submitBuildReport: (report: BuildReport) => Promise<void>;
  submitReport: (report: IncidentReport) => Promise<void>;
  useHint: () => Promise<void>;
  installPackage: () => Promise<void>;
  recordEvidence: (path: string) => Promise<void>;
  fileLocation: string;
  setFileLocation: (path: string) => void;
  clipboard: { paths: string[]; cut: boolean } | null;
  setClipboard: (value: { paths: string[]; cut: boolean } | null) => void;
  settingsPage: string;
  setSettingsPage: (page: string) => void;
}
export const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);
export function useWorkspace() {
  const value = useContext(WorkspaceContext);
  if (!value) throw Error('Workspace provider missing');
  return value;
}
