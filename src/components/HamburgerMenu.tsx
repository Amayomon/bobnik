import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

interface HamburgerMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate: (target: 'room' | 'log' | 'stats' | 'profile' | 'invite' | 'settings' | 'lobby' | 'logout') => void;
}

const menuItems: { key: 'room' | 'log' | 'stats' | 'profile' | 'invite' | 'settings' | 'lobby' | 'logout'; icon: string; label: string; divider?: boolean }[] = [
  { key: 'room', icon: '🏠', label: 'Místnost' },
  { key: 'log', icon: '📋', label: 'Log' },
  { key: 'stats', icon: '📊', label: 'Statistiky' },
  { key: 'profile', icon: '👤', label: 'Profil' },
  { key: 'invite', icon: '🔗', label: 'Pozvat člena' },
  { key: 'settings', icon: '⚙️', label: 'Nastavení' },
  { key: 'lobby', icon: '🚪', label: 'Místnosti', divider: true },
  { key: 'logout', icon: '👋', label: 'Odhlásit' },
];

export function HamburgerMenu({ open, onOpenChange, onNavigate }: HamburgerMenuProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-64 p-0">
        <SheetHeader className="px-5 pt-5 pb-3">
          <SheetTitle className="text-base font-bold text-foreground">Menu</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col">
          {menuItems.map(item => (
            <div key={item.key}>
              {item.divider && <div className="h-px bg-border my-1 mx-5" />}
              <button
                onClick={() => {
                  onNavigate(item.key);
                  onOpenChange(false);
                }}
                className="flex items-center gap-3 px-5 py-3 text-sm font-medium text-foreground hover:bg-muted transition-colors text-left w-full"
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            </div>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
