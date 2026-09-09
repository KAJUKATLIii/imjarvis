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
  Headphones,
} from 'lucide-react';

const AvatarImage: React.FC<{
  user: { username: string; discordId: string; avatar?: string };
  sizeClass?: string;
  className?: string;
}> = ({ user, sizeClass = 'w-8 h-8', className = '' }) => {
  const [error, setError] = useState(false);

  if (error || !user.discordId) {
    return (
      <div
        className={`${sizeClass} rounded-full bg-[#182028] border border-[#2d3844] flex items-center justify-center text-[#ccff00] font-bold shrink-0 font-mono-tech ${className}`}
      >
        {user.username ? user.username.charAt(0).toUpperCase() : '?'}
      </div>
    );
  }

  return (
    <img
      src={`/api/auth/avatar/${user.discordId}`}
      alt=""
      className={`${sizeClass} rounded-full border border-[#2d3844] object-cover shrink-0 ${className}`}
      onError={() => setError(true)}
    />
  );
};

export const PortalLayout: React.FC = () => {
  const { user, loading, logout, loginWithDiscord } = useAuth();
  const { presence, startDirectVoiceCall } = useVoiceAssistance();
  const location = useLocation();
  const [navOpen, setNavOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  // Close navigation on route change
  React.useEffect(() => {
    setNavOpen(false);
  }, [location.pathname]);

  // Close navigation or modal on Escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setNavOpen(false);
        setProfileOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
    <div className="min-h-screen bg-[#0a0d10] text-[#8a99ad] flex flex-col">
      {/* Universal Top Header Bar (Both Desktop & Mobile) */}
      <header className="sticky top-0 z-30 h-16 border-b border-[#1e262e] bg-[#0d1115]/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Menu Toggle Button (Open & Close like mobile on all screens) */}
          <button
            onClick={() => setNavOpen(!navOpen)}
            className="p-2 text-white hover:text-[#ccff00] bg-[#11161b] hover:bg-[#182028] rounded border border-[#1e262e] hover:border-[#ccff00]/40 transition-all flex items-center gap-2 group shadow-sm"
            aria-label="Toggle navigation"
            title={navOpen ? 'Close navigation' : 'Open navigation'}
          >
            {navOpen ? <X className="w-5 h-5 text-[#ccff00]" /> : <Menu className="w-5 h-5 group-hover:text-[#ccff00] transition-colors" />}
            <span className="hidden sm:inline text-xs font-mono-tech uppercase tracking-wider font-semibold">
              Menu
            </span>
          </button>

          {/* Logo / Brand */}
          <Link to="/" className="flex items-center gap-2 text-white font-mono-tech font-bold text-sm hover:text-[#ccff00] transition-colors ml-1 sm:ml-2">
            <Hexagon className="w-5 h-5 text-[#ccff00]" />
            <span className="hidden xs:inline">JARVIS HOSTING</span>
            <span className="text-[#5c6b73]">/</span>
          </Link>

          {/* Current Page Tag */}
          <span className="text-[11px] font-mono-tech px-2.5 py-1 rounded bg-[#131920] border border-[#1e262e] text-[#ccff00] uppercase tracking-wider font-semibold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ccff00] animate-pulse"></span>
            <span>{currentNavItem.label}</span>
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Voice Assist Click-to-Call Action Button */}
          <button
            onClick={() => startDirectVoiceCall(user ? `Direct Assist • @${user.username}` : 'Direct Voice Assist')}
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-full font-mono-tech text-[10px] sm:text-[11px] tracking-wider transition-all duration-200 cursor-pointer shadow-sm hover:scale-[1.03] ${
              presence.isAvailable
                ? 'bg-[#ccff00]/10 hover:bg-[#ccff00]/20 border border-[#ccff00]/40 text-[#ccff00] hover:shadow-[0_0_15px_rgba(204,255,0,0.3)]'
                : 'bg-[#11161b] hover:bg-[#182028] border border-[#1e262e] hover:border-[#ccff00]/40 text-[#8a99ad] hover:text-white'
            }`}
            title={`Click to start instant live voice call with ${presence.isAvailable ? `${presence.onlineAdminsCount} active operators` : 'standby support'}`}
          >
            <div className="relative flex items-center justify-center">
              <Headphones className="w-3.5 h-3.5" />
              <span className={`absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full ${presence.isAvailable ? 'bg-[#ccff00] animate-ping' : 'bg-amber-400'}`} />
            </div>
            <span className="hidden sm:inline font-bold">
              {presence.isAvailable ? `VOICE CALL (${presence.onlineAdminsCount})` : 'VOICE ASSIST CALL'}
            </span>
            <span className="sm:hidden font-bold text-[10px]">
              CALL
            </span>
          </button>

          {/* Back to website */}
          <Link
            to="/"
            className="hidden md:flex text-xs font-mono-tech text-[#8a99ad] hover:text-[#ccff00] items-center gap-1 transition-colors px-2.5 py-1.5 rounded hover:bg-[#11161b]"
          >
            <span>Back to website</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>

          {/* User Profile Quick Access */}
          <button
            onClick={() => setProfileOpen(true)}
            className="flex items-center gap-2 p-1.5 rounded hover:bg-[#131920] border border-transparent hover:border-[#1e262e] transition-colors"
            title="View full profile"
          >
            <div className="relative shrink-0">
              <AvatarImage user={user} sizeClass="w-8 h-8" />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#ccff00] border-2 border-[#0d1115]"></span>
            </div>
            <span className="hidden md:inline text-xs font-mono-tech font-bold text-white max-w-[120px] truncate">
              {user.username}
            </span>
          </button>
        </div>
      </header>

      {/* Backdrop */}
      {navOpen && (
        <div
          onClick={() => setNavOpen(false)}
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm transition-opacity"
        />
      )}

      {/* Slide-over Drawer Navbar (Opens and closes on desktop and mobile) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 sm:w-80 bg-[#0d1115] border-r border-[#1e262e] flex flex-col justify-between transform transition-transform duration-300 ease-out shadow-2xl ${
          navOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Drawer Header */}
          <div className="h-16 px-5 border-b border-[#1e262e] flex items-center justify-between bg-[#0a0d10]/60">
            <Link
              to="/"
              onClick={() => setNavOpen(false)}
              className="flex items-center gap-2.5 text-white font-mono-tech font-bold text-sm hover:text-[#ccff00] transition-colors"
            >
              <div className="w-8 h-8 rounded bg-[#11161b] border border-[#1e262e] flex items-center justify-center text-[#ccff00]">
                <Hexagon className="w-5 h-5 text-[#ccff00]" />
              </div>
              <span>JARVIS HOSTING /</span>
            </Link>
            <button
              onClick={() => setNavOpen(false)}
              className="p-1.5 text-[#8a99ad] hover:text-white hover:bg-[#182028] rounded border border-transparent hover:border-[#1e262e] transition-colors"
              aria-label="Close navigation"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="p-4 space-y-1.5">
            <div className="text-[10px] font-mono-tech uppercase tracking-widest text-[#5c6b73] px-3 py-1">
              Navigation
            </div>
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setNavOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-3 rounded text-xs font-mono-tech transition-all ${
                    isActive
                      ? 'bg-[#131920] text-white border border-[#2d3844] shadow-sm'
                      : 'text-[#8a99ad] hover:text-white hover:bg-[#11161b]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#ccff00]' : 'text-[#5c6b73]'}`} />
                    <span className="tracking-wide font-medium">{item.label}</span>
                  </div>
                  {isActive && (
                    <span className="w-2 h-2 rounded-full bg-[#ccff00] shadow-[0_0_8px_#ccff00]"></span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Drawer User Profile Footer */}
        <div className="p-4 border-t border-[#1e262e] bg-[#0a0d10]/80">
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                setNavOpen(false);
                setProfileOpen(true);
              }}
              className="flex items-center gap-3 overflow-hidden text-left group flex-1 p-2 rounded hover:bg-[#131920] transition-colors"
            >
              <div className="relative shrink-0">
                <AvatarImage user={user} sizeClass="w-9 h-9" />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#ccff00] border-2 border-[#0d1115]" />
              </div>
              <div className="overflow-hidden min-w-0 flex-1">
                <div className="text-xs font-mono-tech font-bold text-white truncate group-hover:text-[#ccff00] transition-colors">
                  {user.username}
                </div>
                <div className="text-[10px] font-mono-tech text-[#5c6b73] truncate flex items-center gap-1.5 mt-0.5">
                  <span className={user.role === 'ADMIN' ? 'text-amber-400 font-semibold' : 'text-[#8a99ad]'}>
                    {user.role}
                  </span>
                  <span>•</span>
                  <span className="text-[#8a99ad] group-hover:text-white">Profile</span>
                </div>
              </div>
            </button>

            <button
              onClick={logout}
              title="Logout"
              className="p-2 text-[#5c6b73] hover:text-red-400 hover:bg-[#11161b] rounded transition-colors shrink-0 ml-1 border border-transparent hover:border-red-500/30"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
        <Outlet />
      </main>

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
                <AvatarImage user={user} sizeClass="w-16 h-16" className="border-2 border-[#ccff00]" />
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
