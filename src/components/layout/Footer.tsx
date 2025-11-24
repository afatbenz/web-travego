import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Facebook, Twitter, Instagram } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 dark:bg-black text-white">
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <MapPin className="h-8 w-8 text-blue-400" />
              <span className="text-xl font-bold">
                <span className="text-cyan-500">Trave</span><span className="text-orange-500">GO</span>
              </span>
            </div>
            <p className="text-gray-400 mb-4">
              Solusi terpercaya untuk semua kebutuhan perjalanan Anda. 
              Dari rental mobil hingga paket wisata lengkap, kami siap 
              memberikan pengalaman terbaik.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <div className="space-y-2">
              <Link to="/catalog" className="block text-gray-400 hover:text-white transition-colors">
                Katalog
              </Link>
              <Link to="/services" className="block text-gray-400 hover:text-white transition-colors">
                Layanan
              </Link>
              <Link to="/team" className="block text-gray-400 hover:text-white transition-colors">
                Tim Kami
              </Link>
              <Link to="/contact" className="block text-gray-400 hover:text-white transition-colors">
                Kontak
              </Link>
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Kontak</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-blue-400" />
                <span className="text-gray-400">+62 21 1234 5678</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-blue-400" />
                <span className="text-gray-400">info@TraveGO.com</span>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="h-4 w-4 text-blue-400" />
                <span className="text-gray-400">Jakarta, Indonesia</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2025 <span className="text-cyan-500">Trave</span><span className="text-orange-500">GO</span>. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};