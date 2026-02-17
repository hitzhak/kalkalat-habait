'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';

/**
 * עוטפת את תוכן הדף באנימציית fade-in + slide חלקה בכל מעבר route.
 * משתמשת ב-key שמשתנה עם ה-pathname כדי לגרום ל-React לעשות re-mount
 * ובכך להפעיל מחדש את אנימציית ה-CSS.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [displayedChildren, setDisplayedChildren] = useState(children);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const prevPathRef = useRef(pathname);

  useEffect(() => {
    if (pathname !== prevPathRef.current) {
      prevPathRef.current = pathname;
      setIsTransitioning(true);

      // Brief fade-out, then swap content and fade-in
      const timer = setTimeout(() => {
        setDisplayedChildren(children);
        setIsTransitioning(false);
      }, 100);

      return () => clearTimeout(timer);
    } else {
      setDisplayedChildren(children);
    }
  }, [pathname, children]);

  return (
    <div
      className={`page-transition ${isTransitioning ? 'page-exit' : 'page-enter'}`}
    >
      {displayedChildren}
    </div>
  );
}
