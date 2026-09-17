import { themeById, type ThemeId, type DesignCustomization } from './data';
import { openingPoster } from './films';
import './invitation-cover.css';

interface InvitationCoverProps {
  theme: ThemeId;
  name1: string;
  name2: string;
  design?: DesignCustomization;
  onOpen: () => void;
  onSkip?: () => void;
}

export default function InvitationCover({
  theme,
  name1,
  name2,
  design,
  onOpen,
  onSkip
}: InvitationCoverProps) {
  const baseDesign = themeById(theme);
  const paperBg = design?.paperColor || baseDesign.paper;
  const inkColor = design?.accentColor || baseDesign.color;
  const customNote = design?.envelopeNote || 'A little something, just for you.';


  return (
    <section
      className={`cover-stage cover-${theme}`}
      style={{ backgroundColor: paperBg, color: inkColor }}
      aria-label={`${baseDesign.name} invitation opening`}
    >
      <button
        type="button"
        className="cover-seal"
        onClick={onOpen}
        aria-label={`Open ${name1 || 'your name'} and ${name2 || 'their name'}'s invitation`}
      >
        <picture>
          <source media="(min-width: 701px)" srcSet={openingPoster(theme, 'web')} />
          <img
            src={openingPoster(theme, 'mobile')}
            alt={`${baseDesign.name} handcrafted invitation, ready to open`}
            width="1080"
            height="1920"
            fetchPriority="high"
          />
        </picture>


        <span className="cover-tap">
          {customNote}
          <strong>
            Tap to open <span aria-hidden="true">↗</span>
          </strong>
        </span>
      </button>
      <button type="button" className="cover-skip" onClick={onSkip || onOpen}>
        Open without animation <span aria-hidden="true">→</span>
      </button>
    </section>
  );
}
