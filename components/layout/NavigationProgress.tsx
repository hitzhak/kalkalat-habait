'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';

/**
 * סרגל התקדמות עליון (בסגנון YouTube/NProgress)
 * נותן פידבק ויזואלי מיידי בזמן מעבר בין דפים
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const prevPathRef = useRef(pathname);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const completeTimerRef = useRef<NodeJS.Timeout | null>(null);

  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (completeTimerRef.current) clearTimeout(completeTimerRef.current);
  }, []);

  useEffect(() => {
    if (pathname === prevPathRef.current) return;
    prevPathRef.current = pathname;

    cleanup();

    // Complete the bar
    setProgress(100);
    setVisible(true);

    completeTimerRef.current = setTimeout(() => {
      setVisible(false);
      setTimeout(() => setProgress(0), 200);
    }, 300);

    return cleanup;
  }, [pathname, cleanup]);

  // Intercept link clicks to start progress immediately
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('http') || href.startsWith('#') || href === pathname) return;

      cleanup();
      setProgress(15);
      setVisible(true);

      // Simulate gradual progress
      let current = 15;
      timerRef.current = setInterval(() => {
        current += Math.random() * 12;
        if (current >= 90) {
          current = 90;
          if (timerRef.current) clearInterval(timerRef.current);
        }
        setProgress(current);
      }, 150);
    };

    document.addEventListener('click', handleClick, true);
    return () => {
      document.removeEventListener('click', handleClick, true);
      cleanup();
    };
  }, [pathname, cleanup]);

  if (!visible && progress === 0) return null;

  return (
    <div
      className="navigation-progress"
      style={{
        opacity: visible ? 1 : 0,
        transition: 'opacity 200ms ease-out',
      }}
    >
      <div
        className="navigation-progress-bar"
        style={{
          width: `${progress}%`,
          transition: progress === 0
            ? 'none'
            : progress === 100
            ? 'width 200ms ease-out'
            : 'width 400ms ease-out',
        }}
      />
    </div>
  );
}
