'use client';
import { createContext, useContext } from 'react';
import type { UserProfile } from '@/types/user';
import type { OSSettings } from '@/lib/os-settings';
import type { GameFile } from '@/game/filesystem';
import type { AppId } from '@/components/desktop/apps';
export type SessionAction = 'logout' | 'shutdown' | 'restart' | 'lock';
export interface EditorDocument {
  path: string | null;
  text: string;
  saved: string;
}
export interface WorkspaceContextValue {
  editorDocument: EditorDocument;
  setEditorDocument: (document: EditorDocument) => void;
  editorRequest: { path: string; id: number } | null;
  openText: (path: string) => void;
  clearEditorRequest: () => void;
  profile: UserProfile;
  onProfile: (p: UserProfile) => void;
  settings: OSSettings;
  saveSettings: (settings: OSSettings) => Promise<void>;
  openApp: (id: AppId) => void;
  sessionAction: (action: SessionAction) => void;
  files: GameFile[];
  setFiles: (files: GameFile[]) => void;
  notify: (message: string, source?: AppId | 'plasma') => void;
  recordVisit: (url: string) => Promise<void>;
  rollbackMission: (stage: 0 | 1) => Promise<void>;
  submitReport: (handle: string, sources: string[]) => Promise<void>;
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
