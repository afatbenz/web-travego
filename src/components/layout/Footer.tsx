import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail } from 'lucide-react';
import travegoLightLogo from '@/assets/general/travego-light.png';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-950">
      <div className="mx-auto max-w-7xl px-6 pb-10 pt-10">
        <div className="grid gap-8 border-t border-white/10 pt-10 text-sm text-gray-300 md:grid-cols-4">
          <div>
            <img src={travegoLightLogo} alt="TraveGO" className="mb-4 h-8 w-auto" />
            <p className="max-w-xs text-gray-400">Platform all-in-one untuk mengelola operasional travel modern secara lebih efisien.</p>
          </div>
          <div>
            <h4 className="mb-3 font-semibold text-white">Quick Links</h4>
            <div className="space-y-2">
              <Link to="/" className="block text-gray-400 transition-colors hover:text-white">Home</Link>
              <Link to="/services" className="block text-gray-400 transition-colors hover:text-white">Fitur</Link>
              <Link to="/pricing" className="block text-gray-400 transition-colors hover:text-white">Pricing</Link>
              <Link to="/contact" className="block text-gray-400 transition-colors hover:text-white">Kontak</Link>
            </div>
          </div>
          <div>
            <h4 className="mb-3 font-semibold text-white">Fitur</h4>
            <div className="space-y-2">
              <p>Dashboard</p>
              <p>Order Management</p>
              <p>Finance Report</p>
              <p>Whatsapp Assistant</p>
            </div>
          </div>
          <div>
            <h4 className="mb-3 font-semibold text-white">Kontak</h4>
            <div className="space-y-2 text-gray-400">
              <p className="flex items-center gap-2"><Phone className="h-4 w-4" /> +62 813 8888 9879</p>
              <p className="flex items-center gap-2"><Mail className="h-4 w-4" /> hello@travego.id</p>
              <p>Jakarta, Indonesia</p>
            </div>
          </div>
          <div className="md:col-span-4 mt-6 border-t border-white/10 pt-6 text-center text-xs text-gray-500">
            <p>© 2026 TraveGO. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};