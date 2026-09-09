import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { PortalLayout } from './components/PortalLayout';

// Pages
import { Landing } from './pages/Landing';
import { Checkout } from './pages/Checkout';
import { PortalOverview } from './pages/Portal/PortalOverview';
import { PortalOrders } from './pages/Portal/PortalOrders';
import { PortalBilling } from './pages/Portal/PortalBilling';
import { PortalServers } from './pages/Portal/PortalServers';
import { PortalSupport } from './pages/Portal/PortalSupport';
import { AdminDashboard } from './pages/Admin/AdminDashboard';
import { NotFound } from './pages/NotFound';

import { VoiceAssistanceProvider } from './context/VoiceAssistanceContext';
import { FloatingVoiceAssist } from './components/FloatingVoiceAssist';

export const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <VoiceAssistanceProvider>
          <div className="flex flex-col min-h-screen bg-[#0a0d10] text-white selection:bg-[#ccff00] selection:text-black">
            <Navbar />
            <div className="flex-1 flex flex-col">
              <Routes>
                {/* Marketing Landing */}
                <Route path="/" element={<Landing />} />
                <Route path="/plans" element={<Navigate to="/#plans" replace />} />
                
                {/* Checkout with UPI Pay Kit */}
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/checkout/:orderId" element={<Checkout />} />

                {/* Redirect old dashboard path to portal */}
                <Route path="/dashboard" element={<Navigate to="/portal" replace />} />

                {/* Portal Shell & Sub-routes */}
                <Route path="/portal" element={<PortalLayout />}>
                  <Route index element={<PortalOverview />} />
                  <Route path="orders" element={<PortalOrders />} />
                  <Route path="billing" element={<PortalBilling />} />
                  <Route path="servers" element={<PortalServers />} />
                  <Route path="support" element={<PortalSupport />} />
                </Route>

                {/* Admin Portal */}
                <Route path="/admin" element={<PortalLayout />}>
                  <Route index element={<AdminDashboard />} />
                </Route>

                {/* 404 Not Found */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
            {/* Global Voice Assist Click-to-Call Floating Widget */}
            <FloatingVoiceAssist />
          </div>
        </VoiceAssistanceProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
