import { useState } from 'react';
import Sidebar from './Sidebar'; // Sidebar ekhon nijei responsive

export default function DashboardLayout({ children }) {
  // ১. Sidebar kholar jonno state
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-100 font-bangla">
      
      {/* --- SHOMADHAN ---
        Ekhon shudhu Sidebar component-ke ekbar call kora hocche.
        Sidebar nijei bujhe nibe kokhon mobile ba desktop dekhte hobe.
        Nicher ditiyo call-ti (jeta div-er moddhe chilo) baad deya hoyeche.
      */}
      <Sidebar mobileOpen={sidebarOpen} setMobileOpen={setSidebarOpen} />

      {/* --- Mul Content Area --- */}
      <main className="flex-1 overflow-y-auto focus:outline-none">
        
        {/* --- Top Bar (Mobile toggle button soho) --- */}
        <header className="bg-white shadow-md p-4 sticky top-0 z-10 flex items-center">
          
          {/* --- Hamburger Button (Shudhu mobile-e dekhabe) --- */}
          <button
            onClick={() => setSidebarOpen(true)} // Toggle-ti ekhon kaj korbe
            className="md:hidden p-2 text-gray-500 rounded-md hover:text-gray-900 hover:bg-gray-100"
          >
            <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          <h2 className="text-2xl font-semibold text-gray-800 ml-2">
            Admin Dashboard
          </h2>
        </header>

        {/* Content */}
        <div className="p-6 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}