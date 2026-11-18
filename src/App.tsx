import { useEffect } from 'react';
import { useRoute, go } from './router';
import { useStore } from './lib/store';
import { Home } from './screens/Home';
import { LessonScreen } from './screens/Lesson';
import { Review } from './screens/Review';
import { Words } from './screens/Words';
import { Me } from './screens/Me';
import { TestScreen } from './screens/Test';
import { Onboarding } from './screens/Onboarding';
import { Icon, Logo } from './ui';
import { dueCards } from './lib/store';
import { useMemo } from 'react';

function useTheme() {
  const theme = useStore((s) => s.settings.theme);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && mq.matches);
      document.documentElement.dataset.theme = dark ? 'dark' : 'light';
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#10151D' : '#F4EFE6');
    };
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [theme]);
}

const TABS = [
  { path: '', icon: 'map', label: 'Route' },
  { path: 'review', icon: 'cards', label: 'Review' },
  { path: 'words', icon: 'book', label: 'Words' },
  { path: 'me', icon: 'user', label: 'Me' },
];

export default function App() {
  useTheme();
  const route = useRoute();
  const onboarded = useStore((s) => s.onboarded);
  const s = useStore((st) => st);
  const due = useMemo(() => dueCards(s).length, [s]);
  const [head, arg] = route;

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [head, arg]);

  if (!onboarded) return <Onboarding />;

  if (head === 'lesson' && arg) return <LessonScreen key={arg} id={arg} />;
  if (head === 'test' && arg) return <TestScreen key={arg} unitId={arg} />;

  const tab = head || '';
  return (
    <div className="shell">
      <main className="shell-main">
        {tab === '' && <Home />}
        {tab === 'review' && <Review />}
        {tab === 'words' && <Words />}
        {tab === 'me' && <Me />}
      </main>
      <nav className="tabbar">
        <div className="tabbar-brand">
          <Logo size={30} />
          <span className="brand-name">LLMers</span>
          <span className="brand-lang">NL</span>
        </div>
        {TABS.map((t) => (
          <button key={t.path} className={`tab ${tab === t.path ? 'is-on' : ''}`} onClick={() => go('/' + t.path)}>
            <span className="tab-icon">
              <Icon name={t.icon} size={22} />
              {t.path === 'review' && due > 0 && <span className="tab-badge">{due > 99 ? '99+' : due}</span>}
            </span>
            <span>{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
