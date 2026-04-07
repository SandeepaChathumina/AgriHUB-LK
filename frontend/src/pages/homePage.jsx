import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

// ===== IMPORT YOUR ROLE CARD IMAGES FROM src/assets =====
import farmerImg from "../assets/farmer.png";
import transporterImg from "../assets/transporter.png";
import distributorImg from "../assets/distributor.png";

// ===== IF YOUR VIDEO IS IN public/assets, KEEP THIS PATH BELOW =====
// <source src="/assets/farm-bg.mp4" type="video/mp4" />

const Homepage = () => {
  // --- ADDED: State for dynamic logos ---
  const [distributors, setDistributors] = useState([]);
  const [transporters, setTransporters] = useState([]);

  // --- ADDED: Fetch logos from API on component mount ---
  useEffect(() => {
    const fetchLogos = async () => {
      try {
        // Fetch Distributors
        const distRes = await fetch("http://localhost:3000/api/users/distributors/logos");
        if (distRes.ok) {
          const distData = await distRes.json();
          if (distData.success) {
            setDistributors(distData.data);
          }
        }

        // Fetch Transporters
        const transRes = await fetch("http://localhost:3000/api/users/transporters/logos");
        if (transRes.ok) {
          const transData = await transRes.json();
          if (transData.success) {
            setTransporters(transData.data);
          }
        }
      } catch (error) {
        console.error("Failed to fetch partner logos:", error);
      }
    };

    fetchLogos();
  }, []);

  const roleCards = [
    {
      id: "01",
      title: "Farmer",
      image: farmerImg,
      titleColor: "text-green-400",
      badgeBg: "bg-green-500/25",
      borderHover: "hover:border-green-500/50",
      description:
        "Direct market access. List your harvest, connect with verified buyers, and increase opportunities through a digital marketplace.",
    },
    {
      id: "02",
      title: "Transporter",
      image: transporterImg,
      titleColor: "text-blue-400",
      badgeBg: "bg-blue-500/25",
      borderHover: "hover:border-blue-500/50",
      description:
        "Find transport opportunities, manage routes, and support efficient movement of agricultural goods from farms to buyers.",
    },
    {
      id: "03",
      title: "Distributor",
      image: distributorImg,
      titleColor: "text-yellow-400",
      badgeBg: "bg-yellow-500/25",
      borderHover: "hover:border-yellow-500/50",
      description:
        "Source products efficiently with better supply visibility, secure transactions, and smoother coordination across the supply chain.",
    },
  ];

  return (
    <div className="w-full font-sans bg-[#07140d] text-white">
      {/* ================= HERO SECTION ================= */}
      <section className="relative min-h-screen w-full overflow-hidden">
        {/* Background Video - Hero Only */}
        <div className="absolute inset-0 z-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            className="h-full w-full object-cover brightness-[0.40]"
          >
            <source src="/assets/farm-bg.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>

          <div className="absolute inset-0 bg-linear-to-b from-black/40 via-black/20 to-[#07140d]" />
        </div>

        {/* Navbar */}
        <nav className="relative z-20 flex items-center justify-between px-6 py-6 md:px-8 max-w-7xl mx-auto">
          <div className="text-3xl font-black text-green-400 tracking-tighter drop-shadow-md">
            AgriHUB<span className="text-white">.LK</span>
          </div>

          <div className="hidden md:flex space-x-10 text-white font-semibold">
            <Link
              to="/products"
              className="hover:text-green-400 transition-colors duration-300"
            >
              Marketplace
            </Link>
            <Link
              to="/about"
              className="hover:text-green-400 transition-colors duration-300"
            >
              Our Mission
            </Link>
            <Link
              to="/contact"
              className="hover:text-green-400 transition-colors duration-300"
            >
              Contact
            </Link>
          </div>

          <div className="flex items-center space-x-3 md:space-x-5">
            <Link
              to="/login"
              className="px-4 md:px-6 py-2 text-white border border-white/30 rounded-full hover:bg-white hover:text-black transition-all duration-300 backdrop-blur-md"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="px-4 md:px-6 py-2 bg-green-500 text-white font-bold rounded-full hover:bg-green-600 hover:shadow-[0_0_20px_rgba(34,197,94,0.5)] transition-all duration-300"
            >
              Join Us
            </Link>
          </div>
        </nav>

        {/* Hero Content */}
        <main className="relative z-10 flex flex-col items-center justify-center text-center px-6 min-h-[78vh]">
          <div className="animate-fade-in-up max-w-5xl">
            {/* <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/15 backdrop-blur-md mb-6">
              <span className="w-2 h-2 rounded-full bg-green-400" />
              <span className="text-sm text-green-200 font-medium">
                Supporting SDG Goal 2 - Zero Hunger
              </span>
            </div> */}

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white mb-6 leading-[1.1] drop-shadow-2xl">
              Empowering Sri Lankan <br />
              <span className="text-green-400 underline decoration-green-500/30">
                Agricultural Trade.
              </span>
            </h1>

            <p className="max-w-3xl mx-auto text-lg md:text-2xl text-gray-200 mb-10 leading-relaxed font-light drop-shadow-lg">
              A unified digital ecosystem connecting{" "}
              <span className="font-semibold text-white">
                Farmers, Distributors, and Transporters
              </span>
              . Harnessing technology to support efficient agricultural trade and
              drive{" "}
              <span className="text-green-300 font-bold italic">
                Zero Hunger
              </span>{" "}
              across Sri Lanka.
            </p>

            <div className="flex flex-col sm:flex-row justify-center items-center gap-5">
              <Link
                to="/products"
                className="w-full sm:w-auto px-10 py-4 bg-green-500 text-white text-lg font-black rounded-2xl hover:bg-green-600 hover:-translate-y-1 transition-all duration-300 shadow-2xl active:scale-95"
              >
                Explore Market
              </Link>

              <Link
                to="/register"
                className="w-full sm:w-auto px-10 py-4 bg-white/10 backdrop-blur-xl border border-white/20 text-white text-lg font-bold rounded-2xl hover:bg-white/20 transition-all duration-300 shadow-xl active:scale-95"
              >
                Become a Partner
              </Link>
            </div>
          </div>
        </main>
      </section>

      {/* ================= ROLE SECTION WITH BACKGROUND IMAGES ================= */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 md:px-8 py-20">
        <div className="text-center mb-10">
          <p className="text-green-300 font-semibold uppercase tracking-[0.2em] text-sm mb-3">
            Platform Roles
          </p>
          <h2 className="text-3xl md:text-4xl font-black text-white mb-3">
            Built for Every Part of the Supply Chain
          </h2>
          <p className="text-gray-300 max-w-2xl mx-auto leading-relaxed">
            AGRIHUB-LK creates value for farmers, transporters, and distributors
            through one connected digital platform.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {roleCards.map((card) => (
            <div
              key={card.id}
              className={`relative min-h-105 rounded-3xl overflow-hidden border border-white/10 ${card.borderHover} transition-all duration-500 group hover:-translate-y-1`}
              style={{
                backgroundImage: `url(${card.image})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              {/* Image overlay */}
              <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/55 to-black/20 group-hover:from-black/85 group-hover:via-black/50 group-hover:to-black/10 transition-all duration-500" />

              {/* Content */}
              <div className="relative z-10 flex h-full flex-col justify-end p-8">
                <div
                  className={`w-12 h-12 ${card.badgeBg} rounded-xl mb-4 flex items-center justify-center text-white font-bold backdrop-blur-md`}
                >
                  {card.id}
                </div>

                <h3 className={`${card.titleColor} font-bold text-2xl mb-3`}>
                  {card.title}
                </h3>

                <p className="text-gray-200 leading-relaxed">
                  {card.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ================= FINAL CTA SECTION ================= */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 md:px-8 pb-16">
        <div className="bg-linear-to-r from-green-500/10 via-white/5 to-green-500/10 border border-white/10 rounded-3xl p-8 md:p-12 text-center backdrop-blur-2xl">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
            Join the Future of Agricultural Trade
          </h2>
          <p className="text-gray-300 max-w-2xl mx-auto leading-relaxed mb-8">
            Whether you are a farmer, distributor, or transporter, AGRIHUB-LK
            helps you become part of a smarter, more connected, and more
            sustainable food supply network.
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-5">
            <Link
              to="/register"
              className="w-full sm:w-auto px-10 py-4 bg-green-500 text-white text-lg font-bold rounded-2xl hover:bg-green-600 hover:-translate-y-1 transition-all duration-300"
            >
              Get Started
            </Link>

            <Link
              to="/about"
              className="w-full sm:w-auto px-10 py-4 bg-white/10 border border-white/20 text-white text-lg font-semibold rounded-2xl hover:bg-white/20 transition-all duration-300"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* ================= TRUSTED PARTNERS AT BOTTOM ================= */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 md:px-8 pb-24">
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 md:p-10">
          <div className="text-center mb-10">
            <p className="text-green-300 font-semibold uppercase tracking-[0.2em] text-sm mb-3">
              Trusted Network
            </p>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-3">
              Registered Distributors & Transporters
            </h2>
            <p className="text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Our platform is trusted by growing networks of distributors and
              transport partners across Sri Lanka.
            </p>
          </div>

          {/* Distributors */}
          {distributors.length > 0 && (
            <div className="mb-10">
              <h3 className="text-xl font-bold text-green-400 mb-5 text-center md:text-left">
                Distributors
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                {distributors.map((item) => (
                  <div
                    key={item.id}
                    className="group relative bg-white/10 border border-white/10 rounded-2xl p-5 flex flex-col items-center justify-center hover:bg-white/15 hover:-translate-y-1 transition-all duration-300 overflow-hidden h-28"
                  >
                    <img
                      src={item.logoUrl}
                      alt={item.name}
                      /* Removed the basic 'title' attribute for a custom tooltip */
                      className="max-h-14 object-contain grayscale group-hover:grayscale-0 group-hover:-translate-y-3 transition-all duration-300"
                    />

                    {/* Professional Hover Name Reveal */}
                    <div className="absolute bottom-3 left-0 right-0 opacity-0 group-hover:opacity-100 transition-all duration-300 flex justify-center translate-y-2 group-hover:translate-y-0">
                      <span className="text-xs font-bold text-green-400 tracking-wider uppercase text-center px-2 truncate drop-shadow-md">
                        {item.name}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Transporters */}
          {transporters.length > 0 && (
            <div>
              <h3 className="text-xl font-bold text-green-400 mb-5 text-center md:text-left">
                Transporters
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                {transporters.map((item) => (
                  <div
                    key={item.id}
                    className="group relative bg-white/10 border border-white/10 rounded-2xl p-5 flex flex-col items-center justify-center hover:bg-white/15 hover:-translate-y-1 transition-all duration-300 overflow-hidden h-28"
                  >
                    <img
                      src={item.logoUrl}
                      alt={item.name}
                      /* Removed the basic 'title' attribute */
                      className="max-h-14 object-contain grayscale group-hover:grayscale-0 group-hover:-translate-y-3 transition-all duration-300"
                    />

                    {/* Professional Hover Name Reveal */}
                    <div className="absolute bottom-3 left-0 right-0 opacity-0 group-hover:opacity-100 transition-all duration-300 flex justify-center translate-y-2 group-hover:translate-y-0">
                      <span className="text-xs font-bold text-green-400 tracking-wider uppercase text-center px-2 truncate drop-shadow-md">
                        {item.name}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {distributors.length === 0 && transporters.length === 0 && (
            <p className="text-center text-gray-400 italic">No partners registered with logos yet.</p>
          )}

        </div>
      </section>

      {/* ================= CUSTOM ANIMATION ================= */}
      <style>
        {`
          .animate-fade-in-up {
            animation: fadeInUp 0.8s ease-out;
          }

          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(24px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
    </div>
  );
};

export default Homepage;