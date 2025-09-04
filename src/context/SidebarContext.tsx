import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";

type SidebarContextType = {
  isCollapsed: boolean;
  isMobileOpen: boolean;
  isMobile: boolean;
  toggleCollapse: () => void;
  toggleMobile: () => void;
  setCollapsed: (val: boolean) => void;
  setMobileOpen: (val: boolean) => void;
};

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const SidebarProvider = ({ children }: { children: ReactNode }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if we're on mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Close mobile sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMobile && isMobileOpen) {
        const sidebar = document.getElementById("mobile-sidebar");
        const hamburger = document.getElementById("hamburger-menu");

        if (
          sidebar &&
          !sidebar.contains(event.target as Node) &&
          hamburger &&
          !hamburger.contains(event.target as Node)
        ) {
          setIsMobileOpen(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMobile, isMobileOpen]);

  const toggleCollapse = () => setIsCollapsed((prev) => !prev);
  const toggleMobile = () => setIsMobileOpen((prev) => !prev);

  return (
    <SidebarContext.Provider
      value={{
        isCollapsed,
        isMobileOpen,
        isMobile,
        toggleCollapse,
        toggleMobile,
        setCollapsed: setIsCollapsed,
        setMobileOpen: setIsMobileOpen,
      }}
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
