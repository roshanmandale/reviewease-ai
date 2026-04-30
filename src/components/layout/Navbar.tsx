'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sparkles, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const links = [
    { href: '#how-it-works', label: 'How it Works' },
    { href: '#features', label: 'Features' },
    { href: '#testimonials', label: 'Testimonials' },
  ];

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-[#050510]/90 backdrop-blur-xl shadow-sm border-b border-white/5'
          : 'bg-transparent'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <Sparkles size={16} className="text-white" />
            </div>
            <span className="font-bold text-white text-lg">
              ReviewEase <span className="text-violet-400">AI</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-white/60 hover:text-white transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/10">
                Sign In
              </Button>
            </Link>
            <Link href="/login">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 rounded-lg text-white/60 hover:bg-white/10"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden bg-[#050510]/95 backdrop-blur-xl border-b border-white/10 px-4 py-4 space-y-3"
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block text-sm font-medium text-white/70 hover:text-white py-2"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
            <Link href="/login" onClick={() => setMobileOpen(false)}>
              <Button size="sm" className="w-full">
                Sign In
              </Button>
            </Link>
          </div>
        </motion.div>
      )}
    </header>
  );
}
