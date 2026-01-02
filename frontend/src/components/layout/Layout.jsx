import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  Laptop, 
  Home,
  Users, 
  Building2, 
  FileBarChart, 
  Settings, 
  LogOut,
  User,
  Menu,
  X,
  ClipboardCheck,
  Moon,
  Sun
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { usePendingAttestations } from '@/hooks/use-pending-attestations';

const Layout = ({ theme, setTheme }) => {
  const { user, logout } = useAuth();
  const { pendingCount } = usePendingAttestations();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  // Retrieve branding from localStorage (set in App.jsx)
  const brandingLogo = localStorage.getItem('branding_logo');
  const footerLabel = localStorage.getItem('footer_label') || 'SOC2 Compliance - Asset Compliance System';

  const navigation = [
    { name: 'Dashboard', path: '/', icon: Home },
    { name: 'Assets', path: '/assets', icon: Laptop },
    { name: 'Attestation', path: '/attestation', icon: ClipboardCheck, roles: ['admin', 'manager', 'coordinator'] },
    { name: 'Companies', path: '/companies', icon: Building2, roles: ['admin', 'manager', 'coordinator'] },
    { name: 'Users', path: '/users', icon: Users, roles: ['admin', 'manager', 'coordinator'] },
    { name: 'Audit', path: '/audit', icon: FileBarChart, roles: ['admin', 'manager', 'coordinator'] },
    { name: 'Admin Settings', path: '/admin', icon: Settings, roles: ['admin'] },
  ];

  const filteredNav = navigation.filter(item => 
    !item.roles || item.roles.includes(user?.role)
  );

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  return (
    <div className="min-h-screen bg-background text-foreground flex overflow-hidden">
      {/* 1. Global Background Floor */}
      <div className="fixed inset-0 bg-surface/30 pointer-events-none" aria-hidden="true" />

      {/* 2. Desktop Floating Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 m-4 hidden lg:block",
        "glass-panel rounded-2xl border-glass flex flex-col shadow-2xl animate-fade-in"
      )}>
        {/* Branding Area */}
        <div className="p-8 flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
          {brandingLogo ? (
            <img src={brandingLogo} alt="Logo" className="h-9 w-auto object-contain" />
          ) : (
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-glow">
                <Laptop className="text-primary-foreground h-6 w-6" />
              </div>
              <span className="text-xl font-bold tracking-tighter text-gradient">ACS Admin</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-1">
          {filteredNav.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.name}
                onClick={() => { navigate(item.path); setIsMobileMenuOpen(false); }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-base group",
                  isActive 
                    ? "bg-primary/10 text-primary shadow-sm border border-primary/20" 
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                )}
              >
                <item.icon size={20} className={cn(isActive ? "text-primary" : "opacity-50 group-hover:opacity-100")} />
                <span className="flex-1 text-left">{item.name}</span>
                {item.name === 'Attestation' && pendingCount > 0 && (
                   <Badge variant="destructive" className="h-5 px-1.5 min-w-[20px] rounded-full text-[10px]">
                      {pendingCount}
                   </Badge>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer Actions & Profile */}
        <div className="p-4 mt-auto space-y-2">
          <Button variant="ghost" className="w-full justify-start gap-3 rounded-xl h-12" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            <span className="text-sm font-semibold">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </Button>

          <div className="glass-panel p-4 rounded-xl bg-surface/50 space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="h-10 w-10 border border-white/10 shadow-sm">
                  <AvatarImage src={user?.profile_image} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">
                    {user?.first_name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                {pendingCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-destructive rounded-full border-2 border-background animate-pulse" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold truncate leading-none mb-1">{user?.first_name} {user?.last_name}</p>
                <Badge variant="secondary" className="text-[9px] uppercase tracking-widest h-4 px-1 px-1 opacity-70">
                  {user?.role}
                </Badge>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <Button variant="ghost" size="sm" className="h-8 text-xs font-bold" onClick={() => navigate('/profile')}>
                Profile
              </Button>
              <Button variant="ghost" size="sm" className="h-8 text-xs font-bold text-destructive hover:bg-destructive/10" onClick={logout}>
                Log Out
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* 3. Main Content Scroll Area */}
      <main className="flex-1 lg:ml-[320px] p-4 lg:p-8 relative z-10 overflow-y-auto">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between mb-6 glass-panel p-4 rounded-2xl border-glass">
          <div className="flex items-center gap-2" onClick={() => navigate('/')}>
             {brandingLogo ? <img src={brandingLogo} className="h-6 w-auto" alt="Logo" /> : <span className="font-bold tracking-tight">ACS</span>}
          </div>
          <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X /> : <Menu />}
          </Button>
        </div>

        {/* Dynamic Page Content */}
        <div className="max-w-7xl mx-auto animate-slide-up pb-12">
          <Outlet />
        </div>

        {/* Global Footer */}
        <footer className="mt-auto py-8 text-center text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground/40">
           {footerLabel}
        </footer>
      </main>
    </div>
  );
};

export default Layout;
