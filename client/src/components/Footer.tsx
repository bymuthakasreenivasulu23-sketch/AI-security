import React from 'react';
import { Shield, Lock, EyeOff, Github } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 text-xs py-8 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-blue-500" />
            <span className="font-bold text-white text-sm">TrustLens AI</span>
            <span className="text-slate-500">|</span>
            <span>AI-Powered Dark Pattern & Privacy Trap Detector</span>
          </div>

          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-1 text-slate-300">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Zero-Tracking Guarantee</span>
            </div>
            <div className="flex items-center space-x-1 text-slate-300">
              <EyeOff className="w-3.5 h-3.5 text-blue-400" />
              <span>Telemetry OFF by default</span>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px]">
          <p>© {new Date().getFullYear()} TrustLens AI. Built with Google Gemini, React, Express, and PostgreSQL.</p>
          <div className="flex items-center space-x-4">
            <Link to="/about" className="hover:text-white transition">About</Link>
            <Link to="/privacy" className="hover:text-white transition">Privacy Architecture</Link>
            <Link to="/demo" className="hover:text-white transition">Test Demo Lab</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
