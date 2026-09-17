import {useCallback, useEffect, useRef, useState} from 'react';
import {themeById, type ThemeId} from './data';
import {configuredFilm, openingFormat, openingPoster} from './films';
import './invitation-film.css';

/** One playback per tap. Hold the hero at time zero beneath the reveal. */
export default function InvitationFilm({theme, onComplete}: {
  theme: ThemeId;
  onComplete: () => void;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const skip = useRef<HTMLButtonElement>(null);
  const completed = useRef(false);
  const revealTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const completeCallback = useRef(onComplete);
  completeCallback.current = onComplete;
  const [format] = useState(openingFormat);
  const [revealing, setRevealing] = useState(false);
  const [playing, setPlaying] = useState(false);
  const source = configuredFilm(theme, format);
  const finish = useCallback(() => {
    if (completed.current) return;
    completed.current = true;
    if (revealTimer.current) clearTimeout(revealTimer.current);
    video.current?.pause();
    completeCallback.current();
  }, []);

  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const element = video.current;
    if (motion.matches || !element) { finish(); return; }
    let active = true;
    // Also release guests if the network stalls without firing a media error.
    const timeout = window.setTimeout(finish, 15_000);
    const motionChanged = () => { if (motion.matches) finish(); };
    motion.addEventListener('change', motionChanged);
    skip.current?.focus({preventScroll: true});
    element.muted = true;
    void element.play().catch(() => { if (active) finish(); });
    return () => {
      active = false;
      window.clearTimeout(timeout);
      if (revealTimer.current) clearTimeout(revealTimer.current);
      motion.removeEventListener('change', motionChanged);
      element.pause();
    };
  }, [source, finish]);

  return <section className={`inv-film inv-film-${theme} ${revealing ? 'inv-film-revealing' : ''}`}
    role="dialog" aria-modal="true" aria-label="Invitation opening"
    style={{color: themeById(theme).color}}
    onKeyDown={event => {
      if (event.key === 'Escape') { event.preventDefault(); finish(); }
      if (event.key === 'Tab') { event.preventDefault(); skip.current?.focus({preventScroll: true}); }
    }}>
    <div className="inv-film-media" style={{backgroundColor: themeById(theme).paper}}>
      <video ref={video} className="inv-film-video" src={source} poster={openingPoster(theme, format)}
        muted playsInline preload="auto" disablePictureInPicture aria-hidden="true"
        onPlaying={() => setPlaying(true)} onError={finish}
        onEnded={() => {
          if (completed.current || revealTimer.current) return;
          setRevealing(true);
          revealTimer.current = setTimeout(finish, 700);
        }}/>
    </div>
    {!playing && <p className="inv-film-status" role="status">Opening your invitation…</p>}
    <button ref={skip} type="button" className="inv-film-skip" onClick={finish}>
      Skip to invitation <span aria-hidden="true">→</span>
    </button>
  </section>;
}
