import React from 'react';
import { Link } from 'react-router-dom';

const Homepage = () => {
  return (
    <div className="relative min-h-screen w-full overflow-hidden font-sans bg-green-900">
      
      {/* 1. Video Background Container */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className="h-full w-full object-cover brightness-[0.40] transition-opacity duration-1000"
          onCanPlayThrough={(e) => e.target.classList.remove('opacity-0')}
        >
          {/* In React, / refers directly to the 'public' folder. 
              Ensure the file is in public/assets/farm-bg.mp4 
          */}
          <source src="/assets/farm-bg.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        
        {/* Dark Gradient Overlay: Essential for white text contrast */}
        <div className="absolute inset-0 bg-linear-to-b from-black/40 via-transparent to-black/70"></div>
      </div>

      {/* 2. Navigation Bar */}
      <nav className="relative z-20 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="text-3xl font-black text-green-400 tracking-tighter drop-shadow-md">
          AgriHUB<span className="text-white">.LK</span>
        </div>
        
        <div className="hidden md:flex space-x-10 text-white font-semibold">
          <Link to="/products" className="hover:text-green-400 transition-colors duration-300">Marketplace</Link>
          <Link to="/about" className="hover:text-green-400 transition-colors duration-300">Our Mission</Link>
          <Link to="/contact" className="hover:text-green-400 transition-colors duration-300">Contact</Link>
        </div>

        <div className="flex items-center space-x-5">
          <Link 
            to="/login" 
            className="px-6 py-2 text-white border border-white/30 rounded-full hover:bg-white hover:text-black transition-all duration-300 backdrop-blur-md"
          >
            Login
          </Link>
          <Link 
            to="/register" 
            className="px-6 py-2 bg-green-500 text-white font-bold rounded-full hover:bg-green-600 hover:shadow-[0_0_20px_rgba(34,197,94,0.5)] transition-all duration-300"
          >
            Join Us
          </Link>
        </div>
      </nav>

      {/* 3. Hero Content */}
      <main className="relative z-10 flex flex-col items-center justify-center text-center px-6 h-[70vh]">
        <div className="animate-fade-in-up">
          <h1 className="text-5xl md:text-8xl font-black text-white mb-6 leading-[1.1] drop-shadow-2xl">
            Empowering Sri Lankan <br /> 
            <span className="text-green-400 underline decoration-green-500/30">Agricultural Trade.</span>
          </h1>
          
          <p className="max-w-3xl mx-auto text-lg md:text-2xl text-gray-200 mb-12 leading-relaxed font-light drop-shadow-lg">
            A unified digital ecosystem connecting <span className="font-semibold text-white">Farmers, Distributors, and Transporters</span>. 
            Harnessing technology to drive <span className="text-green-300 font-bold italic">Zero Hunger</span> across the island.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center items-center gap-6">
            <Link 
              to="/products" 
              className="w-full sm:w-auto px-12 py-5 bg-green-500 text-white text-xl font-black rounded-2xl hover:bg-green-600 hover:-translate-y-1 transition-all duration-300 shadow-2xl active:scale-95"
            >
              Explore Market
            </Link>
            <Link 
              to="/register" 
              className="w-full sm:w-auto px-12 py-5 bg-white/10 backdrop-blur-xl border border-white/20 text-white text-xl font-bold rounded-2xl hover:bg-white/20 transition-all duration-300 shadow-xl active:scale-95"
            >
              Start Selling
            </Link>
          </div>
        </div>
      </main>

      {/* 4. Role Summary Cards */}
      <section className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 px-8 md:px-24 pb-16 max-w-7xl mx-auto">
        <div className="bg-white/5 backdrop-blur-2xl p-8 rounded-3xl border border-white/10 hover:border-green-500/50 transition-all duration-500 group">
          <div className="w-12 h-12 bg-green-500/20 rounded-xl mb-4 flex items-center justify-center text-green-400 font-bold">01</div>
          <h3 className="text-green-400 font-bold text-2xl mb-3">Farmer</h3>
          <p className="text-gray-300 leading-relaxed">Direct market access. List your harvest and get paid instantly via secure digital channels.</p>
        </div>

        <div className="bg-white/5 backdrop-blur-2xl p-8 rounded-3xl border border-white/10 hover:border-blue-500/50 transition-all duration-500 group">
          <div className="w-12 h-12 bg-blue-500/20 rounded-xl mb-4 flex items-center justify-center text-blue-400 font-bold">02</div>
          <h3 className="text-blue-400 font-bold text-2xl mb-3">Transporter</h3>
          <p className="text-gray-300 leading-relaxed">Smart trip management. Find loads, optimize routes, and maximize your vehicle's efficiency.</p>
        </div>

        <div className="bg-white/5 backdrop-blur-2xl p-8 rounded-3xl border border-white/10 hover:border-yellow-500/50 transition-all duration-500 group">
          <div className="w-12 h-12 bg-yellow-500/20 rounded-xl mb-4 flex items-center justify-center text-yellow-400 font-bold">03</div>
          <h3 className="text-yellow-400 font-bold text-2xl mb-3">Distributor</h3>
          <p className="text-gray-300 leading-relaxed">Seamless sourcing. Bulk inventory management with real-time tracking and Stripe payments.</p>
        </div>
      </section>
    </div>
  );
};

export default Homepage;