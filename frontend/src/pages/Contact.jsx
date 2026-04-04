import React from "react";
import { Link } from "react-router-dom";

const Contact = () => {
  const contactInfo = [
    {
      title: "Email Us",
      value: "support@agrihub.lk",
      description: "For general questions, support, and partnership inquiries.",
      color: "text-green-400",
      bg: "bg-green-500/15",
    },
    {
      title: "Call Us",
      value: "+94 71 234 5678",
      description: "Reach us during working hours for direct assistance.",
      color: "text-blue-400",
      bg: "bg-blue-500/15",
    },
    {
      title: "Visit Us",
      value: "Colombo, Sri Lanka",
      description: "Connecting agricultural communities across the country.",
      color: "text-yellow-400",
      bg: "bg-yellow-500/15",
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
              className="hover:text-green-400 transition-colors duration-300"
            >
              Our Mission
            </Link>
            <Link
              to="/contact"
              className="text-green-400 transition-colors duration-300"
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

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.15),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.12),transparent_30%)]" />
        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-8 pt-20 pb-20">
          <div className="text-center max-w-4xl mx-auto animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/10 backdrop-blur-md mb-6">
              <span className="w-2 h-2 rounded-full bg-green-400" />
              <span className="text-sm text-green-200 font-medium">
                Contact AGRIHUB-LK
              </span>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black leading-tight mb-6">
              Let’s <span className="text-green-400">Connect</span>
            </h1>

            <p className="text-lg md:text-xl text-gray-300 leading-relaxed max-w-3xl mx-auto">
              Have questions, ideas, or partnership inquiries? We would love to
              hear from you. Reach out and let’s build a stronger agricultural
              network together.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="max-w-7xl mx-auto px-6 md:px-8 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {contactInfo.map((item, index) => (
            <div
              key={index}
              className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-2xl hover:-translate-y-1 transition-all duration-300"
            >
              <div
                className={`w-14 h-14 rounded-2xl ${item.bg} ${item.color} flex items-center justify-center font-bold mb-5`}
              >
                0{index + 1}
              </div>
              <h3 className={`text-2xl font-black mb-3 ${item.color}`}>
                {item.title}
              </h3>
              <p className="text-white font-semibold mb-3">{item.value}</p>
              <p className="text-gray-300 leading-7">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Contact Form + Side Info */}
      <section className="max-w-7xl mx-auto px-6 md:px-8 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Contact Form */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 md:p-10 backdrop-blur-2xl">
            <p className="text-green-300 uppercase tracking-[0.2em] text-sm font-semibold mb-4">
              Send a Message
            </p>
            <h2 className="text-3xl md:text-4xl font-black mb-6">
              Get in Touch
            </h2>

            <form className="space-y-5">
              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  className="w-full rounded-2xl bg-white/10 border border-white/10 px-5 py-4 text-white placeholder:text-gray-400 outline-none focus:border-green-400 transition"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full rounded-2xl bg-white/10 border border-white/10 px-5 py-4 text-white placeholder:text-gray-400 outline-none focus:border-green-400 transition"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  placeholder="Enter subject"
                  className="w-full rounded-2xl bg-white/10 border border-white/10 px-5 py-4 text-white placeholder:text-gray-400 outline-none focus:border-green-400 transition"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Message
                </label>
                <textarea
                  rows="6"
                  placeholder="Write your message here..."
                  className="w-full rounded-2xl bg-white/10 border border-white/10 px-5 py-4 text-white placeholder:text-gray-400 outline-none focus:border-green-400 transition resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto px-10 py-4 bg-green-500 text-white text-lg font-bold rounded-2xl hover:bg-green-600 hover:-translate-y-1 transition-all duration-300"
              >
                Send Message
              </button>
            </form>
          </div>

          {/* Right Side Info */}
          <div className="space-y-8">
            <div className="bg-linear-to-br from-green-500/10 to-white/5 border border-white/10 rounded-3xl p-8 md:p-10 backdrop-blur-2xl">
              <p className="text-green-300 uppercase tracking-[0.2em] text-sm font-semibold mb-4">
                Why Contact Us
              </p>
              <h2 className="text-3xl md:text-4xl font-black mb-5">
                We’re here to support you
              </h2>
              <p className="text-gray-300 leading-8 mb-5">
                Whether you are a farmer looking for market opportunities, a
                distributor seeking reliable sourcing, or a transporter wanting
                to connect with logistics opportunities, AGRIHUB-LK is here to
                help.
              </p>
              <p className="text-gray-300 leading-8">
                We also welcome collaboration ideas, feedback, and partnership
                discussions that can strengthen Sri Lanka’s agricultural
                ecosystem.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 md:p-10 backdrop-blur-2xl">
              <p className="text-green-300 uppercase tracking-[0.2em] text-sm font-semibold mb-4">
                Quick Support
              </p>
              <ul className="space-y-4 text-gray-300">
                <li className="flex items-start gap-3">
                  <span className="text-green-400 mt-1">•</span>
                  Account and registration assistance
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-400 mt-1">•</span>
                  Marketplace and platform usage support
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-400 mt-1">•</span>
                  Business and partnership inquiries
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-400 mt-1">•</span>
                  General questions and feedback
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="max-w-7xl mx-auto px-6 md:px-8 pb-24">
        <div className="bg-linear-to-r from-green-500/10 via-white/5 to-green-500/10 border border-white/10 rounded-3xl p-8 md:p-12 text-center backdrop-blur-2xl">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
            Ready to Work Together?
          </h2>
          <p className="text-gray-300 max-w-2xl mx-auto leading-8 mb-8">
            Join AGRIHUB-LK and become part of a connected agricultural network
            built for growth, collaboration, and sustainability.
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
              Learn About Our Mission
            </Link>
          </div>
        </div>
      </section>

      {/* Animation */}
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

export default Contact;