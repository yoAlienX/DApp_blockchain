import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';

const ThemeContext = createContext(null);
const STORAGE_KEY = 'sealmark_theme';

function setTransitionStyles(toDark, x, y, maxRadius) {
  document.getElementById('sealmark-vt-order')?.remove();
  const styleEl = document.createElement('style');
  styleEl.id = 'sealmark-vt-order';
  styleEl.textContent = toDark
    ? `::view-transition-old(root) { z-index: 1; }
       ::view-transition-new(root) { z-index: 9999; clip-path: circle(0px at ${x}px ${y}px); }`
    : `::view-transition-new(root) { z-index: 1; }
       ::view-transition-old(root) { z-index: 9999; clip-path: circle(${maxRadius}px at ${x}px ${y}px); }`;
  document.head.appendChild(styleEl);
  return styleEl;
}

function applyThemeToRoot(isDark) {
  const root = document.documentElement;
  root.classList.toggle('dark', isDark);
  root.style.colorScheme = isDark ? 'dark' : 'light';
  root.style.backgroundColor = isDark ? '#020617' : '#f8fafc';
  root.style.color = isDark ? '#f8fafc' : '#0f172a';
}

export function ThemeProvider({ children }) {
  const activeAnimRef = useRef(null);
  const [theme, setTheme] = useState(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === 'dark') return 'dark';
    } catch {
      // Ignore storage access failures
    }
    return 'light';
  });

  useEffect(() => {
    applyThemeToRoot(theme === 'dark');
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Ignore storage access failures
    }
  }, [theme]);

  const toggleTheme = event => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    const toDark = nextTheme === 'dark';
    const root = document.documentElement;

    if (!document.startViewTransition) {
      setTheme(nextTheme);
      return;
    }

    // Clear any leftover WAAPI effect from an earlier transition before starting a new one
    if (activeAnimRef.current) {
      try { activeAnimRef.current.cancel(); } catch {}
      activeAnimRef.current = null;
    }

    const rect = event?.currentTarget?.getBoundingClientRect?.();
    const x = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
    const y = rect ? rect.top + rect.height / 2 : 32;

    const screenW = Math.max(window.innerWidth, window.screen?.width || 0);
    const screenH = Math.max(window.innerHeight, window.screen?.height || 0);
    const maxRadius = Math.hypot(Math.max(x, screenW - x), Math.max(y, screenH - y));

    const styleEl = setTransitionStyles(toDark, x, y, maxRadius);

    const transition = document.startViewTransition(() => {
      flushSync(() => {
        applyThemeToRoot(toDark);
        setTheme(nextTheme);
      });
    });

    transition.ready
      .then(() => {
        const startCircle = `circle(0px at ${x}px ${y}px)`;
        const fullCircle = `circle(${maxRadius}px at ${x}px ${y}px)`;

        const anim = root.animate(
          {
            clipPath: toDark ? [startCircle, fullCircle] : [fullCircle, startCircle]
          },
          {
            duration: 720,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
            fill: 'forwards',
            pseudoElement: toDark ? '::view-transition-new(root)' : '::view-transition-old(root)'
          }
        );
        activeAnimRef.current = anim;
      })
      .catch(() => {});

    transition.finished.finally(() => {
      if (activeAnimRef.current) {
        try { activeAnimRef.current.cancel(); } catch {}
        activeAnimRef.current = null;
      }
      styleEl.remove();
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, isDark: theme === 'dark', toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme requires ThemeProvider.');
  return ctx;
}
