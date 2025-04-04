import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  Settings, 
  LogOut,
  ChevronDown,
  Menu,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showCoursesSubmenu, setShowCoursesSubmenu] = useState(true);

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
    { 
      icon: BookOpen, 
      label: 'Courses', 
      path: '/admin/courses',
      hasSubmenu: true 
    },
    { icon: Users, label: 'Users', path: '/admin/users' },
    { icon: Settings, label: 'Settings', path: '/admin/settings' },
  ];

  const handleLogout = () => {
    // Clear user session/local storage
    // In a real app, call logout API
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile menu toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 rounded-md bg-white shadow-md"
        >
          {isSidebarOpen ? (
            <X className="h-6 w-6 text-gray-700" />
          ) : (
            <Menu className="h-6 w-6 text-gray-700" />
          )}
        </button>
      </div>

      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-jdblue text-white transform transition-transform duration-300 ease-in-out lg:translate-x-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-jdblue-light">
            <Link to="/admin" className="flex items-center space-x-2">
              <img 
                src="/images/JDSimplified_Logo_wht.png" 
                alt="JD Simplified Logo" 
                className="h-8 w-auto" 
              />
              <span className="text-xl font-bold">Admin Panel</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 overflow-y-auto">
            <ul className="space-y-1">
              {navItems.map((item) => (
                <li key={item.label}>
                  {item.hasSubmenu ? (
                    <div className="space-y-1">
                      <button
                        onClick={() => setShowCoursesSubmenu(!showCoursesSubmenu)}
                        className={cn(
                          "w-full flex items-center justify-between p-3 rounded-lg transition-colors",
                          location.pathname.startsWith(item.path)
                            ? "bg-white/10 text-white"
                            : "text-white/70 hover:text-white hover:bg-white/5"
                        )}
                      >
                        <div className="flex items-center">
                          <item.icon className="h-5 w-5 mr-3" />
                          <span>{item.label}</span>
                        </div>
                        <ChevronDown 
                          className={cn(
                            "h-4 w-4 transition-transform", 
                            showCoursesSubmenu && "rotate-180"
                          )} 
                        />
                      </button>
                      
                      {showCoursesSubmenu && (
                        <ul className="pl-10 space-y-1">
                          <li>
                            <Link
                              to="/admin/courses"
                              className={cn(
                                "block p-2 rounded-lg transition-colors",
                                location.pathname === "/admin/courses"
                                  ? "bg-white/10 text-white"
                                  : "text-white/70 hover:text-white hover:bg-white/5"
                              )}
                            >
                              All Courses
                            </Link>
                          </li>
                          <li>
                            <Link
                              to="/admin/courses/new"
                              className={cn(
                                "block p-2 rounded-lg transition-colors",
                                location.pathname === "/admin/courses/new"
                                  ? "bg-white/10 text-white"
                                  : "text-white/70 hover:text-white hover:bg-white/5"
                              )}
                            >
                              Add New Course
                            </Link>
                          </li>
                        </ul>
                      )}
                    </div>
                  ) : (
                    <Link
                      to={item.path}
                      className={cn(
                        "flex items-center p-3 rounded-lg transition-colors",
                        location.pathname === item.path
                          ? "bg-white/10 text-white"
                          : "text-white/70 hover:text-white hover:bg-white/5"
                      )}
                    >
                      <item.icon className="h-5 w-5 mr-3" />
                      <span>{item.label}</span>
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-jdblue-light">
            <button
              onClick={handleLogout}
              className="flex items-center w-full p-3 rounded-lg text-white/70 hover:text-white hover:bg-white/5 transition-colors"
            >
              <LogOut className="h-5 w-5 mr-3" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className={cn(
        "min-h-screen transition-all duration-300",
        isSidebarOpen ? "lg:ml-64" : "ml-0"
      )}>
        <div className="p-6 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
