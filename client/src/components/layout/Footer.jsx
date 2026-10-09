import React from 'react';
import { Link } from 'react-router-dom';
import { Plane, Heart, Mail, Phone, MapPin, Globe, Twitter, Instagram, Facebook, Github } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-8 border-t border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary-600 to-secondary-500 flex items-center justify-center text-white font-bold">
                <Plane className="w-5 h-5" />
              </div>
              <span className="text-xl font-black tracking-tight text-white">
                TripPilot<span className="text-secondary-400"> AI</span>
              </span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              Your AI Travel Copilot — plan journeys, compare flights, find stays, and build itineraries powered by intelligence.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a href="#" className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-secondary-600 hover:text-white text-slate-400 flex items-center justify-center transition">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-secondary-600 hover:text-white text-slate-400 flex items-center justify-center transition">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-secondary-600 hover:text-white text-slate-400 flex items-center justify-center transition">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-secondary-600 hover:text-white text-slate-400 flex items-center justify-center transition">
                <Github className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white text-sm font-bold uppercase tracking-wider mb-4">Explore</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/explore" className="hover:text-secondary-400 transition">Destinations</Link></li>
              <li><Link to="/plan-trip" className="hover:text-secondary-400 transition">Plan Trip</Link></li>
              <li><Link to="/my-trips" className="hover:text-secondary-400 transition">My Trips</Link></li>
              <li><Link to="/wishlist" className="hover:text-secondary-400 transition">Saved Wishlist</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-white text-sm font-bold uppercase tracking-wider mb-4">Company</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/about" className="hover:text-secondary-400 transition">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-secondary-400 transition">Contact Us</Link></li>
              <li><Link to="/admin" className="hover:text-amber-400 transition">Admin Portal</Link></li>
              <li><a href="#" className="hover:text-secondary-400 transition">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-secondary-400 transition">Terms of Service</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white text-sm font-bold uppercase tracking-wider mb-4">Contact</h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-secondary-400 shrink-0" />
                <span>CSE Dept, University Campus</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-secondary-400 shrink-0" />
                <span>support@trippilot.ai</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-secondary-400 shrink-0" />
                <span>+91 (800) 123-TRIP</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} TripPilot AI. All rights reserved. Built for CSE Project Demo.</p>
          <div className="flex items-center gap-1">
            <span>Crafted with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-current" />
            <span>for intelligent travel planning.</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
