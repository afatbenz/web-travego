import { Menu, X, Car, Bus } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-white shadow-lg fixed w-full z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <Car className="h-8 w-8 text-primary" />
              <Bus className="h-8 w-8 text-secondary" />
              <span className="text-2xl font-bold text-gray-900">RentGo</span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-gray-700 hover:text-primary">Home</Link>
            <Link to="/catalog" className="text-gray-700 hover:text-primary">Vehicles</Link>
            <Link to="/about" className="text-gray-700 hover:text-primary">About Us</Link>
            <Link to="/team" className="text-gray-700 hover:text-primary">Our Team</Link>
            <Link to="/blog" className="text-gray-700 hover:text-primary">Blog</Link>
            <Link to="/contact" className="text-gray-700 hover:text-primary">Contact</Link>
            <Link to="/admin" className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark">
              Admin Login
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-700 hover:text-primary focus:outline-none"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link to="/" className="block px-3 py-2 text-gray-700 hover:text-primary">Home</Link>
            <Link to="/catalog" className="block px-3 py-2 text-gray-700 hover:text-primary">Vehicles</Link>
            <Link to="/about" className="block px-3 py-2 text-gray-700 hover:text-primary">About Us</Link>
            <Link to="/team" className="block px-3 py-2 text-gray-700 hover:text-primary">Our Team</Link>
            <Link to="/blog" className="block px-3 py-2 text-gray-700 hover:text-primary">Blog</Link>
            <Link to="/contact" className="block px-3 py-2 text-gray-700 hover:text-primary">Contact</Link>
            <Link to="/admin" className="block px-3 py-2 bg-primary text-white rounded-md">Admin Login</Link>
          </div>
        </div>
      )}
    </nav>
  );
}