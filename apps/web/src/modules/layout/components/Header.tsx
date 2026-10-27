'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@task-manager/ui';
import { LogOut, LayoutGrid, Calendar } from 'lucide-react';
import OrganizationSwitcher from '@/modules/organization/containers/OrganizationSwitcher';

interface HeaderUser {
  name: string;
  email?: string;
}

interface HeaderProps {
  user: HeaderUser | null;
  onLogout: () => void;
}

export default function Header({ user, onLogout }: HeaderProps) {
  const pathname = usePathname();

  const isBoardsActive = pathname === '/dashboard' || pathname.startsWith('/boards');
  const isCalendarActive = pathname.startsWith('/calendar');

  return (
    <header className="sticky top-0 z-30 border-b border-border/80 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-4 px-6 py-2.5 sm:px-8 lg:px-12">
        <div className="flex items-center gap-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 font-heading text-lg font-bold tracking-tight text-foreground transition-opacity hover:opacity-90"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-xs font-black text-primary-foreground shadow-sm shadow-primary/30">
              TF
            </span>
            <span><span className="text-primary">task</span>flow</span>
          </Link>

          <nav className="flex items-center gap-1">
            <Link
              href="/dashboard"
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-[background-color,color] duration-150 ${
                isBoardsActive
                  ? 'bg-secondary text-foreground font-semibold shadow-xs'
                  : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
              Boards
            </Link>
            <Link
              href="/calendar"
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-[background-color,color] duration-150 ${
                isCalendarActive
                  ? 'bg-secondary text-foreground font-semibold shadow-xs'
                  : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
              }`}
            >
              <Calendar className="h-4 w-4" />
              Calendar
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {user && <OrganizationSwitcher />}

          {user && (
            <div className="flex items-center pl-1 border-l border-border/60">
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-2 rounded-full p-1 pl-2 text-left outline-none transition-[background-color,transform] duration-150 hover:bg-secondary active:scale-[0.98]">
                  <span className="hidden text-xs font-medium text-foreground sm:inline-block">
                    {user.name}
                  </span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary shadow-xs ring-1 ring-primary/20">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-semibold leading-none text-foreground">{user.name}</p>
                      {user.email && (
                        <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={onLogout}
                    className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
