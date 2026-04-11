import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";

import farmerImg from "../assets/farmer.png";
import transporterImg from "../assets/transporter.png";
import distributorImg from "../assets/distributor.png";

const Homepage = () => {
  const [distributors, setDistributors] = useState([]);
  const [transporters, setTransporters] = useState([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      type: "bot",
      text: "Hello! I'm the AgriHUB-LK assistant. How can I help you today?",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [visibleSections, setVisibleSections] = useState({});
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const sectionRefs = useRef({});

  useEffect(() => {
    const fetchLogos = async () => {
      try {
        const distRes = await fetch("http://localhost:3000/api/users/distributors/logos");
        if (distRes.ok) {
          const distData = await distRes.json();
          if (distData.success) setDistributors(distData.data);
        }
        const transRes = await fetch("http://localhost:3000/api/users/transporters/logos");
        if (transRes.ok) {
          const transData = await transRes.json();
          if (transData.success) setTransporters(transData.data);
        }
      } catch (error) {
        console.error("Failed to fetch partner logos:", error);
      }
    };
    fetchLogos();
  }, []);

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
      { threshold: 0.15 }
    );
    Object.values(sectionRefs.current).forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [distributors, transporters]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isChatOpen && inputRef.current) inputRef.current.focus();
  }, [isChatOpen]);

  const setRef = (id) => (el) => {
    sectionRefs.current[id] = el;
  };

  const roleCards = [
    {
      id: "01",
      title: "Farmer",
      image: farmerImg,
      accent: "#16a34a",
      lightAccent: "#dcfce7",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
          <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          <path d="M2 12h20" />
        </svg>
      ),
      description:
        "Direct market access. List your harvest, connect with verified buyers, and grow your income through our digital agricultural marketplace.",
    },
    {
      id: "02",
      title: "Transporter",
      image: transporterImg,
      accent: "#0284c7",
      lightAccent: "#e0f2fe",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
          <rect x="1" y="3" width="15" height="13" rx="2" />
          <path d="M16 8h4l3 3v5h-7V8z" />
          <circle cx="5.5" cy="18.5" r="2.5" />
          <circle cx="18.5" cy="18.5" r="2.5" />
        </svg>
      ),
      description:
        "Find transport opportunities, manage routes, and support efficient movement of agricultural goods from farms to markets across Sri Lanka.",
    },
    {
      id: "03",
      title: "Distributor",
      image: distributorImg,
      accent: "#d97706",
      lightAccent: "#fef3c7",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
          <path d="M4 7 L12 3 L20 7 L20 17 L12 21 L4 17 Z" />
          <path d="M12 3 L12 21" />
          <path d="M4 7 L20 7" />
        </svg>
      ),
      description:
        "Source products efficiently with better supply visibility, secure transactions, and smoother coordination across the supply chain.",
    },
  ];

  const stats = [
    { value: "2,400+", label: "Registered Farmers" },
    { value: "180+", label: "Transport Partners" },
    { value: "320+", label: "Distributors" },
    { value: "17", label: "Districts Covered" },
  ];

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const question = inputValue.trim();
    if (!question) return;
    setMessages((prev) => [...prev, { type: "user", text: question }]);
    setInputValue("");
    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:3000/api/chat/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        {
          type: "bot",
          text: data.success ? data.answer : "Sorry, I couldn't process that. Please try again.",
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { type: "bot", text: "Network error. Please check your connection." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full font-sans bg-white text-gray-900 overflow-x-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=Fraunces:ital,wght@0,700;0,900;1,700&display=swap');

        * { box-sizing: border-box; }

        body { font-family: 'Plus Jakarta Sans', sans-serif; }

        .font-display { font-family: 'Fraunces', serif; }

        /* Fade up animation */
        .fade-up {
          opacity: 0;
          transform: translateY(40px);
          transition: opacity 0.7s ease, transform 0.7s ease;
        }
        .fade-up.visible {
          opacity: 1;
          transform: translateY(0);
        }
        .fade-up.delay-1 { transition-delay: 0.1s; }
        .fade-up.delay-2 { transition-delay: 0.2s; }
        .fade-up.delay-3 { transition-delay: 0.3s; }
        .fade-up.delay-4 { transition-delay: 0.4s; }

        /* Hero entrance */
        @keyframes heroIn {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .hero-title { animation: heroIn 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both; }
        .hero-sub { animation: heroIn 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.4s both; }
        .hero-cta { animation: heroIn 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.6s both; }
        .hero-badge { animation: heroIn 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0s both; }

        /* Nav blur */
        .nav-scrolled {
          background: rgba(255,255,255,0.95);
          backdrop-filter: blur(16px);
          box-shadow: 0 1px 0 rgba(0,0,0,0.06), 0 4px 24px rgba(0,0,0,0.05);
        }

        /* Leaf decoration */
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          33% { transform: translateY(-14px) rotate(3deg); }
          66% { transform: translateY(-7px) rotate(-2deg); }
        }
        .leaf-float { animation: float 7s ease-in-out infinite; }
        .leaf-float-2 { animation: float 9s ease-in-out infinite 1.5s; }
        .leaf-float-3 { animation: float 11s ease-in-out infinite 3s; }

        /* Grain texture */
        .grain::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
          pointer-events: none;
          opacity: 0.3;
          z-index: 1;
        }

        /* Role card hover */
        .role-card {
          transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.4s ease;
        }
        .role-card:hover {
          transform: translateY(-10px);
          box-shadow: 0 32px 64px rgba(22,163,74,0.15);
        }

        /* Stats counter */
        @keyframes countIn {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
        .stat-item.visible .stat-num {
          animation: countIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
        .stat-item.visible:nth-child(2) .stat-num { animation-delay: 0.1s; }
        .stat-item.visible:nth-child(3) .stat-num { animation-delay: 0.2s; }
        .stat-item.visible:nth-child(4) .stat-num { animation-delay: 0.3s; }

        /* Pulsing dot */
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.5; }
        }
        .pulse-dot { animation: pulse 2s ease-in-out infinite; }

        /* Chat bounce */
        @keyframes chatBounce {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }
        .chat-fab:not(:hover) { animation: chatBounce 3s ease-in-out infinite 5s; }

        /* Scroll indicator */
        @keyframes scrollBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(8px); }
        }
        .scroll-indicator { animation: scrollBounce 1.8s ease-in-out infinite; }

        /* Green mesh background */
        .green-mesh {
          background:
            radial-gradient(ellipse 80% 60% at 20% 40%, rgba(187,247,208,0.5) 0%, transparent 60%),
            radial-gradient(ellipse 60% 80% at 80% 20%, rgba(187,247,208,0.35) 0%, transparent 60%),
            radial-gradient(ellipse 50% 50% at 50% 80%, rgba(209,250,229,0.3) 0%, transparent 60%),
            #f0fdf4;
        }

        /* Partner logo hover */
        .partner-card {
          transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
        }
        .partner-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(22,163,74,0.12);
          border-color: #86efac;
        }

        /* Underline grow */
        .underline-grow {
          position: relative;
        }
        .underline-grow::after {
          content: '';
          position: absolute;
          bottom: -4px;
          left: 0;
          width: 0;
          height: 3px;
          background: #16a34a;
          border-radius: 2px;
          transition: width 0.3s ease;
        }
        .underline-grow:hover::after { width: 100%; }

        /* Mobile menu */
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .mobile-menu { animation: slideDown 0.25s ease; }

        /* Shimmer for CTA section */
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .shimmer-text {
          background: linear-gradient(90deg, #15803d, #22c55e, #86efac, #22c55e, #15803d);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 4s linear infinite;
        }
      `}</style>

      {/* ========== NAVBAR ========== */}
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
            <span style={{ fontFamily: "'Fraunces', serif" }} className={`text-2xl font-black tracking-tight transition-colors duration-500 ${scrolled ? "text-gray-900" : "text-white"}`}>
              AgriHUB<span className={scrolled ? "text-green-600" : "text-green-400"}>.LK</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {[
              { to: "/products", label: "Marketplace" },
              { to: "/about", label: "Our Mission" },
              { to: "/contact", label: "Contact" },
            ].map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`underline-grow font-semibold hover:text-green-400 transition-colors text-sm ${scrolled ? "text-gray-700 hover:text-green-700" : "text-white/90"}`}
              >
                {link.label}
              </Link>
            ))}
          </div>

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

          <button
            className="md:hidden w-10 h-10 flex flex-col items-center justify-center gap-1.5 rounded-xl hover:bg-white/10 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className={`block w-5 h-0.5 rounded transition-all ${mobileMenuOpen ? "rotate-45 translate-y-2" : ""} ${scrolled ? "bg-gray-800" : "bg-white"}`} />
            <span className={`block w-5 h-0.5 rounded transition-all ${mobileMenuOpen ? "opacity-0" : ""} ${scrolled ? "bg-gray-800" : "bg-white"}`} />
            <span className={`block w-5 h-0.5 rounded transition-all ${mobileMenuOpen ? "-rotate-45 -translate-y-2" : ""} ${scrolled ? "bg-gray-800" : "bg-white"}`} />
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="mobile-menu md:hidden bg-white border-t border-gray-100 px-6 py-4 space-y-3 shadow-xl">
            {["Marketplace", "Our Mission", "Contact"].map((label, i) => (
              <Link key={i} to={`/${label.toLowerCase().replace(" ", "-")}`} className="block py-2 text-gray-700 font-semibold hover:text-green-600">
                {label}
              </Link>
            ))}
            <div className="flex gap-3 pt-2">
              <Link to="/login" className="flex-1 text-center py-2.5 border border-gray-200 rounded-xl font-semibold text-gray-700 hover:border-green-400">Login</Link>
              <Link to="/register" className="flex-1 text-center py-2.5 bg-green-600 rounded-xl font-bold text-white hover:bg-green-700">Join Free</Link>
            </div>
          </div>
        )}
      </nav>

      {/* ========== HERO SECTION ========== */}
      <section className="relative min-h-screen w-full overflow-hidden bg-black">
        {/* Background video — full visibility with dark overlay for text readability */}
        <div className="absolute inset-0 z-0">
          <video autoPlay loop muted playsInline preload="auto" className="h-full w-full object-cover brightness-[0.55]">
            <source src="/assets/farm-bg.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-black/30" />
        </div>

        {/* Hero content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-8 pt-40 pb-28 flex flex-col items-center text-center">
          {/* Badge */}
          <div className="hero-badge inline-flex items-center gap-2 bg-white/15 backdrop-blur-md border border-white/30 rounded-full px-4 py-2 mb-8">
            <span className="w-2 h-2 bg-green-400 rounded-full pulse-dot" />
            <span className="text-xs font-bold text-white uppercase tracking-widest">SDG Zero Hunger Initiative</span>
          </div>

          <h1
            className="hero-title text-5xl md:text-7xl lg:text-8xl font-black text-white leading-[1.05] mb-6 max-w-5xl drop-shadow-xl"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            Empowering Sri Lankan{" "}
            <span className="text-green-400">Agricultural</span>{" "}
            Trade
          </h1>

          <p className="hero-sub max-w-2xl text-lg md:text-xl text-white/80 mb-10 leading-relaxed font-medium">
            A unified digital ecosystem connecting{" "}
            <span className="text-green-300 font-bold">Farmers, Distributors & Transporters</span>
            . Harnessing technology to build a smarter, hunger-free Sri Lanka.
          </p>

          <div className="hero-cta flex flex-col sm:flex-row gap-4 mb-16">
            <Link
              to="/products"
              className="px-10 py-4 bg-green-500 text-white text-base font-bold rounded-2xl hover:bg-green-600 hover:-translate-y-1 hover:shadow-xl hover:shadow-green-500/40 transition-all duration-300 active:scale-95"
            >
              Explore Marketplace →
            </Link>
            <Link
              to="/register"
              className="px-10 py-4 bg-white/15 backdrop-blur-md text-white text-base font-bold rounded-2xl border border-white/30 hover:bg-white/25 hover:-translate-y-1 transition-all duration-300 active:scale-95"
            >
              Become a Partner
            </Link>
          </div>

          {/* Scroll indicator */}
          <div className="scroll-indicator flex flex-col items-center gap-2 opacity-60">
            <span className="text-xs font-semibold text-white/70 uppercase tracking-widest">Scroll</span>
            <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </section>

      {/* ========== STATS STRIP ========== */}
      <section
        id="stats"
        ref={setRef("stats")}
        className="bg-green-600 py-12 px-6"
      >
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <div
              key={i}
              className={`stat-item text-center ${visibleSections["stats"] ? "visible" : ""}`}
            >
              <div className="stat-num text-4xl md:text-5xl font-black text-white mb-1" style={{ fontFamily: "'Fraunces', serif" }}>
                {stat.value}
              </div>
              <div className="text-green-100 text-sm font-semibold uppercase tracking-widest">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ========== ROLE CARDS SECTION ========== */}
      <section
        id="roles"
        ref={setRef("roles")}
        className="max-w-7xl mx-auto px-6 md:px-8 py-28"
      >
        <div className={`text-center mb-16 fade-up ${visibleSections["roles"] ? "visible" : ""}`}>
          <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-4 py-1.5 mb-5">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
            <span className="text-xs font-bold text-green-700 uppercase tracking-widest">Platform Roles</span>
          </div>
          <h2 className="font-display text-4xl md:text-5xl font-black text-gray-900 mb-4" style={{ fontFamily: "'Fraunces', serif" }}>
            Built for Every Part of<br />
            <span className="text-green-600">the Supply Chain</span>
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto text-lg leading-relaxed">
            AGRIHUB-LK creates value for all stakeholders through one powerful, connected digital platform.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {roleCards.map((card, i) => (
            <div
              key={card.id}
              className={`role-card fade-up delay-${i + 1} ${visibleSections["roles"] ? "visible" : ""} group relative rounded-3xl overflow-hidden bg-white border border-gray-100 shadow-sm cursor-pointer`}
            >
              {/* Image area */}
              <div className="relative h-56 overflow-hidden">
                <img
                  src={card.image}
                  alt={card.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white via-white/30 to-transparent" />

                {/* Number badge */}
                <div
                  className="absolute top-4 left-4 w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm"
                  style={{ backgroundColor: card.accent }}
                >
                  {card.id}
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Icon + title */}
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: card.lightAccent, color: card.accent }}
                  >
                    {card.icon}
                  </div>
                  <h3 className="text-xl font-black text-gray-900">{card.title}</h3>
                </div>
                <p className="text-gray-500 text-sm leading-relaxed mb-5">{card.description}</p>

                <Link
                  to="/register"
                  className="inline-flex items-center gap-1.5 text-sm font-bold transition-all duration-300"
                  style={{ color: card.accent }}
                >
                  Join as {card.title}
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========== HOW IT WORKS ========== */}
      <section
        id="how"
        ref={setRef("how")}
        className="py-24 px-6 bg-gray-50"
      >
        <div className="max-w-7xl mx-auto">
          <div className={`text-center mb-16 fade-up ${visibleSections["how"] ? "visible" : ""}`}>
            <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-4 py-1.5 mb-5">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
              <span className="text-xs font-bold text-green-700 uppercase tracking-widest">Simple Process</span>
            </div>
            <h2 className="font-display text-4xl md:text-5xl font-black text-gray-900" style={{ fontFamily: "'Fraunces', serif" }}>
              How It Works
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-12 left-1/3 right-1/3 h-px bg-green-200 z-0" />

            {[
              { step: "1", title: "Register", desc: "Sign up as a Farmer, Transporter, or Distributor in minutes.", icon: "👤" },
              { step: "2", title: "Connect", desc: "List your products or services and connect with verified partners.", icon: "🔗" },
              { step: "3", title: "Trade", desc: "Complete secure transactions and grow your agricultural business.", icon: "📈" },
            ].map((item, i) => (
              <div
                key={i}
                className={`fade-up delay-${i + 1} ${visibleSections["how"] ? "visible" : ""} relative z-10 text-center`}
              >
                <div className="w-24 h-24 mx-auto bg-white border-2 border-green-200 rounded-2xl flex items-center justify-center text-4xl mb-5 shadow-sm hover:border-green-400 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                  {item.icon}
                </div>
                <div className="text-xs font-black text-green-600 uppercase tracking-widest mb-2">Step {item.step}</div>
                <h3 className="text-xl font-black text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== CTA SECTION ========== */}
      <section
        id="cta"
        ref={setRef("cta")}
        className="px-6 py-24"
      >
        <div
          className={`fade-up ${visibleSections["cta"] ? "visible" : ""} max-w-5xl mx-auto relative overflow-hidden rounded-3xl`}
          style={{
            background: "linear-gradient(135deg, #14532d 0%, #166534 40%, #15803d 100%)",
          }}
        >
          {/* Decorative circles */}
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-green-500/20 rounded-full" />
          <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-green-400/15 rounded-full" />

          <div className="relative z-10 p-10 md:p-16 text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-6">
              <span className="text-xs font-bold text-green-200 uppercase tracking-widest">🌱 Zero Hunger Goal</span>
            </div>
            <h2 className="font-display text-4xl md:text-5xl font-black text-white mb-5 leading-tight" style={{ fontFamily: "'Fraunces', serif" }}>
              Join the Future of<br />Agricultural Trade
            </h2>
            <p className="text-green-100 max-w-xl mx-auto text-lg leading-relaxed mb-10">
              Whether you're a farmer, distributor, or transporter — AGRIHUB-LK connects you to a smarter, more sustainable food supply network across Sri Lanka.
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
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========== TRUSTED PARTNERS ========== */}
      {(distributors.length > 0 || transporters.length > 0) && (
        <section
          id="partners"
          ref={setRef("partners")}
          className="px-6 pb-28 bg-gray-50"
        >
          <div className="max-w-7xl mx-auto pt-16">
            <div className={`text-center mb-12 fade-up ${visibleSections["partners"] ? "visible" : ""}`}>
              <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-4 py-1.5 mb-5">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                <span className="text-xs font-bold text-green-700 uppercase tracking-widest">Trusted Network</span>
              </div>
              <h2 className="font-display text-4xl font-black text-gray-900 mb-3" style={{ fontFamily: "'Fraunces', serif" }}>
                Registered Partners
              </h2>
              <p className="text-gray-500 max-w-xl mx-auto">
                Our platform is trusted by distributors and transport partners across Sri Lanka.
              </p>
            </div>

            <div className="space-y-10">
              {distributors.length > 0 && (
                <div className={`fade-up ${visibleSections["partners"] ? "visible" : ""}`}>
                  <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-5 text-center">Distributors</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {distributors.map((item) => (
                      <div
                        key={item.id}
                        className="partner-card bg-white border border-gray-100 rounded-2xl p-5 flex flex-col items-center justify-center h-28 group"
                      >
                        <img
                          src={item.logoUrl}
                          alt={item.name}
                          className="max-h-12 object-contain grayscale group-hover:grayscale-0 transition-all duration-300"
                        />
                        <span className="mt-2 text-xs font-bold text-green-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 uppercase tracking-wide truncate max-w-full text-center px-2">
                          {item.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {transporters.length > 0 && (
                <div className={`fade-up delay-1 ${visibleSections["partners"] ? "visible" : ""}`}>
                  <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-5 text-center">Transporters</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {transporters.map((item) => (
                      <div
                        key={item.id}
                        className="partner-card bg-white border border-gray-100 rounded-2xl p-5 flex flex-col items-center justify-center h-28 group"
                      >
                        <img
                          src={item.logoUrl}
                          alt={item.name}
                          className="max-h-12 object-contain grayscale group-hover:grayscale-0 transition-all duration-300"
                        />
                        <span className="mt-2 text-xs font-bold text-green-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 uppercase tracking-wide truncate max-w-full text-center px-2">
                          {item.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ========== FOOTER ========== */}
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
            <Link to="/about" className="hover:text-green-400 transition-colors">Mission</Link>
            <Link to="/contact" className="hover:text-green-400 transition-colors">Contact</Link>
          </div>
        </div>
      </footer>

      {/* ========== CHATBOT ========== */}
      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="chat-fab fixed bottom-6 right-6 z-50 w-14 h-14 bg-green-600 hover:bg-green-700 rounded-2xl shadow-xl shadow-green-200 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:rounded-xl"
        aria-label="Chat with support"
      >
        {isChatOpen ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        )}
      </button>

      {/* Chat Panel */}
      <div
        className={`fixed bottom-24 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] bg-white border border-gray-200 rounded-3xl shadow-2xl shadow-gray-200 overflow-hidden transition-all duration-300 origin-bottom-right ${
          isChatOpen ? "scale-100 opacity-100 translate-y-0" : "scale-95 opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        {/* Header */}
        <div className="bg-green-600 px-5 py-4 flex items-center gap-3">
          <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-sm">
            <svg viewBox="0 0 24 24" fill="#16a34a" className="w-5 h-5">
              <path d="M17 8C8 10 5.9 16.17 3.82 19.41A1 1 0 005.12 21C7 19.43 11.4 17 21 17c-1.5-2-3-5-4-9z" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">AgriHUB Assistant</h3>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-green-300 rounded-full pulse-dot" />
              <p className="text-xs text-green-100">Online • Ask me anything</p>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="h-80 overflow-y-auto p-4 space-y-3 bg-gray-50">
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${
                  msg.type === "user"
                    ? "bg-green-600 text-white rounded-br-none"
                    : "bg-white text-gray-800 rounded-bl-none border border-gray-100 shadow-sm"
                }`}
              >
                <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-100 shadow-sm px-4 py-3 rounded-2xl rounded-bl-none">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-100">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type your question..."
              className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-200 disabled:cursor-not-allowed text-white p-2.5 rounded-xl transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Homepage;