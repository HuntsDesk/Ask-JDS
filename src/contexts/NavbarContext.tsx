import React, { createContext, useContext, useState } from 'react';

interface NavbarContextType {
  updateCount: (count: number) => void;
  itemCount: number;
}

const NavbarContext = createContext<NavbarContextType | undefined>(undefined);

export function NavbarProvider({ children }: { children: React.ReactNode }) {
  const [itemCount, setItemCount] = useState(0);

  const updateCount = (count: number) => {
    setItemCount(count);
  };

  return (
    <NavbarContext.Provider value={{ updateCount, itemCount }}>
      {children}
    </NavbarContext.Provider>
  );
}

export function useNavbar() {
  const context = useContext(NavbarContext);
  if (context === undefined) {
    throw new Error('useNavbar must be used within a NavbarProvider');
  }
  return context;
} 