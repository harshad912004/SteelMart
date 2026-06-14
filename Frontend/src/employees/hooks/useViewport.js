import { useEffect, useState } from 'react';

const MOBILE_BREAKPOINT = 768;

const getViewportState = () => {
  if (typeof window === 'undefined') {
    return {
      isMobileViewport: false,
      isDesktopViewport: true,
    };
  }

  const isMobileViewport = window.innerWidth <= MOBILE_BREAKPOINT;

  return {
    isMobileViewport,
    isDesktopViewport: !isMobileViewport,
  };
};

export default function useViewport() {
  const [viewport, setViewport] = useState(getViewportState);

  useEffect(() => {
    const handleResize = () => {
      setViewport(getViewportState());
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return viewport;
}