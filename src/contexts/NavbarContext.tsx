import React, { createContext, useContext, useState } from 'react';

interface NavbarContextType {
  updateCount: (count: number) => void;
  itemCount: number;
  totalCollectionCount: number;
  totalCardCount: number;
  updateTotalCollectionCount: (count: number) => void;
  updateTotalCardCount: (count: number) => void;
  currentCardIndex: number;
  updateCurrentCardIndex: (index: number) => void;
  isLoadingCards: boolean;
  setIsLoadingCards: (loading: boolean) => void;
}

const NavbarContext = createContext<NavbarContextType | undefined>(undefined);

export function NavbarProvider({ children }: { children: React.ReactNode }) {
  const [itemCount, setItemCount] = useState(0);
  const [totalCollectionCount, setTotalCollectionCount] = useState(0);
  const [totalCardCount, setTotalCardCount] = useState(0);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isLoadingCards, setIsLoadingCards] = useState(false);

  const updateCount = (count: number) => {
    setItemCount(count);
  };

  const updateTotalCollectionCount = (count: number) => {
    setTotalCollectionCount(count);
  };

  const updateTotalCardCount = (count: number) => {
    setTotalCardCount(count);
  };

  const updateCurrentCardIndex = (index: number) => {
    setCurrentCardIndex(index);
  };

  return (
    <NavbarContext.Provider value={{ 
      updateCount, 
      itemCount,
      totalCollectionCount,
      totalCardCount,
      updateTotalCollectionCount,
      updateTotalCardCount,
      currentCardIndex,
      updateCurrentCardIndex,
      isLoadingCards,
      setIsLoadingCards
    }}>
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