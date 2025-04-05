import React, { useState, useCallback, memo, useEffect } from "react";
import {
  Home,
  BookOpen,
  Users,
  Speaker,
  ClipboardList,
  MessageSquare,
  Calendar,
  AlertCircle,
  Ticket,
  Settings,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  CircleUser
} from "lucide-react";
import { useSidebar } from "@/context/SidebarContext";

type SidebarProps = {
  className?: string;
};

const menuSections = [
  {
    title: 'School Management',
    items: [
      { path: '/dashboard', icon: <Home className="w-5 h-5" />, label: 'Dashboard' },
      { path: '/classes', icon: <BookOpen className="w-5 h-5" />, label: 'Classes' },
      {
        path: '/users',
        icon: <Users className="w-5 h-5" />,
        label: 'Users',
        subItems: [
          { path: '/users/students', label: 'Students' },
          { path: '/users/teachers', label: 'Teachers' }
        ]
      }
    ]
  },
  {
    title: 'Academic',
    items: [
      { path: '/timetable', icon: <Calendar className="w-5 h-5" />, label: 'Timetable' },
      { path: '/complaints', icon: <AlertCircle className="w-5 h-5" />, label: 'Complaints' },
      { path: '/leave-requests', icon: <Ticket className="w-5 h-5" />, label: 'Leave Requests' },
      { path: '/curricula', icon: <ClipboardList className="w-5 h-5" />, label: 'Curricula' },
    ]
  },
  {
    title: 'Communication',
    items: [
      { path: '/announcements', icon: <Speaker className="w-5 h-5" />, label: 'Announcements' },
      { path: '/messages', icon: <MessageSquare className="w-5 h-5" />, label: 'Messages' }
    ]
  },
  {
    title: 'System',
    items: [
      { path: '/settings', icon: <Settings className="w-5 h-5" />, label: 'Settings' }
    ]
  }
];

const Sidebar: React.FC<SidebarProps> = memo(({ className }) => {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [isMobile, setIsMobile] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const { isCollapsed, toggleCollapse } = useSidebar();

  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  const checkIfMobile = useCallback(() => {
    setIsMobile(window.innerWidth < 768);
  }, []);

  useEffect(() => {
    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    return () => window.removeEventListener("resize", checkIfMobile);
  }, [checkIfMobile]);

  useEffect(() => {
    if (isMobile) setIsOpen(false);
  }, [currentPath, isMobile]);

  const isActive = useCallback((path: string) => currentPath === path, [currentPath]);

  const handleNavigate = useCallback((path: string) => {
    setCurrentPath(path);
    window.history.pushState({}, '', path);
    if (isMobile) setIsOpen(false);
  }, [isMobile]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    window.location.href = "/";
  }, []);

  const toggleSection = useCallback((title: string) => {
    setOpenSections(prev => ({ ...prev, [title]: !prev[title] }));
  }, []);

  return (
    <>
      {/* Hamburger Button */}
      {isMobile && !isOpen && (
        <button
          className="fixed top-4 left-4 z-50 p-2 rounded-md bg-white shadow-md"
          onClick={() => setIsOpen(true)}
        >
          <Menu className="w-6 h-6 text-blue-900" />
        </button>
      )}

      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div
        className={`
          ${isMobile ? "fixed left-0 top-0 z-50" : "sticky top-0 z-30"}
          ${isMobile && !isOpen ? "-translate-x-full" : "translate-x-0"}
          ${isCollapsed && !isMobile ? "w-20" : "w-64"}
          h-screen bg-white text-gray-800 shadow-lg transition-all duration-300 ease-in-out flex flex-col justify-between
          ${className}
        `}
      >
        {/* Sidebar Content */}
        <div className={`overflow-y-auto flex-1 ${isCollapsed ? 'p-2' : 'p-4'}`}>
          {/* Header */}
          <div className="flex items-center justify-between border-b pb-4 mb-4">
            {!isCollapsed && (
              <div className="flex items-center gap-4">
                <img src="/icons/talim.svg" alt="Logo" className="w-11 h-11" />
                <span className="text-2xl font-semibold text-gray-900">Talim</span>
              </div>
            )}
            {!isMobile && (
             <button
             className="p-1 border rounded-md hover:bg-gray-100"
             onClick={toggleCollapse}
           >
             <ChevronLeft
               className={`w-5 h-5 transition-transform ${isCollapsed ? "rotate-180" : ""}`}
             />
           </button>
           
            )}
            {isMobile && isOpen && (
              <button 
                onClick={() => setIsOpen(false)} 
                className="p-2 rounded-md border hover:bg-gray-100"
              >
                <ChevronRight className="w-5 h-5 text-blue-900" />
              </button>
            )}
          </div>

          {/* Menu Sections */}
          {menuSections.map(section => (
            <div key={section.title} className="mt-4">
              <div
                className="flex items-center justify-between p-2 text-gray-700 font-medium cursor-pointer hover:bg-gray-50 rounded-md"
                onClick={() => toggleSection(section.title)}
              >
                {!isCollapsed && <span>{section.title}</span>}
                {!isCollapsed && (
                  openSections[section.title] 
                    ? <ChevronDown className="w-4 h-4" /> 
                    : <ChevronRight className="w-4 h-4" />
                )}
              </div>
              {openSections[section.title] && section.items.map(item => (
                <React.Fragment key={item.path}>
                  <div
                    className={`p-3 flex items-center gap-4 cursor-pointer rounded-md transition-colors ${
                      isActive(item.path) 
                        ? 'bg-blue-900 text-white' 
                        : 'hover:bg-gray-100'
                    }`}
                    onClick={() => handleNavigate(item.path)}
                  >
                    {item.icon}
                    {!isCollapsed && <span>{item.label}</span>}
                  </div>
                  {item.subItems && openSections[section.title] && !isCollapsed && (
                    <div className="pl-8">
                      {item.subItems.map(subItem => (
                        <div
                          key={subItem.path}
                          className={`p-2 flex items-center gap-4 cursor-pointer rounded-md transition-colors ${
                            isActive(subItem.path) 
                              ? 'bg-blue-900 text-white' 
                              : 'hover:bg-gray-100'
                          }`}
                          onClick={() => handleNavigate(subItem.path)}
                        >
                          <span>{subItem.label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          ))}
        </div>

        {/* Footer (Logout) */}
        <div 
          className="p-4 border-t flex items-center justify-between hover:bg-gray-100 cursor-pointer"
          onClick={handleLogout}
        >
          <div className="flex items-center gap-3">
            <CircleUser className="w-6 h-6" />
            {!isCollapsed && (
              <div>
                <div className="font-semibold">Logout</div>
                <div className="text-sm text-gray-600">account</div>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <LogOut className="w-5 h-5 text-gray-600 hover:text-gray-800 transition-colors" />
          )}
        </div>
      </div>

      {/* Mobile Spacer */}
      {isMobile && <div className="h-16 md:hidden" />}
    </>
  );
});

Sidebar.displayName = "Sidebar";
export default Sidebar;