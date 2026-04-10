import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";

// ===== IMPORT YOUR ROLE CARD IMAGES FROM src/assets =====
import farmerImg from "../assets/farmer.png";
import transporterImg from "../assets/transporter.png";
import distributorImg from "../assets/distributor.png";

// ===== IF YOUR VIDEO IS IN public/assets, KEEP THIS PATH BELOW =====
// <source src="/assets/farm-bg.mp4" type="video/mp4" />

const Homepage = () => {
  // --- State for dynamic logos ---
  const [distributors, setDistributors] = useState([]);
  const [transporters, setTransporters] = useState([]);

  // --- Chatbot states ---
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      type: "bot",
      text: "Hello! I'm the AgriHUB-LK assistant. How can I help you today?",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // --- Fetch logos on mount ---
  useEffect(() => {
    const fetchLogos = async () => {
      try {
        const distRes = await fetch("http://localhost:3000/api/users/distributors/logos");
        if (distRes.ok) {
          const distData = await distRes.json();
          if (distData.success) {
            setDistributors(distData.data);
          }
        }

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

  // --- Auto-scroll chat to bottom ---
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --- Focus input when chat opens ---
  useEffect(() => {
    if (isChatOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isChatOpen]);

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

  // --- Chatbot: Send message handler ---
  const handleSendMessage = async (e) => {
    e.preventDefault();
    const question = inputValue.trim();
    if (!question) return;

    // Add user message
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
      if (data.success) {
        setMessages((prev) => [...prev, { type: "bot", text: data.answer }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { type: "bot", text: "Sorry, I couldn't process that. Please try again." },
        ]);
      }
    } catch (error) {
      console.error("Chat API error:", error);
      setMessages((prev) => [
        ...prev,
        { type: "bot", text: "Network error. Please check your connection and try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

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
                      className="max-h-14 object-contain grayscale group-hover:grayscale-0 group-hover:-translate-y-3 transition-all duration-300"
                    />
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
                      className="max-h-14 object-contain grayscale group-hover:grayscale-0 group-hover:-translate-y-3 transition-all duration-300"
                    />
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

      {/* ================= CHATBOT WIDGET ================= */}
      {/* Floating Button */}
      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-green-500 hover:bg-green-600 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-green-500/30"
        aria-label="Chat with support"
      >
        {isChatOpen ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
        )}
      </button>

      {/* Chat Panel */}
      <div
        className={`fixed bottom-24 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] bg-[#0a1a12] border border-green-500/30 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 origin-bottom-right ${
          isChatOpen
            ? "scale-100 opacity-100 translate-y-0"
            : "scale-95 opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        {/* Header */}
        <div className="bg-green-600/90 backdrop-blur-sm px-5 py-4 flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-green-700 font-bold text-lg">
            A
          </div>
          <div>
            <h3 className="font-bold text-white">AgriHUB Assistant</h3>
            <p className="text-xs text-green-100">Online • Ask me anything</p>
          </div>
        </div>

        {/* Messages Area */}
        <div className="h-96 overflow-y-auto p-4 space-y-4 bg-[#07140d]">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                  msg.type === "user"
                    ? "bg-green-600 text-white rounded-br-none"
                    : "bg-gray-800 text-gray-100 rounded-bl-none"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-800 px-4 py-3 rounded-2xl rounded-bl-none">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form onSubmit={handleSendMessage} className="p-4 bg-[#0a1a12] border-t border-green-500/20">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type your question..."
              className="flex-1 bg-black/30 border border-green-500/30 rounded-xl px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white p-2 rounded-xl transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </form>
      </div>

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