import { useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { Car, Users, LogOut, Menu, X, DollarSign, User } from 'lucide-react';

export default function Dashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition duration-200 ease-in-out z-30`}>
        <div className="w-64 h-full bg-white shadow-lg">
          <div className="flex items-center justify-between h-16 px-4 border-b">
            <Link to="/dashboard" className="flex items-center space-x-2">
              <Car className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold">Admin</span>
            </Link>
            <button
              className="md:hidden"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="px-4 py-6 space-y-2">
            <Link
              to="/dashboard/vehicles"
              className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
            >
              <Car className="h-5 w-5" />
              <span>Vehicles</span>
            </Link>
            <Link
              to="/dashboard/users"
              className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
            >
              <Users className="h-5 w-5" />
              <span>Users</span>
            </Link>
            <Link
              to="/dashboard/dividend"
              className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
            >
              <DollarSign className="h-5 w-5" />
              <span>Dividend</span>
            </Link>
            <button
              onClick={() => navigate('/login')}
              className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md w-full"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="md:ml-64">
        <header className="bg-white shadow-sm">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              className="md:hidden"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-gray-900"
                >
                  <User className="h-6 w-6" />
                  <span>Admin User</span>
                </button>
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                    <Link
                      to="/dashboard/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Your Profile
                    </Link>
                    <Link
                      to="/dashboard/settings"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Settings
                    </Link>
                    <hr className="my-1" />
                    <button
                      onClick={() => navigate('/login')}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}