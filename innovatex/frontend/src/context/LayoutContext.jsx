import React, { createContext, useContext, useState } from 'react';

const LayoutContext = createContext({
  mobileSidebarOpen: false,
  setMobileSidebarOpen: () => {},
  toggleSidebar: () => {}
});

export const LayoutProvider = ({ children }) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setMobileSidebarOpen((prev) => !prev);
  };

  return (
    <LayoutContext.Provider value={{ mobileSidebarOpen, setMobileSidebarOpen, toggleSidebar }}>
      {children}
    </LayoutContext.Provider>
  );
};

export const useLayout = () => useContext(LayoutContext);
