import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Menu, X } from 'lucide-react';

const Layout: React.FC = () => {
  const { isAuthenticated, logout, userRole, currentUser } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  if (!isAuthenticated) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-blue-600 text-white shadow-md">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Link to="/" className="text-xl font-bold">
            Water Park Management
          </Link>
          
          <div className="hidden md:flex items-center space-x-4">
            <span className="font-medium">
              Welcome, {currentUser?.name} ({userRole})
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center bg-blue-700 hover:bg-blue-800 px-3 py-1 rounded"
            >
              <LogOut size={18} className="mr-1" />
              Logout
            </button>
          </div>
          
          <button className="md:hidden" onClick={toggleMenu}>
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>
      
      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-blue-500 text-white">
          <div className="container mx-auto px-4 py-2">
            <div className="flex flex-col space-y-2">
              <span className="font-medium">
                Welcome, {currentUser?.name} ({userRole})
              </span>
              
              {/* Navigation links */}
              <Link
                to="/"
                className="py-2 hover:bg-blue-600 px-2 rounded"
                onClick={() => setMenuOpen(false)}
              >
                Dashboard
              </Link>
              
              {(userRole === 'staff' || userRole === 'admin') && (
                <>
                  <Link
                    to="/bands"
                    className="py-2 hover:bg-blue-600 px-2 rounded"
                    onClick={() => setMenuOpen(false)}
                  >
                    Band Management
                  </Link>
                  <Link
                    to="/entry-exit"
                    className="py-2 hover:bg-blue-600 px-2 rounded"
                    onClick={() => setMenuOpen(false)}
                  >
                    Entry/Exit
                  </Link>
                </>
              )}
              
              {(userRole === 'admin' || userRole === 'owner') && (
                <>
                  <Link
                    to="/reports"
                    className="py-2 hover:bg-blue-600 px-2 rounded"
                    onClick={() => setMenuOpen(false)}
                  >
                    Reports
                  </Link>
                  <Link
                    to="/activity"
                    className="py-2 hover:bg-blue-600 px-2 rounded"
                    onClick={() => setMenuOpen(false)}
                  >
                    Activity Logs
                  </Link>
                </>
              )}
              
              {userRole === 'admin' && (
                <Link
                  to="/users"
                  className="py-2 hover:bg-blue-600 px-2 rounded"
                  onClick={() => setMenuOpen(false)}
                >
                  User Management
                </Link>
              )}
              
              <button
                onClick={handleLogout}
                className="flex items-center bg-blue-700 hover:bg-blue-800 py-2 px-2 rounded"
              >
                <LogOut size={18} className="mr-1" />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Sidebar and content */}
      <div className="flex flex-1">
        {/* Sidebar - hidden on mobile */}
        <aside className="hidden md:block w-64 bg-white shadow-md">
          <nav className="p-4">
            <ul className="space-y-2">
              <li>
                <Link
                  to="/"
                  className="block py-2 px-4 rounded hover:bg-blue-100 transition-colors"
                >
                  Dashboard
                </Link>
              </li>
              
              {(userRole === 'staff' || userRole === 'admin') && (
                <>
                  <li>
                    <Link
                      to="/bands"
                      className="block py-2 px-4 rounded hover:bg-blue-100 transition-colors"
                    >
                      Band Management
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/entry-exit"
                      className="block py-2 px-4 rounded hover:bg-blue-100 transition-colors"
                    >
                      Entry/Exit
                    </Link>
                  </li>
                </>
              )}
              
              {(userRole === 'admin' || userRole === 'owner') && (
                <>
                  <li>
                    <Link
                      to="/reports"
                      className="block py-2 px-4 rounded hover:bg-blue-100 transition-colors"
                    >
                      Reports
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/activity"
                      className="block py-2 px-4 rounded hover:bg-blue-100 transition-colors"
                    >
                      Activity Logs
                    </Link>
                  </li>
                </>
              )}
              
              {userRole === 'admin' && (
                <li>
                  <Link
                    to="/users"
                    className="block py-2 px-4 rounded hover:bg-blue-100 transition-colors"
                  >
                    User Management
                  </Link>
                </li>
              )}
            </ul>
          </nav>
        </aside>
        
        {/* Main content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;