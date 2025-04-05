import { Navbar } from '../shared/Navbar';
import { Home, BookOpen, DollarSign, HelpCircle } from 'lucide-react';

export function AskJDSNavbar() {
  const navItems = [
    { label: 'Home', href: '/', icon: <Home size={18} /> },
    { label: 'Flashcards', href: '/flashcards', icon: <BookOpen size={18} /> },
    { label: 'Pricing', href: '/pricing', icon: <DollarSign size={18} /> },
    { label: 'Help', href: '/help', icon: <HelpCircle size={18} /> },
  ];
  
  return (
    <Navbar
      siteName="askjds"
      navItems={navItems}
      logoSize="lg"
      dashboardText="Chat"
      dashboardHref="/chat"
    />
  );
} 