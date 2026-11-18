import { useState } from 'react';
import { update } from '../lib/store';
import { play } from '../lib/audio';
import { Icon, Logo } from '../ui';

export function Onboarding() {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const finish = (unlockAll: boolean) =>
    update((s) => {
      s.onboarded = true;
      s.settings.name = name.trim();
      s.settings.unlockAll = unlockAll;
    });

  return (
    <div className="onboard">
      <div className="tiles-bg" />
      {step === 0 && (
        <div className="onboard-card appear">
          <Logo size={64} />
          <h1 className="nl">Welkom bij LLMers</h1>
          <p className="lead">Dutch from your very first hallo to confident A2+.</p>
          <ul className="features">
            <li>
              <Icon name="map" size={18} />
              <span>
                <b>63 lessons on 12 lines</b> — real situations: the café, the doctor, the gemeente, your first job interview.
              </span>
            </li>
            <li>
              <Icon name="chat" size={18} />
              <span>
                <b>Talk back</b> — write your own answers; Jev checks your Dutch and tells you exactly what went wrong.
              </span>
            </li>
            <li>
              <Icon name="volume" size={18} />
              <span>
                <b>Native audio</b> for every word, sentence and dialogue.
              </span>
            </li>
            <li>
              <Icon name="cards" size={18} />
              <span>
                <b>Spaced review</b> so words stick for good.
              </span>
            </li>
          </ul>
          <button
            className="btn btn-primary btn-wide"
            onClick={() => {
              play('Hallo! Welkom.', 'F');
              setStep(1);
            }}
          >
            Get started
          </button>
        </div>
      )}
      {step === 1 && (
        <div className="onboard-card appear">
          <h2 className="nl">Hoe heet je?</h2>
          <p className="lead">What's your name? (optional)</p>
          <input className="field big-field" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" maxLength={24} autoFocus onKeyDown={(e) => e.key === 'Enter' && setStep(2)} />
          <button className="btn btn-primary btn-wide" onClick={() => setStep(2)}>
            {name.trim() ? `Leuk je te ontmoeten, ${name.trim()}` : 'Skip'}
          </button>
        </div>
      )}
      {step === 2 && (
        <div className="onboard-card appear">
          <h2>Where do you start?</h2>
          <button className="choice-card" onClick={() => finish(false)}>
            <b>I'm new to Dutch</b>
            <span>Start at line 1, stop 1. Lessons unlock one by one.</span>
          </button>
          <button className="choice-card" onClick={() => finish(true)}>
            <b>I know some Dutch</b>
            <span>Every lesson is open; jump to what you need.</span>
          </button>
        </div>
      )}
    </div>
  );
}
