import { Brand } from '@/components/ui/Brand';
export default function Loading() {
  return (
    <main className="boot-screen">
      <div role="status">
        <Brand />
        <p className="eyebrow subtle" style={{ marginTop: 20 }}>
          CONNECTING WORKSPACE...
        </p>
      </div>
    </main>
  );
}
