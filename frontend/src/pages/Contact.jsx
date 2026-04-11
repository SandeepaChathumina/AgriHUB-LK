import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

const Contact = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [visibleSections, setVisibleSections] = useState({});
  const sectionRefs = useRef({});

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => ({ ...prev, [entry.target.id]: true }));
          }
        });
      },
      { threshold: 0.12 }
    );
    Object.values(sectionRefs.current).forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const setRef = (id) => (el) => { sectionRefs.current[id] = el; };

  const contactInfo = [
    {
      title: "Email Us",
      value: "support@agrihub.lk",
      description: "For general questions, support, and partnership inquiries.",
      accent: "#16a34a",
      lightBg: "#f0fdf4",
      border: "#bbf7d0",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 7l10 7 10-7"/>
        </svg>
      ),
    },
    {
      title: "Call Us",
      value: "+94 71 234 5678",
      description: "Reach us during working hours for direct assistance.",
      accent: "#0284c7",
      lightBg: "#f0f9ff",
      border: "#bae6fd",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
        </svg>
      ),
    },
    {
      title: "Visit Us",
      value: "Colombo, Sri Lanka",
      description: "Connecting agricultural communities across the country.",
      accent: "#d97706",
      lightBg: "#fffbeb",
      border: "#fde68a",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
        </svg>
      ),
    },
  ];

  const supportItems = [
    "Account and registration assistance",
    "Marketplace and platform usage support",
    "Business and partnership inquiries",
    "General questions and feedback",
  ];

  return (
    <div className="w-full font-sans bg-white text-gray-900 overflow-x-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=Fraunces:ital,wght@0,700;0,900;1,700&display=swap');

        * { box-sizing: border-box; }
        body { font-family: 'Plus Jakarta Sans', sans-serif; }

        /* Fade up — same as homepage */
        .fade-up {
          opacity: 0;
          transform: translateY(40px);
          transition: opacity 0.7s ease, transform 0.7s ease;
        }
        .fade-up.visible { opacity: 1; transform: translateY(0); }
        .fade-up.delay-1 { transition-delay: 0.1s; }
        .fade-up.delay-2 { transition-delay: 0.2s; }
        .fade-up.delay-3 { transition-delay: 0.3s; }

        /* Hero entrance */
        @keyframes heroIn {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        .hero-badge  { animation: heroIn 0.9s cubic-bezier(0.16,1,0.3,1) 0s    both; }
        .hero-title  { animation: heroIn 0.9s cubic-bezier(0.16,1,0.3,1) 0.2s  both; }
        .hero-sub    { animation: heroIn 0.9s cubic-bezier(0.16,1,0.3,1) 0.4s  both; }

        /* Nav blur */
        .nav-scrolled {
          background: rgba(255,255,255,0.95);
          backdrop-filter: blur(16px);
          box-shadow: 0 1px 0 rgba(0,0,0,0.06), 0 4px 24px rgba(0,0,0,0.05);
        }

        /* Pulsing dot */
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50%       { transform: scale(1.5); opacity: 0.5; }
        }
        .pulse-dot { animation: pulse 2s ease-in-out infinite; }

        /* Mobile menu */
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to   { opacity: 1; transform: translateY(0);     }
        }
        .mobile-menu { animation: slideDown 0.25s ease; }

        /* Underline grow — same as homepage nav */
        .underline-grow { position: relative; }
        .underline-grow::after {
          content: '';
          position: absolute;
          bottom: -4px; left: 0;
          width: 0; height: 3px;
          background: #16a34a;
          border-radius: 2px;
          transition: width 0.3s ease;
        }
        .underline-grow:hover::after { width: 100%; }

        /* Contact info card hover */
        .contact-card {
          transition: transform 0.4s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.4s ease, border-color 0.3s ease;
        }
        .contact-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 24px 56px rgba(22,163,74,0.12);
        }

        /* Input focus ring */
        .form-input {
          width: 100%;
          border-radius: 16px;
          background: #f9fafb;
          border: 1.5px solid #e5e7eb;
          padding: 14px 20px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 14px;
          color: #111827;
          outline: none;
          transition: border-color 0.25s, box-shadow 0.25s, background 0.25s;
        }
        .form-input::placeholder { color: #9ca3af; }
        .form-input:focus {
          border-color: #16a34a;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(22,163,74,0.1);
        }

        /* Shimmer for CTA — same as homepage */
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }

        /* Green mesh — same as homepage feature section */
        .green-mesh {
          background:
            radial-gradient(ellipse 80% 60% at 20% 40%, rgba(187,247,208,0.5) 0%, transparent 60%),
            radial-gradient(ellipse 60% 80% at 80% 20%, rgba(187,247,208,0.35) 0%, transparent 60%),
            radial-gradient(ellipse 50% 50% at 50% 80%, rgba(209,250,229,0.3) 0%, transparent 60%),
            #f0fdf4;
        }

        /* Support list item */
        .support-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 14px 0;
          border-bottom: 1px solid #f1f5f9;
          font-size: 14px;
          color: #475569;
          font-weight: 500;
          transition: color 0.2s;
        }
        .support-item:last-child { border-bottom: none; }
        .support-item:hover { color: #15803d; }
        .support-check {
          width: 20px; height: 20px;
          border-radius: 50%;
          background: #f0fdf4;
          border: 1.5px solid #bbf7d0;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          margin-top: 1px;
        }
      `}</style>

      {/* ═══════════════════════════════ NAVBAR (identical to homepage) */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled ? "nav-scrolled py-3" : "py-5 bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-8 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 bg-green-600 rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
                <path d="M17 8C8 10 5.9 16.17 3.82 19.41A1 1 0 005.12 21C7 19.43 11.4 17 21 17c-1.5-2-3-5-4-9z" />
              </svg>
            </div>
            <span
              style={{ fontFamily: "'Fraunces', serif" }}
              className={`text-2xl font-black tracking-tight transition-colors duration-500 ${scrolled ? "text-gray-900" : "text-white"}`}
            >
              AgriHUB<span className={scrolled ? "text-green-600" : "text-green-400"}>.LK</span>
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            {[
              { to: "/products", label: "Marketplace" },
              { to: "/about",    label: "Our Mission" },
              { to: "/contact",  label: "Contact"     },
            ].map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`underline-grow font-semibold transition-colors text-sm ${
                  link.to === "/contact"
                    ? scrolled ? "text-green-700" : "text-green-400"
                    : scrolled ? "text-gray-700 hover:text-green-700" : "text-white/90 hover:text-green-400"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop auth */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/login"
              className={`px-5 py-2 text-sm font-semibold rounded-full transition-all duration-300 ${
                scrolled
                  ? "text-gray-700 border border-gray-200 hover:border-green-400 hover:text-green-700"
                  : "text-white border border-white/30 hover:bg-white/15"
              }`}
            >
              Login
            </Link>
            <Link
              to="/register"
              className="px-5 py-2 text-sm font-bold text-white bg-green-600 rounded-full hover:bg-green-700 hover:shadow-lg hover:shadow-green-200 hover:-translate-y-0.5 transition-all duration-300"
            >
              Join Free
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden w-10 h-10 flex flex-col items-center justify-center gap-1.5 rounded-xl hover:bg-white/10 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className={`block w-5 h-0.5 rounded transition-all ${mobileMenuOpen ? "rotate-45 translate-y-2" : ""} ${scrolled ? "bg-gray-800" : "bg-white"}`} />
            <span className={`block w-5 h-0.5 rounded transition-all ${mobileMenuOpen ? "opacity-0" : ""} ${scrolled ? "bg-gray-800" : "bg-white"}`} />
            <span className={`block w-5 h-0.5 rounded transition-all ${mobileMenuOpen ? "-rotate-45 -translate-y-2" : ""} ${scrolled ? "bg-gray-800" : "bg-white"}`} />
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="mobile-menu md:hidden bg-white border-t border-gray-100 px-6 py-4 space-y-3 shadow-xl">
            {[{ to: "/products", label: "Marketplace" }, { to: "/about", label: "Our Mission" }, { to: "/contact", label: "Contact" }].map((link) => (
              <Link key={link.to} to={link.to} className="block py-2 text-gray-700 font-semibold hover:text-green-600">{link.label}</Link>
            ))}
            <div className="flex gap-3 pt-2">
              <Link to="/login" className="flex-1 text-center py-2.5 border border-gray-200 rounded-xl font-semibold text-gray-700 hover:border-green-400">Login</Link>
              <Link to="/register" className="flex-1 text-center py-2.5 bg-green-600 rounded-xl font-bold text-white hover:bg-green-700">Join Free</Link>
            </div>
          </div>
        )}
      </nav>

      {/* ═══════════════════════════════ HERO — same structure as homepage */}
      <section className="relative min-h-[60vh] w-full overflow-hidden bg-black">
        {/* Reuse homepage's green-mesh feel but darker for visual interest */}
        <div className="absolute inset-0 z-0">
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 80% 60% at 10% 30%, rgba(22,163,74,0.35) 0%, transparent 55%)," +
                "radial-gradient(ellipse 60% 70% at 90% 70%, rgba(2,132,199,0.2) 0%, transparent 55%)," +
                "radial-gradient(ellipse 50% 50% at 50% 100%, rgba(15,118,110,0.2) 0%, transparent 60%)," +
                "linear-gradient(160deg, #052e16 0%, #0c1a0e 50%, #0c1a20 100%)",
            }}
          />
          {/* Grain texture — same as homepage */}
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`,
            }}
          />
        </div>

        {/* Floating leaf decorations — same as homepage */}
        <div className="absolute top-32 left-16 w-8 h-8 text-green-400/30 pointer-events-none" style={{ animation: "float 7s ease-in-out infinite" }}>
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17 8C8 10 5.9 16.17 3.82 19.41A1 1 0 005.12 21C7 19.43 11.4 17 21 17c-1.5-2-3-5-4-9z" /></svg>
        </div>
        <div className="absolute top-48 right-20 w-6 h-6 text-green-400/20 pointer-events-none" style={{ animation: "float 9s ease-in-out infinite 1.5s" }}>
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17 8C8 10 5.9 16.17 3.82 19.41A1 1 0 005.12 21C7 19.43 11.4 17 21 17c-1.5-2-3-5-4-9z" /></svg>
        </div>

        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0) rotate(0deg); }
            33%  { transform: translateY(-14px) rotate(3deg); }
            66%  { transform: translateY(-7px) rotate(-2deg); }
          }
        `}</style>

        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-8 pt-44 pb-24 flex flex-col items-center text-center">
          {/* Badge — same pill style as homepage */}
          <div className="hero-badge inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/25 rounded-full px-4 py-2 mb-8">
            <span className="w-2 h-2 bg-green-400 rounded-full pulse-dot" />
            <span className="text-xs font-bold text-white uppercase tracking-widest">Contact AGRIHUB-LK</span>
          </div>

          <h1
            className="hero-title text-5xl md:text-7xl font-black text-white leading-[1.05] mb-6 max-w-4xl drop-shadow-xl"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            Let's <span className="text-green-400">Connect</span>
          </h1>

          <p className="hero-sub max-w-2xl text-lg md:text-xl text-white/75 mb-10 leading-relaxed font-medium">
            Have questions, ideas, or partnership inquiries? We'd love to hear from you.
            Reach out and let's build a stronger{" "}
            <span className="text-green-300 font-bold">agricultural network</span> together.
          </p>

          {/* Scroll indicator — identical to homepage */}
          <div className="flex flex-col items-center gap-2 opacity-50" style={{ animation: "scrollBounce 1.8s ease-in-out infinite" }}>
            <span className="text-xs font-semibold text-white/70 uppercase tracking-widest">Scroll</span>
            <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          <style>{`
            @keyframes scrollBounce {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(8px); }
            }
          `}</style>
        </div>
      </section>

      {/* ═══════════════════════════════ CONTACT INFO CARDS */}
      <section
        id="contact-cards"
        ref={setRef("contact-cards")}
        className="max-w-7xl mx-auto px-6 md:px-8 py-20"
      >
        {/* Section header — same badge + Fraunces heading style */}
        <div className={`text-center mb-14 fade-up ${visibleSections["contact-cards"] ? "visible" : ""}`}>
          <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-4 py-1.5 mb-5">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
            <span className="text-xs font-bold text-green-700 uppercase tracking-widest">Get In Touch</span>
          </div>
          <h2
            className="text-4xl md:text-5xl font-black text-gray-900 mb-4"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            Three Ways to <span className="text-green-600">Reach Us</span>
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto text-lg leading-relaxed">
            Choose whichever channel works best for you — we're always happy to help.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {contactInfo.map((item, i) => (
            <div
              key={i}
              className={`contact-card fade-up delay-${i + 1} ${visibleSections["contact-cards"] ? "visible" : ""} bg-white border border-gray-100 rounded-3xl p-8 shadow-sm cursor-default`}
            >
              {/* Icon badge */}
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
                style={{ background: item.lightBg, color: item.accent, border: `1.5px solid ${item.border}` }}
              >
                {item.icon}
              </div>

              {/* Number pill — same as homepage role card id badge */}
              <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 mb-4 text-xs font-black uppercase tracking-widest"
                style={{ background: item.lightBg, color: item.accent }}>
                0{i + 1}
              </div>

              <h3 className="text-xl font-black text-gray-900 mb-2">{item.title}</h3>
              <p className="font-bold mb-3" style={{ color: item.accent }}>{item.value}</p>
              <p className="text-gray-500 text-sm leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════ FORM + SIDE INFO */}
      <section
        id="form-section"
        ref={setRef("form-section")}
        className="py-4 pb-24 px-6 bg-gray-50"
      >
        <div className="max-w-7xl mx-auto pt-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* ── Contact Form */}
            <div className={`fade-up ${visibleSections["form-section"] ? "visible" : ""} bg-white border border-gray-100 rounded-3xl p-8 md:p-10 shadow-sm`}>
              {/* Label — same uppercase tracked style from homepage */}
              <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-4 py-1.5 mb-5">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                <span className="text-xs font-bold text-green-700 uppercase tracking-widest">Send a Message</span>
              </div>

              <h2
                className="text-3xl md:text-4xl font-black text-gray-900 mb-8"
                style={{ fontFamily: "'Fraunces', serif" }}
              >
                Get in Touch
              </h2>

              <form className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                  <input type="text" placeholder="Enter your full name" className="form-input" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                  <input type="email" placeholder="Enter your email" className="form-input" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Subject</label>
                  <input type="text" placeholder="Enter subject" className="form-input" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Message</label>
                  <textarea
                    rows="5"
                    placeholder="Write your message here..."
                    className="form-input resize-none"
                  />
                </div>

                {/* CTA button — same style as homepage primary button */}
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-10 py-4 bg-green-600 text-white text-sm font-bold rounded-2xl hover:bg-green-700 hover:-translate-y-1 hover:shadow-xl hover:shadow-green-500/30 transition-all duration-300 active:scale-95"
                >
                  Send Message
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </button>
              </form>
            </div>

            {/* ── Right side panels */}
            <div className="space-y-6">

              {/* Why Contact Us — same green gradient card as homepage CTA */}
              <div className={`fade-up delay-1 ${visibleSections["form-section"] ? "visible" : ""} relative overflow-hidden rounded-3xl border border-gray-100 shadow-sm`}
                style={{ background: "linear-gradient(135deg, #14532d 0%, #166534 50%, #15803d 100%)" }}>
                {/* Decorative circles identical to homepage CTA */}
                <div className="absolute -top-12 -right-12 w-48 h-48 bg-green-500/20 rounded-full pointer-events-none" />
                <div className="absolute -bottom-8 -left-8 w-36 h-36 bg-green-400/15 rounded-full pointer-events-none" />

                <div className="relative z-10 p-8 md:p-10">
                  <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-5">
                    <span className="w-1.5 h-1.5 bg-green-300 rounded-full" />
                    <span className="text-xs font-bold text-green-200 uppercase tracking-widest">Why Contact Us</span>
                  </div>

                  <h2
                    className="text-2xl md:text-3xl font-black text-white mb-5 leading-snug"
                    style={{ fontFamily: "'Fraunces', serif" }}
                  >
                    We're Here to<br />Support You
                  </h2>

                  <p className="text-green-100 leading-7 text-sm mb-4">
                    Whether you are a farmer looking for market opportunities, a distributor
                    seeking reliable sourcing, or a transporter wanting to connect with
                    logistics opportunities, AGRIHUB-LK is here to help.
                  </p>
                  <p className="text-green-100 leading-7 text-sm">
                    We also welcome collaboration ideas, feedback, and partnership discussions
                    that can strengthen Sri Lanka's agricultural ecosystem.
                  </p>
                </div>
              </div>

              {/* Quick Support — same white card style */}
              <div className={`fade-up delay-2 ${visibleSections["form-section"] ? "visible" : ""} bg-white border border-gray-100 rounded-3xl p-8 md:p-10 shadow-sm`}>
                <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-4 py-1.5 mb-6">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                  <span className="text-xs font-bold text-green-700 uppercase tracking-widest">Quick Support</span>
                </div>

                <h3
                  className="text-xl font-black text-gray-900 mb-4"
                  style={{ fontFamily: "'Fraunces', serif" }}
                >
                  What We Can Help With
                </h3>

                <div>
                  {supportItems.map((item, i) => (
                    <div key={i} className="support-item">
                      <div className="support-check">
                        <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="#16a34a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2 6l3 3 5-5"/>
                        </svg>
                      </div>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════ BOTTOM CTA — identical to homepage CTA section */}
      <section
        id="cta"
        ref={setRef("cta")}
        className="px-6 py-24"
      >
        <div
          className={`fade-up ${visibleSections["cta"] ? "visible" : ""} max-w-5xl mx-auto relative overflow-hidden rounded-3xl`}
          style={{ background: "linear-gradient(135deg, #14532d 0%, #166534 40%, #15803d 100%)" }}
        >
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-green-500/20 rounded-full pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-green-400/15 rounded-full pointer-events-none" />

          <div className="relative z-10 p-10 md:p-16 text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-6">
              <span className="text-xs font-bold text-green-200 uppercase tracking-widest">🌱 Zero Hunger Goal</span>
            </div>
            <h2
              className="text-4xl md:text-5xl font-black text-white mb-5 leading-tight"
              style={{ fontFamily: "'Fraunces', serif" }}
            >
              Ready to Work<br />Together?
            </h2>
            <p className="text-green-100 max-w-xl mx-auto text-lg leading-relaxed mb-10">
              Join AGRIHUB-LK and become part of a connected agricultural network built for
              growth, collaboration, and sustainability across Sri Lanka.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                to="/register"
                className="px-10 py-4 bg-white text-green-800 text-base font-black rounded-2xl hover:-translate-y-1 hover:shadow-xl transition-all duration-300 active:scale-95"
              >
                Get Started Free
              </Link>
              <Link
                to="/about"
                className="px-10 py-4 bg-white/10 border border-white/30 text-white text-base font-bold rounded-2xl hover:bg-white/20 hover:-translate-y-1 transition-all duration-300 active:scale-95"
              >
                Learn About Our Mission
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════ FOOTER — identical to homepage */}
      <footer className="bg-gray-900 text-gray-400 py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-green-600 rounded-lg flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4">
                <path d="M17 8C8 10 5.9 16.17 3.82 19.41A1 1 0 005.12 21C7 19.43 11.4 17 21 17c-1.5-2-3-5-4-9z" />
              </svg>
            </div>
            <span className="text-white font-bold" style={{ fontFamily: "'Fraunces', serif" }}>AgriHUB.LK</span>
          </div>
          <p className="text-sm text-center">© 2025 AgriHUB-LK. Connecting Sri Lanka's agricultural ecosystem.</p>
          <div className="flex gap-5 text-sm">
            <Link to="/about"   className="hover:text-green-400 transition-colors">Mission</Link>
            <Link to="/contact" className="hover:text-green-400 transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Contact;