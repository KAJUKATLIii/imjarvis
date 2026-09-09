import React, { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useVoiceAssistance } from '../context/VoiceAssistanceContext';
import {
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  Server,
  LifeBuoy,
  ShieldCheck,
  ArrowUpRight,
  Menu,
  X,
  LogOut,
  Hexagon,
  Lock,
  ShieldAlert,
  Copy,
  Check,
} from 'lucide-react';

export const PortalLayout: React.FC = () => {
  const { user, loading, logout, loginWithDiscord } = useAuth();
  const { presence } = useVoiceAssistance();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const getAvatarUrl = (u: { avatar?: string; discordId: string }) => {
    if (u.avatar) {
      if (u.avatar.startsWith('http')) return u.avatar;
      const isGif = u.avatar.startsWith('a_');
      return `https://cdn.discordapp.com/avatars/${u.discordId}/${u.avatar}.${isGif ? 'gif' : 'png'}?size=128`;
    }
    try {
      const idx = Number(BigInt(u.discordId || '0') % 5n);
      return `https://cdn.discordapp.com/embed/avatars/${idx}.png`;
    } catch {
      return `https://cdn.discordapp.com/embed/avatars/0.png`;
    }
  };

  // 1. Session verification state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0d10] flex flex-col items-center justify-center font-mono-tech p-4">
        <div className="w-10 h-10 border-2 border-[#ccff00] border-t-transparent rounded-full animate-spin mb-4" />
        <div className="text-xs text-[#8a99ad] uppercase tracking-widest">
          &gt; JARVIS / VERIFYING SESSION...
        </div>
      </div>
    );
  }

  // 2. Strict Portal Authentication Gate: Without logging in, no one can access the portal
  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0d10] text-[#8a99ad] flex flex-col items-center justify-center p-4 sm:p-6 font-mono-tech relative overflow-hidden">
        {/* Background Radar Effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[500px] pointer-events-none opacity-20">
          <div className="radar-circles"></div>
        </div>

        <div className="relative z-10 max-w-md w-full bg-[#11161b] border border-[#1e262e] rounded p-8 sm:p-10 text-center space-y-6 shadow-2xl">
          {/* Lock Icon */}
          <div className="w-14 h-14 rounded bg-[#182028] border border-[#1e262e] mx-auto flex items-center justify-center text-[#ccff00]">
            <Lock className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0d1115] border border-[#1e262e] text-[10px] text-[#ccff00] uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ccff00] animate-pulse"></span>
              <span>SECURITY PROTOCOL / 401</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Portal Access Locked
            </h1>
            <p className="text-xs text-[#8a99ad] leading-relaxed">
              Without logging in, portal access is restricted. Connect your Discord account to view your control room, active nodes, billing trail, and support line.
            </p>
          </div>

          <div className="pt-2 space-y-3">
            <button
              onClick={loginWithDiscord}
              className="w-full py-3 rounded text-xs uppercase font-bold tracking-wider btn-lime flex items-center justify-center gap-2"
            >
              <span>Connect Discord &amp; Enter</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>

            <Link
              to="/"
              className="w-full py-2.5 rounded text-xs uppercase font-bold tracking-wider btn-outline-dark block text-center"
            >
              Back to Website
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. Strict Admin Gate: Only users with ADMIN role can access /admin
  if (location.pathname.startsWith('/admin') && user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-[#0a0d10] text-[#8a99ad] flex flex-col items-center justify-center p-6 font-mono-tech">
        <div className="max-w-md w-full bg-[#11161b] border border-red-500/30 rounded p-8 text-center space-y-5">
          <div className="w-12 h-12 rounded bg-red-500/10 border border-red-500/30 mx-auto flex items-center justify-center text-red-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="text-[10px] text-red-400 uppercase tracking-wider">403 FORBIDDEN</div>
            <h2 className="text-xl font-bold text-white">Administrator Access Required</h2>
            <p className="text-xs text-[#8a99ad] mt-2">
              Your Discord account (<strong className="text-white">{user.username}</strong>) does not have the administrator role in the JARVIS Guild.
            </p>
          </div>
          <div className="pt-2">
            <Link to="/portal" className="btn-lime px-5 py-2.5 rounded text-xs font-bold uppercase inline-block">
              Return to Customer Portal
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 4. Authorized Portal Navigation
  const navItems = [
    { label: 'Overview', path: '/portal', icon: LayoutDashboard },
    { label: 'Orders', path: '/portal/orders', icon: ShoppingCart },
    { label: 'Billing', path: '/portal/billing', icon: Receipt },
    { label: 'Servers', path: '/portal/servers', icon: Server },
    { label: 'Support', path: '/portal/support', icon: LifeBuoy },
    { label: 'Admin review', path: '/admin', icon: ShieldCheck, adminOnly: true },
  ];

  const filteredNavItems = navItems.filter((item) => !item.adminOnly || user?.role === 'ADMIN');
  const currentNavItem = navItems.find((item) => item.path === location.pathname) || {
    label: 'Overview',
  };

  return (
    <div className="min-h-screen bg-[#0a0d10] text-[#8a99ad] flex flex-col md:flex-row">
      {/* Mobile Top Header */}
      <div className="md:hidden sticky top-0 z-30 flex items-center justify-between h-14 px-4 bg-[#0d1115]/95 backdrop-blur border-b border-[#1e262e]">
        <Link to="/" className="flex items-center gap-2 text-white font-mono-tech font-bold text-sm">
          <Hexagon className="w-5 h-5 text-[#ccff00]" />
          <span>JARVIS / HOSTING</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono-tech px-2 py-0.5 rounded bg-[#131920] border border-[#1e262e] text-[#ccff00] uppercase">
            {currentNavItem.label}
          </span>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 text-white hover:bg-[#182028] rounded border border-[#1e262e] transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm md:hidden transition-opacity"
        />
      )}

      {/* Mobile Slide-over Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-[#0d1115] border-r border-[#1e262e] flex flex-col justify-between transform transition-transform duration-300 ease-out md:hidden ${
          mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Drawer Brand Header */}
          <div className="h-14 px-4 border-b border-[#1e262e] flex items-center justify-between">
            <Link
              to="/"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 text-white font-mono-tech font-bold text-sm"
            >
              <Hexagon className="w-5 h-5 text-[#ccff00]" />
              <span>JARVIS HOSTING /</span>
            </Link>
            <button
              onClick={() => setMobileOpen(false)}
              className="p-1.5 text-[#8a99ad] hover:text-white hover:bg-[#182028] rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Nav Links */}
          <nav className="p-3 space-y-1">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center justify-between px-3 py-3 rounded text-xs font-mono-tech transition-all ${
                    isActive
                      ? 'bg-[#131920] text-white border border-[#2d3844]'
                      : 'text-[#8a99ad] hover:text-white hover:bg-[#11161b]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#ccff00]' : 'text-[#5c6b73]'}`} />
                    <span>{item.label}</span>
                  </div>
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#ccff00]"></span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Mobile User Profile Footer */}
        <div className="p-3 border-t border-[#1e262e] bg-[#0a0d10]/60">
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                setMobileOpen(false);
                setProfileOpen(true);
              }}
              className="flex items-center gap-2.5 overflow-hidden text-left group flex-1 p-1.5 rounded hover:bg-[#131920] transition-colors"
            >
              <div className="relative shrink-0">
                <img
                  src={getAvatarUrl(user)}
                  alt={user.username}
                  className="w-8 h-8 rounded-full border border-[#2d3844] object-cover"
                  onError={(e) => {
                    const fallback = `https://cdn.discordapp.com/embed/avatars/0.png`;
                    if ((e.target as HTMLImageElement).src !== fallback) {
                      (e.target as HTMLImageElement).src = fallback;
                    }
                  }}
                />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#ccff00] border-2 border-[#0d1115]" />
              </div>
              <div className="overflow-hidden min-w-0 flex-1">
                <div className="text-xs font-mono-tech font-bold text-white truncate">
                  {user.username}
                </div>
                <div className="text-[10px] font-mono-tech text-[#5c6b73] truncate flex items-center gap-1.5">
                  <span className={user.role === 'ADMIN' ? 'text-amber-400 font-semibold' : 'text-[#8a99ad]'}>
                    {user.role}
                  </span>
                  <span>•</span>
                  <span>Profile</span>
                </div>
              </div>
            </button>

            <button
              onClick={logout}
              title="Logout"
              className="p-2 text-[#5c6b73] hover:text-red-400 hover:bg-[#11161b] rounded transition-colors shrink-0 ml-1"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Desktop Sidebar (Permanent, in-flow, sticky top-0) */}
      <aside className="hidden md:flex flex-col justify-between w-64 shrink-0 bg-[#0d1115] border-r border-[#1e262e] sticky top-0 h-screen z-30">
        <div>
          {/* Logo / Header */}
          <div className="h-16 px-5 border-b border-[#1e262e] flex items-center">
            <Link to="/" className="flex items-center gap-2 text-white font-mono-tech font-bold text-sm hover:text-[#ccff00] transition-colors">
              <Hexagon className="w-5 h-5 text-[#ccff00]" />
              <span>JARVIS HOSTING /</span>
            </Link>
          </div>

          {/* Navigation Items */}
          <nav className="p-3 space-y-1">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center justify-between px-3 py-2.5 rounded text-xs font-mono-tech transition-all ${
                    isActive
                      ? 'bg-[#131920] text-white border border-[#2d3844] shadow-sm'
                      : 'text-[#8a99ad] hover:text-white hover:bg-[#11161b]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#ccff00]' : 'text-[#5c6b73]'}`} />
                    <span className="tracking-wide">{item.label}</span>
                  </div>
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#ccff00]"></span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Profile Footer */}
        <div className="p-3 border-t border-[#1e262e] bg-[#0a0d10]/60">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setProfileOpen(true)}
              className="flex items-center gap-2.5 overflow-hidden text-left group flex-1 p-1.5 rounded hover:bg-[#131920] transition-colors"
              title="Click to view full profile"
            >
              <div className="relative shrink-0">
                <img
                  src={getAvatarUrl(user)}
                  alt={user.username}
                  className="w-8 h-8 rounded-full border border-[#2d3844] object-cover group-hover:border-[#ccff00] transition-colors"
                  onError={(e) => {
                    const fallback = `https://cdn.discordapp.com/embed/avatars/0.png`;
                    if ((e.target as HTMLImageElement).src !== fallback) {
                      (e.target as HTMLImageElement).src = fallback;
                    }
                  }}
                />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#ccff00] border-2 border-[#0d1115]"></span>
              </div>
              <div className="overflow-hidden min-w-0 flex-1">
                <div className="text-xs font-mono-tech font-bold text-white truncate group-hover:text-[#ccff00] transition-colors">
                  {user.username}
                </div>
                <div className="text-[10px] font-mono-tech text-[#5c6b73] truncate flex items-center gap-1.5">
                  <span className={user.role === 'ADMIN' ? 'text-amber-400 font-semibold' : 'text-[#8a99ad]'}>
                    {user.role}
                  </span>
                  <span>•</span>
                  <span className="text-[#3b4754] group-hover:text-[#8a99ad]">Profile</span>
                </div>
              </div>
            </button>

            <button
              onClick={logout}
              title="Logout"
              className="p-2 text-[#5c6b73] hover:text-red-400 hover:bg-[#11161b] rounded transition-colors shrink-0 ml-1"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Header Bar */}
        <header className="hidden md:flex h-16 border-b border-[#1e262e] bg-[#0d1115]/80 backdrop-blur-sm px-6 items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-2 text-xs font-mono-tech text-[#8a99ad]">
            <span className="text-[#5c6b73]">&gt;</span>
            <span className="text-[#5c6b73]">JARVIS / CUSTOMER</span>
            <span className="text-[#5c6b73]">&gt;</span>
            <span className="text-white uppercase font-semibold">{currentNavItem.label}</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-[10px] font-mono-tech tracking-wider">
              {presence.isAvailable ? (
                <span className="text-[#ccff00] flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#ccff00]/10 border border-[#ccff00]/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ccff00] animate-pulse"></span>
                  <span>VOICE ASSIST ONLINE ({presence.onlineAdminsCount})</span>
                </span>
              ) : (
                <span className="text-[#5c6b73] flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#11161b] border border-[#1e262e]">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  <span>VOICE ASSIST STANDBY</span>
                </span>
              )}
            </div>
            <Link
              to="/"
              className="text-xs font-mono-tech text-[#8a99ad] hover:text-[#ccff00] flex items-center gap-1 transition-colors px-2 py-1 rounded hover:bg-[#11161b]"
            >
              <span>Back to website</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* User Profile Modal */}
      {profileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-[#11161b] border border-[#2d3844] rounded-lg shadow-2xl p-6 font-mono-tech space-y-6">
            <div className="flex items-center justify-between border-b border-[#1e262e] pb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#ccff00]" />
                <span className="text-sm font-bold text-white uppercase tracking-wider">User Identity & Profile</span>
              </div>
              <button
                onClick={() => setProfileOpen(false)}
                className="p-1.5 text-[#5c6b73] hover:text-white hover:bg-[#182028] rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Profile Info Card */}
            <div className="flex items-center gap-4 bg-[#0d1115] border border-[#1e262e] p-4 rounded">
              <div className="relative">
                <img
                  src={getAvatarUrl(user)}
                  alt={user.username}
                  className="w-16 h-16 rounded-full border-2 border-[#ccff00] object-cover"
                  onError={(e) => {
                    const fallback = `https://cdn.discordapp.com/embed/avatars/0.png`;
                    if ((e.target as HTMLImageElement).src !== fallback) {
                      (e.target as HTMLImageElement).src = fallback;
                    }
                  }}
                />
                <span className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full bg-[#ccff00] border-2 border-[#0d1115]" title="Online" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-bold text-white truncate">{user.username}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-0.5 text-[10px] rounded font-bold uppercase tracking-wider ${
                    user.role === 'ADMIN' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  }`}>
                    {user.role}
                  </span>
                  <span className="text-[10px] text-[#5c6b73]">Discord Verified</span>
                </div>
              </div>
            </div>

            {/* Account Details */}
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-3 bg-[#0d1115] border border-[#1e262e] rounded">
                <span className="text-[#8a99ad]">Discord ID</span>
                <div className="flex items-center gap-2">
                  <span className="text-white font-mono">{user.discordId}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(user.discordId);
                      setCopiedId(true);
                      setTimeout(() => setCopiedId(false), 2000);
                    }}
                    className="p-1 text-[#8a99ad] hover:text-[#ccff00] transition-colors"
                    title="Copy Discord ID"
                  >
                    {copiedId ? <Check className="w-3.5 h-3.5 text-[#ccff00]" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {user.email && (
                <div className="flex items-center justify-between p-3 bg-[#0d1115] border border-[#1e262e] rounded">
                  <span className="text-[#8a99ad]">Email</span>
                  <span className="text-white">{user.email}</span>
                </div>
              )}

              <div className="flex items-center justify-between p-3 bg-[#0d1115] border border-[#1e262e] rounded">
                <span className="text-[#8a99ad]">Access Level</span>
                <span className="text-[#ccff00] font-bold uppercase">{user.role === 'ADMIN' ? 'System Administrator' : 'Verified Client'}</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={logout}
                className="flex-1 py-2.5 rounded text-xs font-bold uppercase tracking-wider text-red-400 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
              <button
                onClick={() => setProfileOpen(false)}
                className="flex-1 py-2.5 rounded text-xs font-bold uppercase tracking-wider text-white bg-[#1a212a] border border-[#2d3844] hover:border-[#ccff00] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
