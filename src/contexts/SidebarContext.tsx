import { createContext, useContext, useState, ReactNode } from "react";

interface SidebarContextType {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
  toggle: () => void;
  reset: () => void; // ✅ expose reset so other components can call it
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const SidebarProvider = ({ children }: { children: ReactNode }) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    return localStorage.getItem("sidebarCollapsed") === "true"; // ✅ persist on refresh
  });

  const toggle = () =>
    setIsCollapsed((prev) => {
      localStorage.setItem("sidebarCollapsed", String(!prev)); // ✅ save on toggle
      return !prev;
    });

  const reset = () => {
    setIsCollapsed(false);
    localStorage.removeItem("sidebarCollapsed");
  };

  return (
    <SidebarContext.Provider
      value={{ isCollapsed, setIsCollapsed, toggle, reset }}
    >
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context)
    throw new Error("useSidebar must be used within SidebarProvider");
  return context;
};
