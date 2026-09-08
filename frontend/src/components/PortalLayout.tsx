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
} from 'lucide-react';

export const PortalLayout: React.FC = () => {
  const { user, loading, logout, loginWithDiscord } = useAuth();
  const { presence } = useVoiceAssistance();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

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
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-[#11161b] border-b border-[#1e262e]">
        <Link to="/" className="flex items-center gap-2 text-white font-mono-tech font-bold text-sm">
          <Hexagon className="w-5 h-5 text-[#ccff00]" />
          <span>JARVIS / HOSTING</span>
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 text-white hover:bg-[#182028] rounded border border-[#1e262e]"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Left Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#0d1115] border-r border-[#1e262e] flex flex-col justify-between transform transition-transform duration-200 md:translate-x-0 md:static ${
          mobileOpen ? 'translate-x-0' : '-translate-x-64'
        }`}
      >
        <div>
          {/* Logo / Header */}
          <div className="p-5 border-b border-[#1e262e]">
            <Link to="/" className="flex items-center gap-2 text-white font-mono-tech font-bold text-sm">
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
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded text-xs font-mono-tech transition-colors ${
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

        {/* User Profile Footer */}
        <div className="p-4 border-t border-[#1e262e]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              {user.avatar ? (
                <img
                  src={`https://cdn.discordapp.com/avatars/${user.discordId}/${user.avatar}.png`}
                  alt=""
                  className="w-7 h-7 rounded-full border border-[#1e262e] shrink-0"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-[#182028] border border-[#1e262e] flex items-center justify-center text-[#ccff00] text-xs font-bold shrink-0">
                  {user.username.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="overflow-hidden">
                <div className="text-xs font-mono-tech font-bold text-white truncate">
                  {user.username}
                </div>
                <div className="text-[10px] font-mono-tech text-[#5c6b73] truncate">
                  {user.role}
                </div>
              </div>
            </div>

            <button
              onClick={logout}
              title="Logout"
              className="p-1.5 text-[#5c6b73] hover:text-red-400 hover:bg-[#11161b] rounded transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="h-14 border-b border-[#1e262e] bg-[#0d1115]/80 backdrop-blur-sm px-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono-tech text-[#8a99ad]">
            <span className="text-[#5c6b73]">&gt;</span>
            <span className="text-[#5c6b73]">JARVIS / CUSTOMER</span>
            <span className="text-[#5c6b73]">&gt;</span>
            <span className="text-white uppercase font-semibold">{currentNavItem.label}</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-[10px] font-mono-tech tracking-wider">
              {presence.isAvailable ? (
                <span className="text-[#ccff00] flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#ccff00]/10 border border-[#ccff00]/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ccff00] animate-pulse"></span>
                  <span>VOICE ASSIST ONLINE ({presence.onlineAdminsCount})</span>
                </span>
              ) : (
                <span className="text-[#5c6b73] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  <span>VOICE ASSIST STANDBY</span>
                </span>
              )}
            </div>
            <Link
              to="/"
              className="text-xs font-mono-tech text-[#8a99ad] hover:text-[#ccff00] flex items-center gap-1 transition-colors"
            >
              <span>Back to website</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
