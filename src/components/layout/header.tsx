"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { FaBars, FaTimes, FaUser, FaServer } from "react-icons/fa";

const navLinks = [
  { name: "Início", href: "/" },
  { name: "Servidores", href: "/servidores" },
  { name: "Planos VIP", href: "/planos" },
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <header className="bg-military-green/90 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link 
            href="/" 
            className="flex items-center space-x-2 text-white font-bold text-2xl"
          >
            <span className="text-intense-orange">Phanter</span>
            <span>Ops</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`nav-link ${
                  pathname === link.href ? "text-intense-orange" : ""
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Link
              href="/login"
              className="text-white hover:text-intense-orange"
            >
              Entrar
            </Link>
            <Link
              href="/registro"
              className="btn-primary"
            >
              Criar Conta
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-white p-2"
            onClick={toggleMobileMenu}
            aria-label="Menu"
          >
            {mobileMenuOpen ? (
              <FaTimes className="h-6 w-6" />
            ) : (
              <FaBars className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-military-green border-t border-olive-green">
          <div className="container mx-auto px-4 py-4 space-y-4">
            <nav className="flex flex-col space-y-3">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`nav-link ${
                    pathname === link.href ? "text-intense-orange" : ""
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
            </nav>
            <div className="flex flex-col space-y-3 pt-3 border-t border-olive-green">
              <Link
                href="/login"
                className="text-white hover:text-intense-orange"
                onClick={() => setMobileMenuOpen(false)}
              >
                Entrar
              </Link>
              <Link
                href="/registro"
                className="btn-primary text-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                Criar Conta
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
} 