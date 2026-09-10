import Link from 'next/link';
import { logoutStaff } from '@/lib/actions/auth';
import { Button } from '@/components/ui/Button';

interface NavItem {
  href: string;
  label: string;
}

interface Props {
  title: string;
  children: React.ReactNode;
  navItems?: NavItem[];
  activePath?: string;
  actions?: React.ReactNode;
}

export function StaffShell({ title, children, navItems, activePath, actions }: Props) {
  return (
    <div className="staff-shell">
      <header className="sticky top-0 z-20 border-b border-stone-200/80 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700/80">
              Comanda QR
            </p>
            <h1 className="truncate text-xl font-bold tracking-tight text-stone-900">{title}</h1>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {actions}
            <form action={logoutStaff}>
              <Button type="submit" variant="ghost" size="sm">
                Sair
              </Button>
            </form>
          </div>
        </div>
        {navItems && navItems.length > 0 && (
          <nav className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 pb-3">
            {navItems.map((item) => {
              const active = activePath === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                    active
                      ? 'bg-amber-600 text-white shadow-sm shadow-amber-600/25'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        )}
      </header>
      <div className="mx-auto max-w-6xl p-4 pb-8">{children}</div>
    </div>
  );
}
