import { useEffect, useRef, useState } from 'react';
import type { ThemeId } from './data';
import './keepsake-gallery.css';

const samplePhotos = ['/art/keepsake-letters.webp', '/art/keepsake-table.webp', '/art/keepsake-hands.webp'];
const captions = ['A little note, a lasting feeling.', 'A place for our favourite people.', 'Together is our favourite place.'];
const personalCaptions = ['Where our story began.', 'The little things, together.', 'A moment to keep.', 'Our kind of happiness.', 'Always, side by side.', 'And all that comes next.'];

export default function KeepsakeGallery({ photos, theme }: { photos: string[]; theme: ThemeId }) {
  const supplied = photos.filter(Boolean).slice(0, 6);
  const images = supplied.length ? supplied : samplePhotos;
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const start = useRef<{ x: number; y: number } | null>(null);
  const signature = images.join('|');
  useEffect(() => setIndex(0), [signature]);
  const current = Math.min(index, images.length - 1);
  const change = (step: number) => {
    setDirection(step);
    setIndex(value => (value + step + images.length) % images.length);
  };
  return <div className={`keepsake-gallery keepsake-${theme}`} role="region" aria-label="Our keepsake photographs" aria-roledescription="carousel" tabIndex={0} onKeyDown={event => {
    if (event.key === 'ArrowRight') { event.preventDefault(); change(1); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); change(-1); }
  }}>
    <div className="keepsake-stack" onPointerDown={event => { start.current = { x: event.clientX, y: event.clientY }; }} onPointerUp={event => {
      if (!start.current) return;
      const dx = event.clientX - start.current.x;
      const dy = event.clientY - start.current.y;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3) change(dx < 0 ? 1 : -1);
      start.current = null;
    }} onPointerCancel={() => { start.current = null; }}>
      <span className="keepsake-backing keepsake-backing-one" aria-hidden="true" />
      <span className="keepsake-backing keepsake-backing-two" aria-hidden="true" />
      <figure className={`keepsake-photo ${direction < 0 ? 'keepsake-backward' : ''}`} key={`${signature}-${current}`}>
        <div className="keepsake-image-wrap"><img src={images[current]} alt={supplied.length ? `Couple's keepsake photograph ${current + 1}` : ['A handwritten letter and wedding keepsakes', 'A beautifully set celebration table', 'A couple holding hands'][current]} loading="lazy" draggable={false} /></div>
        <figcaption>{(supplied.length ? personalCaptions : captions)[current]}</figcaption>
      </figure>
    </div>
    <div className="keepsake-controls">
      <button type="button" className="keepsake-arrow" onClick={() => change(-1)} disabled={images.length === 1} aria-label="Previous photograph">←</button>
      <span className="keepsake-count" aria-live="polite" aria-atomic="true"><strong>{String(current + 1).padStart(2, '0')}</strong><span aria-hidden="true"> / </span><span className="keepsake-sr-only"> of </span>{String(images.length).padStart(2, '0')}</span>
      <button type="button" className="keepsake-arrow" onClick={() => change(1)} disabled={images.length === 1} aria-label="Next photograph">→</button>
    </div>
    {!supplied.length && <p className="keepsake-demo-label">Sample photographs · replace with your memories</p>}
  </div>;
}
