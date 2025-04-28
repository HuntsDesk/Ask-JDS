import React, { createContext, useContext, useState, ReactNode } from 'react';

type CloseContextType = {
  onClose: (() => void) | null;
  setOnClose: (callback: (() => void) | null) => void;
};

const CloseContext = createContext<CloseContextType>({
  onClose: null,
  setOnClose: () => {},
});

export const CloseProvider = ({ children }: { children: ReactNode }) => {
  const [onClose, setOnClose] = useState<(() => void) | null>(null);

  return (
    <CloseContext.Provider value={{ onClose, setOnClose }}>
      {children}
    </CloseContext.Provider>
  );
};

export const useCloseContext = () => useContext(CloseContext); 