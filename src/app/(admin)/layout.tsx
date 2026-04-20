'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Spinner } from '@/components/ui';
import ScreenLock from '@/components/ScreenLock';
import SearchModal from '@/components/SearchModal';
import NotificationBell from '@/components/NotificationBell';
import {
  LayoutDashboard,
  Users,
  Package,
  FolderTree,
  ShoppingCart,
  Settings,
  FileText,
  LogOut,
  Shield,
  ChevronLeft,
  Menu,
  Bell,
  Search,
  ChevronRight,
  Phone,
  Image,
  ShieldCheck,
  User,
  Ticket,
  BookOpen,
  ScrollText,
  MessageSquare,
  X,
} from 'lucide-react';

const mainNav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/urunler', label: 'Ürünler', icon: Package },
  { href: '/kategoriler', label: 'Kategoriler', icon: FolderTree },
  { href: '/siparisler', label: 'Siparişler', icon: ShoppingCart },
  { href: '/kullanicilar', label: 'Kullanıcılar', icon: Users },
  { href: '/toptan-basvurular', label: 'Şirket Başvuruları', icon: FileText },
  { href: '/talepler', label: 'Talepler', icon: MessageSquare },
  { href: '/kuponlar', label: 'Kuponlar', icon: Ticket },
  { href: '/blog', label: 'Blog', icon: BookOpen },
  { href: '/loglar', label: 'Loglar', icon: ScrollText, superAdminOnly: true },
];

const settingsNav = [
  { href: '/ayarlar/iletisim', label: 'İletişim Bilgileri', icon: Phone },
  { href: '/ayarlar/gorunum', label: 'Görünüm', icon: Image },
  { href: '/ayarlar/urun-ayarlari', label: 'Ürün Ayarları', icon: Package },
  { href: '/ayarlar/adminler', label: 'Admin Yönetimi', icon: ShieldCheck },
  { href: '/ayarlar/profil', label: 'Profil', icon: User },
  { href: '/ayarlar/kullanici', label: 'Kullanıcı Ayarları', icon: Bell },
];

export default function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, setUser, clearUser, isLoading } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) setSidebarOpen(false);
      else setMobileSidebarOpen(false);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          setUser(data.data.user);
        } else {
          clearUser();
          router.replace('/giris');
        }
      })
      .catch(() => {
        clearUser();
        router.replace('/giris');
      });
  }, [setUser, clearUser, router]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    clearUser();
    router.replace('/giris');
  };

  const toggleSidebar = useCallback(() => {
    if (isMobile) {
      setMobileSidebarOpen((prev) => !prev);
    } else {
      setSidebarOpen((prev) => !prev);
    }
  }, [isMobile]);

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-background)]">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-lg shadow-blue-500/30">
            <Shield className="h-7 w-7 text-white animate-pulse" />
          </div>
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  const allNav = [...mainNav, ...settingsNav];
  const currentPage = allNav.find((n) => pathname === n.href || pathname.startsWith(n.href + '/'));

  // Sidebar should show labels: on desktop when sidebarOpen, on mobile always (drawer mode)
  const showLabels = isMobile ? true : sidebarOpen;

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex h-[68px] items-center justify-between border-b border-white/[0.06] px-4">
        {showLabels && (
          <div className="flex items-center gap-3 animate-fade-in">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight">Kartal Civata</span>
              <p className="text-[10px] font-medium text-blue-400/80">Yönetim Paneli</p>
            </div>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 cursor-pointer transition-all hover:bg-white/[0.08] hover:text-white"
        >
          {isMobile ? (
            <X className="h-4 w-4" />
          ) : sidebarOpen ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <Menu className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-5">
        {showLabels && (
          <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            Ana Menü
          </p>
        )}
        <div className="space-y-0.5">
          {mainNav
            .filter((item) => !item.superAdminOnly || user?.isSuperAdmin)
            .map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium cursor-pointer transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-600/25'
                    : 'text-slate-400 hover:bg-white/[0.06] hover:text-white'
                }`}
                title={!showLabels ? label : undefined}
              >
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                  isActive ? 'bg-white/20' : 'bg-transparent group-hover:bg-white/[0.05]'
                }`}>
                  <Icon className="h-[18px] w-[18px] shrink-0" />
                </div>
                {showLabels && <span>{label}</span>}
                {showLabels && isActive && (
                  <ChevronRight className="ml-auto h-3.5 w-3.5 opacity-60" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Settings Section */}
        <div className="mt-6 border-t border-white/[0.06] pt-5">
          {showLabels && (
            <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
              Ayarlar
            </p>
          )}
          <div className="space-y-0.5">
            {settingsNav.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium cursor-pointer transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-violet-600 to-violet-500 text-white shadow-lg shadow-violet-600/25'
                      : 'text-slate-400 hover:bg-white/[0.06] hover:text-white'
                  }`}
                  title={!showLabels ? label : undefined}
                >
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                    isActive ? 'bg-white/20' : 'bg-transparent group-hover:bg-white/[0.05]'
                  }`}>
                    <Icon className="h-[18px] w-[18px] shrink-0" />
                  </div>
                  {showLabels && <span>{label}</span>}
                  {showLabels && isActive && (
                    <ChevronRight className="ml-auto h-3.5 w-3.5 opacity-60" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* User & Logout */}
      <div className="border-t border-white/[0.06] p-3">
        {showLabels && user && (
          <Link
            href="/ayarlar/profil"
            className="mb-3 flex items-center gap-3 rounded-xl bg-white/[0.04] px-3 py-3 cursor-pointer transition-all hover:bg-white/[0.08]"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-bold text-white shadow-md">
              {user.firstName?.[0]}{user.lastName?.[0]}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-white">{user.firstName} {user.lastName}</p>
              <p className="truncate text-[10px] text-slate-500">{user.email}</p>
            </div>
          </Link>
        )}
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-red-400 cursor-pointer transition-all hover:bg-red-500/10 hover:text-red-300"
          title={!showLabels ? 'Çıkış Yap' : undefined}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10">
            <LogOut className="h-[18px] w-[18px] shrink-0" />
          </div>
          {showLabels && <span>Çıkış Yap</span>}
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-[var(--color-background)]">
      <ScreenLock />
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Mobile Overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Desktop */}
      <aside
        className={`fixed left-0 top-0 z-50 hidden lg:flex h-full flex-col bg-gradient-to-b from-[#0f172a] via-[#0f172a] to-[#1e293b] text-white shadow-2xl transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'w-[260px]' : 'w-[72px]'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Sidebar - Mobile Drawer */}
      <aside
        className={`fixed left-0 top-0 z-50 flex lg:hidden h-full w-[280px] flex-col bg-gradient-to-b from-[#0f172a] via-[#0f172a] to-[#1e293b] text-white shadow-2xl transition-transform duration-300 ease-in-out ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Main Content */}
      <main
        className={`flex-1 min-w-0 transition-all duration-300 ease-in-out ${
          !isMobile ? (sidebarOpen ? 'lg:ml-[260px]' : 'lg:ml-[72px]') : 'ml-0'
        }`}
      >
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-[60px] lg:h-[68px] items-center justify-between border-b border-slate-200/60 bg-white/80 px-3 sm:px-4 lg:px-6 backdrop-blur-xl">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="flex lg:hidden h-9 w-9 items-center justify-center rounded-xl text-slate-600 cursor-pointer transition-colors hover:bg-slate-100"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-sm text-slate-400">
              <LayoutDashboard className="h-4 w-4" />
              <span>/</span>
            </div>
            <h1 className="text-sm sm:text-base font-semibold text-slate-800 truncate">
              {currentPage?.label || 'Yönetim Paneli'}
            </h1>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setSearchOpen(true)}
              className="flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-2 sm:px-3 text-slate-400 cursor-pointer transition-colors hover:bg-slate-100 hover:text-slate-600"
            >
              <Search className="h-[18px] w-[18px]" />
              <span className="hidden sm:inline text-xs">Ara...</span>
              <kbd className="ml-1 hidden lg:inline-block rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
                Ctrl+K
              </kbd>
            </button>
            <NotificationBell />
            {/* Mobile logout */}
            <button
              onClick={handleLogout}
              className="flex lg:hidden h-9 w-9 items-center justify-center rounded-xl text-slate-400 cursor-pointer transition-colors hover:bg-red-50 hover:text-red-500"
              title="Çıkış Yap"
            >
              <LogOut className="h-[18px] w-[18px]" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <div className="p-3 sm:p-4 lg:p-6 animate-fade-in">{children}</div>
      </main>
    </div>
  );
}
