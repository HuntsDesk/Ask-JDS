import { Navbar } from '../shared/Navbar';
import { Home, BookOpen, Info, Mail } from 'lucide-react';

interface JDSNavbarProps {
  showPromo?: boolean;
}

export function JDSNavbar({ showPromo = false }: JDSNavbarProps) {
  const navItems = [
    { label: 'Home', href: '/', icon: <Home size={18} /> },
    { label: 'Courses', href: '/courses', icon: <BookOpen size={18} /> },
    { label: 'About', href: '/about', icon: <Info size={18} /> },
    { label: 'Contact', href: '/contact', icon: <Mail size={18} /> },
  ];
  
  return (
    <Navbar
      siteName="jds"
      navItems={navItems}
      showPromo={showPromo}
      logoSize="md"
      dashboardText="Dashboard"
      dashboardHref="/courses"
    />
  );
} 