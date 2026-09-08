import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowUpRight, Hexagon, Shield, LogIn } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, loginWithDiscord } = useAuth();
  const location = useLocation();

  // If in portal, Navbar is handled by PortalLayout
  if (location.pathname.startsWith('/portal') || location.pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 bg-[#0a0d10]/90 backdrop-blur-md border-b border-[#1e262e]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded bg-[#11161b] border border-[#1e262e] flex items-center justify-center text-[#ccff00] group-hover:border-[#ccff00] transition-colors">
            <Hexagon className="w-5 h-5 fill-[#ccff00]/10" />
          </div>
          <div className="flex items-baseline gap-1 font-mono-tech tracking-wider text-sm font-bold text-white">
            JARVIS HOSTING <span className="text-[#ccff00]">/</span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-mono-tech uppercase tracking-widest text-[#8a99ad]">
          <a href="/#infrastructure" className="hover:text-white transition-colors">
            Infrastructure
          </a>
          <a href="/#plans" className="hover:text-white transition-colors">
            Packs
          </a>
          <a href="/#process" className="hover:text-white transition-colors">
            Process
          </a>
          <Link to="/portal" className="hover:text-white transition-colors">
            Portal
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {user?.role === 'ADMIN' && (
            <Link
              to="/admin"
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono-tech uppercase bg-red-500/10 border border-red-500/30 text-red-400 rounded hover:bg-red-500/20"
            >
              <Shield className="w-3.5 h-3.5" />
              Admin
            </Link>
          )}

          {user ? (
            <Link
              to="/portal"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded text-xs font-mono-tech uppercase tracking-wider font-semibold bg-[#11161b] border border-[#2d3844] text-white hover:border-[#ccff00] hover:text-[#ccff00] transition-all"
            >
              <span>{user.username}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={loginWithDiscord}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono-tech uppercase tracking-wider text-[#8a99ad] hover:text-white hover:bg-[#11161b] border border-transparent hover:border-[#1e262e] transition-all"
              >
                <LogIn className="w-3.5 h-3.5" />
                Discord
              </button>
              <Link
                to="/portal"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded text-xs font-mono-tech uppercase tracking-wider font-semibold bg-[#11161b] border border-[#2d3844] text-white hover:border-[#ccff00] hover:text-[#ccff00] transition-all"
              >
                <span>Open Portal</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-[#ccff00]" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
