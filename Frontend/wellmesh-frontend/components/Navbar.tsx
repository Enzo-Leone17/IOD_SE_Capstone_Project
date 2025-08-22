"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Menu, X } from "lucide-react";
import { useState } from "react";

type NavbarProps = {
  onMenuClick?: () => void; // for dashboard sidebar
};

export default function Navbar({ onMenuClick }: NavbarProps) {
  const { user } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <nav className="bg-blue-100 shadow-md fixed w-full top-0 left-0 z-50">
      <div className="container mx-auto flex justify-between items-center p-4">
        {/* Left side */}
        <div className="flex items-center space-x-4">
          {/* Sidebar toggle for dashboard (optional) */}
          {onMenuClick && (
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-md bg-blue-600 text-white hover:bg-blue-800"
            >
              <Menu size={20} />
            </button>
          )}

          {/* Logo */}
          <Link href="/" className="text-2xl font-bold text-blue-600">
            WellMesh
          </Link>
        </div>

        {/* Desktop Nav */}
        {user ? (
          <div className="hidden lg:flex items-center space-x-6">
            <Link href="/" className="text-black hover:text-blue-600">
              Home
            </Link>
            <Link href="/dashboard" className="text-black hover:text-blue-600">
              Dashboard
            </Link>
            <Link href="/profile" className="text-black hover:text-blue-600">
              Profile
            </Link>
          </div>
        ) : (
          <div className="hidden lg:flex items-center space-x-6">
            <Link href="/" className="text-black hover:text-blue-600">
              Home
            </Link>
            <Link
              href="/login"
              className="hover:text-black border border-blue-600 px-4 py-2 rounded bg-blue-600 text-white"
            >
              Login
            </Link>
          </div>
        )}

        {/* Mobile Menu Button (for nav) */}
        <button
          onClick={() => setMobileNavOpen(true)}
          className="lg:hidden p-2 rounded-md text-blue-600 hover:bg-blue-200"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Mobile Nav Drawer */}
      {mobileNavOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setMobileNavOpen(false)}
          />

          {/* Drawer */}
          <div className="fixed top-0 right-0 w-64 h-full bg-white shadow-lg z-50 p-6 flex flex-col">
            {/* Close Button */}
            <button
              onClick={() => setMobileNavOpen(false)}
              className="self-end mb-6 p-2 rounded hover:bg-gray-200"
            >
              <X size={24} />
            </button>

            {/* Links */}
            <div className="flex flex-col space-y-4">
              <Link
                href="/"
                onClick={() => setMobileNavOpen(false)}
                className="text-lg text-black hover:text-blue-600"
              >
                Home
              </Link>

              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileNavOpen(false)}
                    className="text-lg text-black hover:text-blue-600"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/profile"
                    onClick={() => setMobileNavOpen(false)}
                    className="text-lg text-black hover:text-blue-600"
                  >
                    Profile
                  </Link>
                </>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileNavOpen(false)}
                  className="text-lg border border-blue-600 px-4 py-2 rounded bg-blue-600 text-white text-center"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </>
      )}
    </nav>
  );
}
