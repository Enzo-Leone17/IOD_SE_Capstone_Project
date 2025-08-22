"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import Events from "@/components/Events";
import Activities from "@/components/Activities";
import Locations from "@/components/Locations";
import MediaList from "@/components/MediaList";
import Registrations from "@/components/Registrations";

export default function DashboardPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("Event");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  //confine content to role specific
  const contentAvailable = [];

  if (user?.role === "admin" || user?.role === "manager") {
    contentAvailable.push(
      "Event",
      "My Registrations",
      "Activities",
      "Locations",
      "Media"
    );
  } else if (user?.role === "staff") {
    contentAvailable.push("Event", "My Registrations");
  } else if (user?.role === "guest") {
    contentAvailable.push("Event");
  }

  const renderContent = () => {
    switch (activeTab) {
      case "Event":
        return <Events />;
      case "My Registrations":
        return <Registrations />;
      case "Activities":
        return (
          <Activities
            endpoint="/activities"
            sortByParams={[
              "title",
              "description",
              "additional_notes",
              "category",
            ]}
          />
        );
      case "Locations":
        return <Locations />;
      case "Media":
        return <MediaList />;
      default:
        return <div className="p-6">Select a section</div>;
    }
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Navbar with sidebar toggle */}
      <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex flex-1 pt-16">
        {/* Overlay on mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed lg:fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 
          bg-gray-900 text-white flex flex-col transform transition-transform duration-300 z-50
          ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
        >
          <div className="p-6 text-xl font-bold border-b border-gray-700">
            Dashboard
          </div>
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {contentAvailable.map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setSidebarOpen(false);
                }}
                className={`w-full text-left px-4 py-2 rounded transition ${
                  activeTab === tab
                    ? "bg-blue-600 text-white"
                    : "hover:bg-gray-700"
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 bg-gray-100 overflow-y-auto lg:ml-64">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
