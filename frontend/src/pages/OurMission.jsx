import React from "react";
import { Link } from "react-router-dom";

const OurMission = () => {
  const values = [
    {
      title: "Empower Farmers",
      description:
        "We help farmers reach better market opportunities, improve visibility for their products, and connect directly with trusted buyers.",
      color: "text-green-400",
      bg: "bg-green-500/15",
    },
    {
      title: "Strengthen Distribution",
      description:
        "We support distributors with better access to agricultural products, smoother sourcing processes, and more efficient coordination.",
      color: "text-yellow-400",
      bg: "bg-yellow-500/15",
    },
    {
      title: "Enable Smart Transport",
      description:
        "We connect transporters with agricultural logistics opportunities, helping goods move efficiently from farms to destinations.",
      color: "text-blue-400",
      bg: "bg-blue-500/15",
    },
  ];

  const pillars = [
    {
      number: "01",
      title: "Accessibility",
      description:
        "Creating a digital space where all stakeholders in agriculture can connect more easily and work together.",
    },
    {
      number: "02",
      title: "Efficiency",
      description:
        "Reducing delays and improving coordination in the agricultural supply chain through one connected platform.",
    },
    {
      number: "03",
      title: "Sustainability",
      description:
        "Supporting long-term agricultural growth and contributing to food security through digital innovation.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#07140d] text-white font-sans">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#07140d]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-5 md:px-8">
          <Link
            to="/"
            className="text-3xl font-black text-green-400 tracking-tighter drop-shadow-md"
          >
            AgriHUB<span className="text-white">.LK</span>
          </Link>

          <div className="hidden md:flex space-x-10 text-white font-semibold">
            <Link
              to="/"
              className="hover:text-green-400 transition-colors duration-300"
            >
              Home
            </Link>
            <Link
              to="/products"
              className="hover:text-green-400 transition-colors duration-300"
            >
              Marketplace
            </Link>
            <Link
              to="/about"
              className="text-green-400 transition-colors duration-300"
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
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.15),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.12),transparent_30%)]" />
        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-8 pt-20 pb-20">
          <div className="text-center max-w-4xl mx-auto animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/10 backdrop-blur-md mb-6">
              <span className="w-2 h-2 rounded-full bg-green-400" />
              <span className="text-sm text-green-200 font-medium">
                AGRIHUB-LK Mission
              </span>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black leading-tight mb-6">
              Building a Smarter Future for{" "}
              <span className="text-green-400">Sri Lankan Agriculture</span>
            </h1>

            <p className="text-lg md:text-xl text-gray-300 leading-relaxed max-w-3xl mx-auto">
              AGRIHUB-LK exists to connect farmers, distributors, and transporters
              in one digital ecosystem, creating a more efficient, accessible, and
              sustainable agricultural supply chain.
            </p>
          </div>
        </div>
      </section>

      {/* Main Mission Section */}
      <section className="max-w-7xl mx-auto px-6 md:px-8 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 md:p-10 backdrop-blur-2xl">
            <p className="text-green-300 uppercase tracking-[0.2em] text-sm font-semibold mb-4">
              Our Mission
            </p>
            <h2 className="text-3xl md:text-4xl font-black mb-5">
              Connecting agriculture with opportunity
            </h2>
            <p className="text-gray-300 leading-8 mb-5">
              Our mission is to bridge the gap between production, distribution,
              and transportation in Sri Lanka’s agricultural sector by using
              technology to create stronger connections between stakeholders.
            </p>
            <p className="text-gray-300 leading-8">
              Through AGRIHUB-LK, we aim to reduce inefficiencies, improve access
              to markets, support smoother logistics, and create a platform that
              contributes to a more reliable and sustainable food supply system.
            </p>
          </div>

          <div className="bg-linear-to-br from-green-500/10 to-white/5 border border-white/10 rounded-3xl p-8 md:p-10 backdrop-blur-2xl">
            <p className="text-green-300 uppercase tracking-[0.2em] text-sm font-semibold mb-4">
              Our Vision
            </p>
            <h2 className="text-3xl md:text-4xl font-black mb-5">
              A connected and sustainable agricultural ecosystem
            </h2>
            <p className="text-gray-300 leading-8 mb-5">
              We envision a future where farmers have better access to buyers,
              distributors can source products more efficiently, and transporters
              can play a stronger role in enabling agricultural growth.
            </p>
            <p className="text-gray-300 leading-8">
              By creating a trusted digital platform, we hope to support economic
              growth, improve collaboration, and contribute to national food
              security with modern technological solutions.
            </p>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="max-w-7xl mx-auto px-6 md:px-8 pb-20">
        <div className="text-center mb-10">
          <p className="text-green-300 uppercase tracking-[0.2em] text-sm font-semibold mb-3">
            What Drives Us
          </p>
          <h2 className="text-3xl md:text-4xl font-black mb-4">
            Our Core Focus Areas
          </h2>
          <p className="text-gray-300 max-w-2xl mx-auto leading-7">
            AGRIHUB-LK is designed around the real needs of agricultural
            stakeholders and the goal of making the supply chain more connected.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {values.map((item, index) => (
            <div
              key={index}
              className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-2xl hover:-translate-y-1 transition-all duration-300"
            >
              <div
                className={`w-14 h-14 rounded-2xl ${item.bg} ${item.color} flex items-center justify-center font-bold mb-5`}
              >
                0{index + 1}
              </div>
              <h3 className={`text-2xl font-black mb-4 ${item.color}`}>
                {item.title}
              </h3>
              <p className="text-gray-300 leading-7">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SDG Section */}
      <section className="max-w-7xl mx-auto px-6 md:px-8 pb-20">
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 md:p-12 backdrop-blur-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <p className="text-green-300 uppercase tracking-[0.2em] text-sm font-semibold mb-4">
                SDG Alignment
              </p>
              <h2 className="text-3xl md:text-4xl font-black mb-5">
                Supporting SDG 2: Zero Hunger
              </h2>
              <p className="text-gray-300 leading-8 mb-5">
                AGRIHUB-LK is aligned with the United Nations Sustainable
                Development Goal 2, which aims to end hunger, achieve food
                security, improve nutrition, and promote sustainable agriculture.
              </p>
              <p className="text-gray-300 leading-8">
                By improving coordination between farmers, distributors, and
                transporters, our platform contributes to better food movement,
                reduced inefficiencies, and stronger support for agricultural
                communities.
              </p>
            </div>

            <div className="bg-linear-to-br from-green-500/15 to-transparent border border-green-500/20 rounded-3xl p-8">
              <div className="text-6xl md:text-7xl font-black text-green-400 mb-4">
                2
              </div>
              <h3 className="text-2xl md:text-3xl font-black mb-4">
                Zero Hunger
              </h3>
              <p className="text-gray-300 leading-7">
                Our platform focuses on strengthening the agricultural ecosystem
                so food can move more effectively from producers to the people and
                businesses that need it.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pillars Section */}
      <section className="max-w-7xl mx-auto px-6 md:px-8 pb-20">
        <div className="text-center mb-10">
          <p className="text-green-300 uppercase tracking-[0.2em] text-sm font-semibold mb-3">
            Our Approach
          </p>
          <h2 className="text-3xl md:text-4xl font-black mb-4">
            How We Create Impact
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {pillars.map((item, index) => (
            <div
              key={index}
              className="relative bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-2xl"
            >
              <div className="text-5xl font-black text-white/10 absolute top-6 right-6">
                {item.number}
              </div>
              <h3 className="text-2xl font-black text-white mb-4">
                {item.title}
              </h3>
              <p className="text-gray-300 leading-7">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="max-w-7xl mx-auto px-6 md:px-8 pb-24">
        <div className="bg-linear-to-r from-green-500/10 via-white/5 to-green-500/10 border border-white/10 rounded-3xl p-8 md:p-12 text-center backdrop-blur-2xl">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
            Join Our Mission
          </h2>
          <p className="text-gray-300 max-w-2xl mx-auto leading-8 mb-8">
            Be part of a platform that is working to modernize agricultural trade,
            strengthen collaboration, and support a more sustainable future for
            Sri Lanka.
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-5">
            <Link
              to="/register"
              className="w-full sm:w-auto px-10 py-4 bg-green-500 text-white text-lg font-bold rounded-2xl hover:bg-green-600 hover:-translate-y-1 transition-all duration-300"
            >
              Get Started
            </Link>

            <Link
              to="/contact"
              className="w-full sm:w-auto px-10 py-4 bg-white/10 border border-white/20 text-white text-lg font-semibold rounded-2xl hover:bg-white/20 transition-all duration-300"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>

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

export default OurMission;