'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Smartphone, X, Share, Plus, CheckCircle } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// Store prompt globally so it's never lost between renders
let _deferredPrompt: BeforeInstallPromptEvent | null = null;

type InstallState = 'checking' | 'android' | 'ios' | 'installed' | 'dismissed' | 'unavailable';

function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isInStandaloneMode(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in window.navigator &&
      (window.navigator as { standalone?: boolean }).standalone === true)
  );
}

export function InstallAppCard() {
  const [state, setState] = useState<InstallState>('checking');
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    // Already running as installed PWA
    if (isInStandaloneMode()) {
      setState('installed');
      return;
    }

    // User dismissed before
    if (localStorage.getItem('pwa-install-dismissed')) {
      setState('dismissed');
      return;
    }

    // iOS Safari — show manual steps
    if (isIOS()) {
      setState('ios');
      return;
    }

    // If prompt was already captured globally (fired before mount)
    if (_deferredPrompt) {
      setState('android');
      return;
    }

    // Listen for the prompt
    const handler = (e: Event) => {
      e.preventDefault();
      _deferredPrompt = e as BeforeInstallPromptEvent;
      setState('android');
    };

    window.addEventListener('beforeinstallprompt', handler);

    // If prompt doesn't fire within 2s, the browser won't show it
    // (already installed, not on HTTPS, or not eligible)
    const timer = setTimeout(() => {
      if (state === 'checking') {
        setState('unavailable');
      }
    }, 2000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      clearTimeout(timer);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInstall = async () => {
    if (!_deferredPrompt) return;
    setInstalling(true);
    try {
      await _deferredPrompt.prompt();
      const { outcome } = await _deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        _deferredPrompt = null;
        setState('installed');
      } else {
        setState('dismissed');
      }
    } catch (err) {
      console.error('Install failed:', err);
    } finally {
      setInstalling(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa-install-dismissed', '1');
    setState('dismissed');
  };

  // Hide in these states
  if (
    state === 'checking' ||
    state === 'installed' ||
    state === 'dismissed' ||
    state === 'unavailable'
  ) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="relative overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50"
      >
        {/* Dismiss */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-white/60 transition-colors z-10"
          aria-label="Dismiss"
        >
          <X size={15} />
        </button>

        <div className="p-5">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-200">
              <Smartphone size={22} className="text-white" />
            </div>

            <div className="flex-1 min-w-0 pr-6">
              <h3 className="font-bold text-gray-900 text-base">Add to Home Screen</h3>
              <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">
                Install ReviewEase AI on your phone — open it like an app, stay logged in.
              </p>

              {/* Android — native install button */}
              {state === 'android' && (
                <div className="mt-4 flex items-center gap-3 flex-wrap">
                  <button
                    onClick={handleInstall}
                    disabled={installing}
                    className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-semibold rounded-xl transition-colors shadow-md shadow-emerald-200 disabled:opacity-60"
                  >
                    {installing ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Download size={15} />
                    )}
                    {installing ? 'Installing...' : 'Install App'}
                  </button>
                  <span className="text-xs text-gray-400">Free · No app store needed</span>
                </div>
              )}

              {/* iOS — step-by-step guide */}
              {state === 'ios' && (
                <div className="mt-4 space-y-2.5">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Open in Safari and follow these steps:
                  </p>
                  {[
                    {
                      num: '1',
                      icon: <Share size={13} className="text-blue-500" />,
                      text: (
                        <>
                          Tap the <strong>Share</strong> button{' '}
                          <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-100 rounded text-blue-600 text-xs font-bold">
                            ↑
                          </span>{' '}
                          at the bottom of Safari
                        </>
                      ),
                    },
                    {
                      num: '2',
                      icon: <Plus size={13} className="text-emerald-500" />,
                      text: (
                        <>
                          Scroll and tap{' '}
                          <strong>&ldquo;Add to Home Screen&rdquo;</strong>
                        </>
                      ),
                    },
                    {
                      num: '3',
                      icon: <CheckCircle size={13} className="text-violet-500" />,
                      text: (
                        <>
                          Tap <strong>Add</strong> — the app icon appears on your home screen!
                        </>
                      ),
                    },
                  ].map((step) => (
                    <div key={step.num} className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                        {step.icon}
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed">{step.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Accent bar */}
        <div className="h-1 bg-gradient-to-r from-emerald-400 to-teal-400" />
      </motion.div>
    </AnimatePresence>
  );
}
