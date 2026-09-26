'use client';
import { useEffect, useRef, useState } from 'react';
import { X, ChevronDown } from 'lucide-react';
export function NativeMenuBar({
  menus,
}: {
  menus: Record<
    string,
    { label: string; shortcut?: string; action: () => void; disabled?: boolean }[]
  >;
}) {
  const [open, setOpen] = useState<string | null>(null);
  useEffect(() => {
    const close = () => setOpen(null);
    window.addEventListener('pointerdown', close);
    return () => window.removeEventListener('pointerdown', close);
  }, []);
  return (
    <nav className="native-menubar">
      {Object.entries(menus).map(([name, items]) => (
        <div key={name}>
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => setOpen(open === name ? null : name)}
            className={open === name ? 'selected' : ''}
          >
            {name}
          </button>
          {open === name && (
            <div className="native-context submenu" onPointerDown={(e) => e.stopPropagation()}>
              {items.map((item, i) => (
                <button
                  disabled={item.disabled}
                  key={i}
                  onClick={() => {
                    item.action();
                    setOpen(null);
                  }}
                >
                  {item.label}
                  <kbd>{item.shortcut}</kbd>
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </nav>
  );
}
export function NativeDialog({
  title,
  children,
  onClose,
  className = '',
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className={`native-dialog ${className}`}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <header>
        <strong>{title}</strong>
        <button aria-label="대화상자 닫기" onClick={onClose}>
          <X size={16} />
        </button>
      </header>
      {children}
    </dialog>
  );
}
export function ToolButton({
  label,
  children,
  onClick,
  disabled = false,
  active = false,
}: {
  label: string;
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <button
      className={`tool-button ${active ? 'selected' : ''}`}
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
export function SettingRow({
  label,
  children,
  description,
}: {
  label: string;
  children: React.ReactNode;
  description?: string;
}) {
  return (
    <div className="setting-row">
      <div className="setting-label">{label}</div>
      <div className="setting-control">
        {children}
        {description && <p className="setting-help">{description}</p>}
      </div>
    </div>
  );
}
