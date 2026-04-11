import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

const OurMission = () => {
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

  const values = [
    {
      title: "Empower Farmers",
      description:
        "We help farmers reach better market opportunities, improve visibility for their products, and connect directly with trusted buyers.",
      accent: "#16a34a",
      lightBg: "#f0fdf4",
      border: "#bbf7d0",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 8C8 10 5.9 16.17 3.82 19.41A1 1 0 005.12 21C7 19.43 11.4 17 21 17c-1.5-2-3-5-4-9z"/>
        </svg>
      ),
    },
    {
      title: "Strengthen Distribution",
      description:
        "We support distributors with better access to agricultural products, smoother sourcing processes, and more efficient coordination.",
      accent: "#d97706",
      lightBg: "#fffbeb",
      border: "#fde68a",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 7L12 3L20 7L20 17L12 21L4 17Z"/><path d="M12 3L12 21"/><path d="M4 7L20 7"/>
        </svg>
      ),
    },
    {
      title: "Enable Smart Transport",
      description:
        "We connect transporters with agricultural logistics opportunities, helping goods move efficiently from farms to destinations.",
      accent: "#0284c7",
      lightBg: "#f0f9ff",
      border: "#bae6fd",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
        </svg>
      ),
    },
  ];

  const pillars = [
    {
      number: "01",
      title: "Accessibility",
      description: "Creating a digital space where all stakeholders in agriculture can connect more easily and work together.",
      accent: "#16a34a",
      lightBg: "#f0fdf4",
    },
    {
      number: "02",
      title: "Efficiency",
      description: "Reducing delays and improving coordination in the agricultural supply chain through one connected platform.",
      accent: "#d97706",
      lightBg: "#fffbeb",
    },
    {
      number: "03",
      title: "Sustainability",
      description: "Supporting long-term agricultural growth and contributing to food security through digital innovation.",
      accent: "#0284c7",
      lightBg: "#f0f9ff",
    },
  ];

  return (
    <div className="w-full font-sans bg-white text-gray-900 overflow-x-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=Fraunces:ital,wght@0,700;0,900;1,700&display=swap');

        * { box-sizing: border-box; }
        body { font-family: 'Plus Jakarta Sans', sans-serif; }

        .fade-up {
          opacity: 0;
          transform: translateY(40px);
          transition: opacity 0.7s ease, transform 0.7s ease;
        }
        .fade-up.visible { opacity: 1; transform: translateY(0); }
        .fade-up.delay-1 { transition-delay: 0.1s; }
        .fade-up.delay-2 { transition-delay: 0.2s; }
        .fade-up.delay-3 { transition-delay: 0.3s; }
        .fade-up.delay-4 { transition-delay: 0.4s; }

        @keyframes heroIn {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        .hero-badge { animation: heroIn 0.9s cubic-bezier(0.16,1,0.3,1) 0s    both; }
        .hero-title { animation: heroIn 0.9s cubic-bezier(0.16,1,0.3,1) 0.2s  both; }
        .hero-sub   { animation: heroIn 0.9s cubic-bezier(0.16,1,0.3,1) 0.4s  both; }

        .nav-scrolled {
          background: rgba(255,255,255,0.95);
          backdrop-filter: blur(16px);
          box-shadow: 0 1px 0 rgba(0,0,0,0.06), 0 4px 24px rgba(0,0,0,0.05);
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50%       { transform: scale(1.5); opacity: 0.5; }
        }
        .pulse-dot { animation: pulse 2s ease-in-out infinite; }

        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          33%  { transform: translateY(-14px) rotate(3deg); }
          66%  { transform: translateY(-7px) rotate(-2deg); }
        }
        .leaf-float  { animation: float 7s ease-in-out infinite; }
        .leaf-float-2 { animation: float 9s ease-in-out infinite 1.5s; }
        .leaf-float-3 { animation: float 11s ease-in-out infinite 3s; }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to   { opacity: 1; transform: translateY(0);     }
        }
        .mobile-menu { animation: slideDown 0.25s ease; }

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

        /* Value & pillar card hover */
        .value-card {
          transition: transform 0.4s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.4s ease, border-color 0.3s ease;
        }
        .value-card:hover {
          transform: translateY(-10px);
          box-shadow: 0 32px 64px rgba(22,163,74,0.12);
        }

        .pillar-card {
          transition: transform 0.4s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.4s ease;
        }
        .pillar-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 24px 48px rgba(0,0,0,0.08);
        }

        /* SDG number shimmer */
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        .shimmer-text {
          background: linear-gradient(90deg, #15803d, #22c55e, #86efac, #22c55e, #15803d);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 4s linear infinite;
        }

        @keyframes scrollBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(8px); }
        }
      `}</style>

      {/* ═══════════════════════════════ NAVBAR */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled ? "nav-scrolled py-3" : "py-5 bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-8 flex items-center justify-between">
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
                  link.to === "/about"
                    ? scrolled ? "text-green-700" : "text-green-400"
                    : scrolled ? "text-gray-700 hover:text-green-700" : "text-white/90 hover:text-green-400"
                }`}
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

      {/* ═══════════════════════════════ HERO */}
      <section className="relative min-h-[62vh] w-full overflow-hidden bg-black">
        <div
          className="absolute inset-0 z-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 10% 30%, rgba(22,163,74,0.35) 0%, transparent 55%)," +
              "radial-gradient(ellipse 55% 65% at 90% 70%, rgba(21,128,61,0.2) 0%, transparent 55%)," +
              "radial-gradient(ellipse 50% 50% at 50% 100%, rgba(15,118,110,0.2) 0%, transparent 60%)," +
              "linear-gradient(160deg, #052e16 0%, #0c1a0e 50%, #071a10 100%)",
          }}
        />
        {/* Grain texture */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Floating leaves */}
        <div className="leaf-float absolute top-36 left-16 w-8 h-8 text-green-400/25 pointer-events-none">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17 8C8 10 5.9 16.17 3.82 19.41A1 1 0 005.12 21C7 19.43 11.4 17 21 17c-1.5-2-3-5-4-9z" /></svg>
        </div>
        <div className="leaf-float-2 absolute top-52 right-24 w-6 h-6 text-green-400/20 pointer-events-none">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17 8C8 10 5.9 16.17 3.82 19.41A1 1 0 005.12 21C7 19.43 11.4 17 21 17c-1.5-2-3-5-4-9z" /></svg>
        </div>
        <div className="leaf-float-3 absolute bottom-20 left-1/3 w-5 h-5 text-green-300/15 pointer-events-none">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17 8C8 10 5.9 16.17 3.82 19.41A1 1 0 005.12 21C7 19.43 11.4 17 21 17c-1.5-2-3-5-4-9z" /></svg>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-8 pt-44 pb-24 flex flex-col items-center text-center">
          <div className="hero-badge inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/25 rounded-full px-4 py-2 mb-8">
            <span className="w-2 h-2 bg-green-400 rounded-full pulse-dot" />
            <span className="text-xs font-bold text-white uppercase tracking-widest">AGRIHUB-LK Mission</span>
          </div>

          <h1
            className="hero-title text-5xl md:text-7xl font-black text-white leading-[1.05] mb-6 max-w-5xl drop-shadow-xl"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            Building a Smarter Future for{" "}
            <span className="text-green-400">Sri Lankan Agriculture</span>
          </h1>

          <p className="hero-sub max-w-2xl text-lg md:text-xl text-white/75 mb-10 leading-relaxed font-medium">
            AGRIHUB-LK exists to connect{" "}
            <span className="text-green-300 font-bold">farmers, distributors, and transporters</span>{" "}
            in one digital ecosystem — creating a more efficient, accessible, and sustainable agricultural supply chain.
          </p>

          <div className="flex flex-col items-center gap-2 opacity-50" style={{ animation: "scrollBounce 1.8s ease-in-out infinite" }}>
            <span className="text-xs font-semibold text-white/70 uppercase tracking-widest">Scroll</span>
            <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════ MISSION + VISION */}
      <section
        id="mission"
        ref={setRef("mission")}
        className="max-w-7xl mx-auto px-6 md:px-8 py-24"
      >
        {/* Section header */}
        <div className={`text-center mb-16 fade-up ${visibleSections["mission"] ? "visible" : ""}`}>
          <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-4 py-1.5 mb-5">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
            <span className="text-xs font-bold text-green-700 uppercase tracking-widest">Who We Are</span>
          </div>
          <h2
            className="text-4xl md:text-5xl font-black text-gray-900 mb-4"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            Our Mission &{" "}
            <span className="text-green-600">Vision</span>
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto text-lg leading-relaxed">
            Two sides of the same commitment — building a digital bridge for Sri Lanka's agricultural future.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* Mission card — white */}
          <div className={`fade-up delay-1 ${visibleSections["mission"] ? "visible" : ""} bg-white border border-gray-100 rounded-3xl p-8 md:p-10 shadow-sm`}>
            <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-4 py-1.5 mb-6">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
              <span className="text-xs font-bold text-green-700 uppercase tracking-widest">Our Mission</span>
            </div>
            <h2
              className="text-2xl md:text-3xl font-black text-gray-900 mb-5 leading-snug"
              style={{ fontFamily: "'Fraunces', serif" }}
            >
              Connecting agriculture<br />with opportunity
            </h2>
            <p className="text-gray-500 leading-8 mb-5 text-sm">
              Our mission is to bridge the gap between production, distribution, and transportation in Sri Lanka's
              agricultural sector by using technology to create stronger connections between stakeholders.
            </p>
            <p className="text-gray-500 leading-8 text-sm">
              Through AGRIHUB-LK, we aim to reduce inefficiencies, improve access to markets, support smoother
              logistics, and create a platform that contributes to a more reliable and sustainable food supply system.
            </p>
          </div>

          {/* Vision card — dark green gradient, same as CTA */}
          <div
            className={`fade-up delay-2 ${visibleSections["mission"] ? "visible" : ""} relative overflow-hidden rounded-3xl border border-gray-100 shadow-sm`}
            style={{ background: "linear-gradient(135deg, #14532d 0%, #166534 50%, #15803d 100%)" }}
          >
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-green-500/20 rounded-full pointer-events-none" />
            <div className="absolute -bottom-8 -left-8 w-36 h-36 bg-green-400/15 rounded-full pointer-events-none" />

            <div className="relative z-10 p-8 md:p-10">
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-6">
                <span className="w-1.5 h-1.5 bg-green-300 rounded-full" />
                <span className="text-xs font-bold text-green-200 uppercase tracking-widest">Our Vision</span>
              </div>
              <h2
                className="text-2xl md:text-3xl font-black text-white mb-5 leading-snug"
                style={{ fontFamily: "'Fraunces', serif" }}
              >
                A connected and sustainable<br />agricultural ecosystem
              </h2>
              <p className="text-green-100 leading-8 mb-5 text-sm">
                We envision a future where farmers have better access to buyers, distributors can source products more
                efficiently, and transporters can play a stronger role in enabling agricultural growth.
              </p>
              <p className="text-green-100 leading-8 text-sm">
                By creating a trusted digital platform, we hope to support economic growth, improve collaboration, and
                contribute to national food security with modern technological solutions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════ VALUES / CORE FOCUS */}
      <section
        id="values"
        ref={setRef("values")}
        className="py-24 px-6 bg-gray-50"
      >
        <div className="max-w-7xl mx-auto">
          <div className={`text-center mb-16 fade-up ${visibleSections["values"] ? "visible" : ""}`}>
            <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-4 py-1.5 mb-5">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
              <span className="text-xs font-bold text-green-700 uppercase tracking-widest">What Drives Us</span>
            </div>
            <h2
              className="text-4xl md:text-5xl font-black text-gray-900 mb-4"
              style={{ fontFamily: "'Fraunces', serif" }}
            >
              Our Core <span className="text-green-600">Focus Areas</span>
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto text-lg leading-relaxed">
              AGRIHUB-LK is designed around the real needs of agricultural stakeholders and the goal of making the
              supply chain more connected.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {values.map((item, i) => (
              <div
                key={i}
                className={`value-card fade-up delay-${i + 1} ${visibleSections["values"] ? "visible" : ""} bg-white border border-gray-100 rounded-3xl p-8 shadow-sm cursor-default`}
              >
                {/* Icon badge */}
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: item.lightBg, color: item.accent, border: `1.5px solid ${item.border}` }}
                >
                  {item.icon}
                </div>

                {/* Number pill */}
                <div
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 mb-4 text-xs font-black uppercase tracking-widest"
                  style={{ background: item.lightBg, color: item.accent }}
                >
                  0{i + 1}
                </div>

                <h3
                  className="text-xl font-black text-gray-900 mb-3"
                  style={{ fontFamily: "'Fraunces', serif" }}
                >
                  {item.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════ SDG SECTION */}
      <section
        id="sdg"
        ref={setRef("sdg")}
        className="max-w-7xl mx-auto px-6 md:px-8 py-24"
      >
        <div className={`fade-up ${visibleSections["sdg"] ? "visible" : ""} relative overflow-hidden rounded-3xl`}
          style={{ background: "linear-gradient(135deg, #14532d 0%, #166534 40%, #15803d 100%)" }}>
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-green-500/20 rounded-full pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-green-400/15 rounded-full pointer-events-none" />

          <div className="relative z-10 p-8 md:p-14">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left text */}
              <div>
                <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-6">
                  <span className="text-xs font-bold text-green-200 uppercase tracking-widest">SDG Alignment</span>
                </div>
                <h2
                  className="text-3xl md:text-4xl font-black text-white mb-5 leading-snug"
                  style={{ fontFamily: "'Fraunces', serif" }}
                >
                  Supporting SDG 2:<br />
                  <span className="text-green-300">Zero Hunger</span>
                </h2>
                <p className="text-green-100 leading-8 text-sm mb-5">
                  AGRIHUB-LK is aligned with the United Nations Sustainable Development Goal 2, which aims to end
                  hunger, achieve food security, improve nutrition, and promote sustainable agriculture.
                </p>
                <p className="text-green-100 leading-8 text-sm">
                  By improving coordination between farmers, distributors, and transporters, our platform contributes
                  to better food movement, reduced inefficiencies, and stronger support for agricultural communities.
                </p>
              </div>

              {/* Right SDG tile — same white card style used in stats/insights */}
              <div className="bg-white/10 border border-white/20 rounded-3xl p-10 backdrop-blur-sm text-center">
                <div
                  className="shimmer-text text-8xl md:text-9xl font-black mb-4 leading-none"
                  style={{ fontFamily: "'Fraunces', serif" }}
                >
                  2
                </div>
                <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-4">
                  <span className="w-1.5 h-1.5 bg-green-300 rounded-full pulse-dot" />
                  <span className="text-xs font-bold text-green-200 uppercase tracking-widest">🌱 Zero Hunger Goal</span>
                </div>
                <h3
                  className="text-2xl font-black text-white mb-4"
                  style={{ fontFamily: "'Fraunces', serif" }}
                >
                  Zero Hunger
                </h3>
                <p className="text-green-100 text-sm leading-7">
                  Our platform focuses on strengthening the agricultural ecosystem so food can move more effectively
                  from producers to the people and businesses that need it.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════ PILLARS / HOW WE CREATE IMPACT */}
      <section
        id="pillars"
        ref={setRef("pillars")}
        className="py-24 px-6 bg-gray-50"
      >
        <div className="max-w-7xl mx-auto">
          <div className={`text-center mb-16 fade-up ${visibleSections["pillars"] ? "visible" : ""}`}>
            <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-4 py-1.5 mb-5">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
              <span className="text-xs font-bold text-green-700 uppercase tracking-widest">Our Approach</span>
            </div>
            <h2
              className="text-4xl md:text-5xl font-black text-gray-900 mb-4"
              style={{ fontFamily: "'Fraunces', serif" }}
            >
              How We <span className="text-green-600">Create Impact</span>
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto text-lg leading-relaxed">
              Three core principles guide every decision we make and every feature we build.
            </p>
          </div>

          {/* Connector line — same as homepage "How It Works" */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-12 left-1/3 right-1/3 h-px bg-green-200 z-0" />

            {pillars.map((item, i) => (
              <div
                key={i}
                className={`pillar-card fade-up delay-${i + 1} ${visibleSections["pillars"] ? "visible" : ""} relative z-10 bg-white border border-gray-100 rounded-3xl p-8 shadow-sm text-center cursor-default`}
              >
                {/* Large watermark number — same as homepage step cards */}
                <div
                  className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-5 border-2"
                  style={{ background: item.lightBg, borderColor: item.accent + "40" }}
                >
                  <span
                    className="text-2xl font-black"
                    style={{ color: item.accent, fontFamily: "'Fraunces', serif" }}
                  >
                    {item.number}
                  </span>
                </div>
                <div
                  className="text-xs font-black uppercase tracking-widest mb-2"
                  style={{ color: item.accent }}
                >
                  Step {i + 1}
                </div>
                <h3
                  className="text-xl font-black text-gray-900 mb-3"
                  style={{ fontFamily: "'Fraunces', serif" }}
                >
                  {item.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════ BOTTOM CTA — identical to homepage */}
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
              Join Our Mission
            </h2>
            <p className="text-green-100 max-w-xl mx-auto text-lg leading-relaxed mb-10">
              Be part of a platform that is working to modernize agricultural trade, strengthen collaboration, and
              support a more sustainable future for Sri Lanka.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                to="/register"
                className="px-10 py-4 bg-white text-green-800 text-base font-black rounded-2xl hover:-translate-y-1 hover:shadow-xl transition-all duration-300 active:scale-95"
              >
                Get Started Free
              </Link>
              <Link
                to="/contact"
                className="px-10 py-4 bg-white/10 border border-white/30 text-white text-base font-bold rounded-2xl hover:bg-white/20 hover:-translate-y-1 transition-all duration-300 active:scale-95"
              >
                Contact Us
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

export default OurMission;