import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Home, Plus, FolderOpen, User, LogOut, CreditCard } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { cn } from '../../utils/cn';

export const Layout: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Home' },
    { path: '/create', icon: Plus, label: 'Create' },
    { path: '/projects', icon: FolderOpen, label: 'Projects' },
    { path: '/account', icon: User, label: 'Account' },
  ];

  return (
    <div className="min-h-screen bg-secondary-off-white flex flex-col">
      {/* Top Header */}
      <header className="bg-primary-navy text-white shadow-lg safe-area-top">
        <div className="container-custom py-4 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2">
            <span className="text-2xl font-montserrat font-bold">🎨 Sum Decor</span>
          </Link>

          {user && (
            <div className="flex items-center gap-4">
              {/* Credits Badge */}
              <Link
                to="/account"
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors"
              >
                <CreditCard className="w-4 h-4" />
                <span className="font-semibold">{user.credits_balance} credits</span>
              </Link>

              {/* Logout Button (Desktop) */}
              <button
                onClick={handleLogout}
                className="hidden md:flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container-custom py-6">
        <Outlet />
      </main>

      {/* Bottom Navigation (Mobile) */}
      <nav className="md:hidden bg-white border-t border-gray-200 safe-area-bottom">
        <div className="flex items-center justify-around py-2">
          {navItems.map(({ path, icon: Icon, label }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={cn(
                  'flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors',
                  isActive
                    ? 'text-primary-navy'
                    : 'text-gray-500 hover:text-gray-700'
                )}
              >
                <Icon className={cn('w-6 h-6', isActive && 'text-secondary-accent-blue')} />
                <span className="text-xs font-medium">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Desktop Sidebar - Optional for larger screens */}
      {/* Can be added later if needed */}
    </div>
  );
};

export default Layout;
