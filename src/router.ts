import { useEffect, useState } from 'react';

export function go(path: string) {
  location.hash = '#' + path;
}

export function useRoute(): string[] {
  const read = () => (location.hash.replace(/^#/, '') || '/').split('/').filter(Boolean);
  const [r, setR] = useState(read);
  useEffect(() => {
    const h = () => setR(read());
    window.addEventListener('hashchange', h);
    return () => window.removeEventListener('hashchange', h);
  }, []);
  return r;
}
