import type { AppId } from '@/components/desktop/apps';
import { ProjectRoot } from './ProjectRoot';
import { Browser } from './Browser';
import { TerminalApp } from './Terminal';
import { Mail } from './Mail';
import { Files } from './Files';
import { TextEditor } from './TextEditor';
import { Settings } from './Settings';
export function AppContent({ id }: { id: AppId }) {
  switch (id) {
    case 'root':
      return <ProjectRoot />;
    case 'browser':
      return <Browser />;
    case 'terminal':
      return <TerminalApp />;
    case 'mail':
      return <Mail />;
    case 'files':
      return <Files />;
    case 'editor':
      return <TextEditor />;
    case 'settings':
      return <Settings />;
  }
}
