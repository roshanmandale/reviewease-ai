'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Smartphone, X, Share, Plus, CheckCircle } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

type InstallState = 'idle' | 'android' | 'ios' | 'installed' | 'dismissed';

function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isInStandaloneMode(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in window.navigator && (window.navigator as { standalone?: boolean }).standalone === true)
  );
}

export function InstallAppCard() {
  const [state, setState] = useState<InstallState>('idle');
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    // Already installed as PWA — hide the card
    if (isInStandaloneMode()) {
      setState('installed');
      return;
    }

    // Check if user dismissed before
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      setState('dismissed');
      return;
    }

    // iOS — show manual instructions
    if (isIOS()) {
      setState('ios');
      return;
    }

    // Android/Chrome — wait for browser prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      setState('android');
    };
    window.addEventListener('beforeinstallprompt', handler);

    // If browser already fired the event before we attached
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleAndroidInstall = async () => {
    if (!installPrompt) return;
    setInstalling(true);
    try {
      await installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === 'accepted') {
        setState('installed');
        setInstallPrompt(null);
      }
    } finally {
      setInstalling(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa-install-dismissed', '1');
    setState('dismissed');
  };

  // Don't show if installed or dismissed
  if (state === 'installed' || state === 'dismissed' || state === 'idle') return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -16 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="relative overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50"
      >
        {/* Dismiss button */}
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
              <h3 className="font-bold text-gray-900 text-base">
                Add to Home Screen
              </h3>
              <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">
                Install ReviewEase AI on your phone for instant access — no login needed every time.
              </p>

              {/* Android install */}
              {state === 'android' && (
                <div className="mt-4 flex items-center gap-3">
                  <button
                    onClick={handleAndroidInstall}
                    disabled={installing}
                    className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-md shadow-emerald-200 disabled:opacity-60"
                  >
                    {installing ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Download size={15} />
                    )}
                    {installing ? 'Installing...' : 'Install App'}
                  </button>
                  <span className="text-xs text-gray-400">Free · Works offline</span>
                </div>
              )}

              {/* iOS manual instructions */}
              {state === 'ios' && (
                <div className="mt-4 space-y-3">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Follow these steps on Safari:
                  </p>
                  <div className="space-y-2">
                    {[
                      {
                        icon: <Share size={14} className="text-blue-500" />,
                        text: (
                          <>
                            Tap the <span className="font-semibold">Share</span> button{' '}
                            <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-100 rounded text-blue-600 text-xs">⬆</span>{' '}
                            at the bottom of Safari
                          </>
                        ),
                      },
                      {
                        icon: <Plus size={14} className="text-emerald-500" />,
                        text: (
                          <>
                            Scroll down and tap{' '}
                            <span className="font-semibold">&ldquo;Add to Home Screen&rdquo;</span>
                          </>
                        ),
                      },
                      {
                        icon: <CheckCircle size={14} className="text-violet-500" />,
                        text: (
                          <>
                            Tap <span className="font-semibold">Add</span> — done! Open the app icon on your home screen.
                          </>
                        ),
                      },
                    ].map((step, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <div className="w-5 h-5 rounded-full bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                          {step.icon}
                        </div>
                        <p className="text-xs text-gray-600 leading-relaxed">{step.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom accent bar */}
        <div className="h-1 bg-gradient-to-r from-emerald-400 to-teal-400" />
      </motion.div>
    </AnimatePresence>
  );
}
