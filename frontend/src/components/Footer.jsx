import React from 'react';
import { Film } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="w-full bg-cosmic-darker border-t border-white/5 py-8 mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 text-silver text-xs">
        {/* Left branding */}
        <div className="flex items-center space-x-2">
          <Film className="h-4 w-4 text-coral" />
          <span className="font-bold text-white tracking-wider uppercase">
            OTT STREAM
          </span>
          <span className="text-silver/40">| © 2026. All rights reserved.</span>
        </div>

        {/* Links */}
        <div className="flex items-center space-x-6">
          <a href="#" className="hover:text-coral transition-colors">Terms of Use</a>
          <a href="#" className="hover:text-coral transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-coral transition-colors">Corporate Info</a>
          <a href="#" className="hover:text-coral transition-colors">Help Center</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
