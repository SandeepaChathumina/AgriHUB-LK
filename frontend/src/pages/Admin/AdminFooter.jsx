// src/components/AdminFooter.jsx

import React from "react";
import { Link } from "react-router-dom";

const AdminFooter = () => {
  return (
    <footer
      role="contentinfo"
      style={{
        background: "linear-gradient(160deg, #0f3d2e 0%, #0a2e22 60%, #071f18 100%)",
        fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
      }}
      className="mt-auto border-t border-emerald-900/30"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        {/* Main Footer Content */}
        <div className="flex flex-col lg:flex-row justify-between gap-12 lg:gap-8">
          
          {/* Brand Section - Restricted width to prevent stretching */}
          <div className="flex flex-col items-start lg:max-w-[320px] xl:max-w-sm">
            <div className="flex items-center gap-3 mb-5">
              <div
                style={{ background: "linear-gradient(135deg, #34d399, #059669)" }}
                className="flex h-10 w-10 items-center justify-center rounded-xl shadow-lg shadow-emerald-900/40 text-sm font-bold text-white transition-transform duration-200 hover:scale-105"
                aria-label="AgriHUB Logo"
              >
                A
              </div>
              <span className="text-white font-bold text-xl tracking-tight">
                AgriHUB<span className="text-emerald-300">.LK</span>
              </span>
            </div>
            
            <span className="text-emerald-300 uppercase font-bold text-[10px] mb-4 bg-emerald-900/40 px-3 py-1 rounded-full inline-flex items-center gap-1 border border-emerald-800/50 tracking-wide">
              SDG Zero Hunger Initiative
            </span>
            
            <p className="text-slate-400 text-sm leading-relaxed mb-8">
              Empowering Sri Lankan agricultural trade through a unified digital
              ecosystem for Farmers, Distributors &amp; Transporters.
            </p>
            
            {/* Live Operational Status */}
            <div className="flex items-center gap-2.5 bg-black/20 px-4 py-2 rounded-full border border-white/5 backdrop-blur-sm">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-emerald-300 text-[11px] font-semibold tracking-wide">
                Admin Console · Operational
              </span>
            </div>
          </div>

          {/* Links Section - Flex grouping to space them evenly on the right */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-10 sm:gap-12 lg:gap-16 xl:gap-24 pt-2 lg:pt-0">
            
            {/* Administration Links */}
            <div>
              <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-6">
                Administration
              </h4>
              <ul className="space-y-4">
                {[
                  { to: "/admin-dashboard", label: "Dashboard Overview" },
                  { to: "/admin/users", label: "User Management" },
                  { to: "/admin/reviews", label: "Review Moderation" },
                ].map(({ to, label }) => (
                  <li key={to}>
                    <Link
                      to={to}
                      className="text-slate-400 text-[13px] transition-all duration-200 hover:text-emerald-400 hover:translate-x-1 inline-block focus:outline-none focus:ring-2 focus:ring-emerald-500/50 rounded-sm"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Platform Operations Links */}
            <div>
              <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-6">
                Operations
              </h4>
              <ul className="space-y-4">
                {[
                  { to: "/admin/notifications", label: "Manage Notifications" },
                   { to: "/admin/impact", label: "Impact Analytics" },
                ].map(({ to, label }) => (
                  <li key={to}>
                    <Link
                      to={to}
                      className="text-slate-400 text-[13px] transition-all duration-200 hover:text-emerald-400 hover:translate-x-1 inline-block focus:outline-none focus:ring-2 focus:ring-emerald-500/50 rounded-sm"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Security & Account Links */}
            <div>
              <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-6">
                Security
              </h4>
              <ul className="space-y-4">
                {[
                  { to: "/profile", label: "Admin Profile" },
                  { to: "/admin/notifications", label: "System Alerts" },
                ].map(({ to, label }) => (
                  <li key={to}>
                    <Link
                      to={to}
                      className="text-slate-400 text-[13px] transition-all duration-200 hover:text-emerald-400 hover:translate-x-1 inline-block focus:outline-none focus:ring-2 focus:ring-emerald-500/50 rounded-sm"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
        </div>

        {/* Bottom Legal & Copyright Section */}
        <div className="mt-16 pt-8 border-t border-emerald-900/50 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-sm text-center md:text-left">
            © {new Date().getFullYear()} AgriHUB.LK. All rights reserved.
          </p>
          <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-4">
            {[
              { to: "/privacy", label: "Privacy Policy" },
              { to: "/terms", label: "Terms of Service" },
            ].map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className="text-slate-500 text-sm transition-colors duration-200 hover:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 rounded-sm"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default AdminFooter;