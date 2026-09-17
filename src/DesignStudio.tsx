import { useState } from 'react';
import { 
  themes, 
  defaultSectionOrder, 
  type ThemeId, 
  type InvitationData, 
  type FontMood, 
  type AtmosphereKind 
} from './data';
import { 
  TextT, 
  Sparkle, 
  Rows, 
  Check, 
  ArrowUp, 
  ArrowDown, 
  ArrowCounterClockwise, 
  Flower, 
  Clock
} from '@phosphor-icons/react';

interface DesignStudioProps {
  data: InvitationData;
  onUpdate: (partial: Partial<InvitationData>) => void;
  onPreviewFull?: () => void;
}

type DesignSubTab = 'world' | 'typography' | 'atmosphere' | 'layout';

const fontMoodDetails: { id: FontMood; name: string; subtitle: string; fontClass: string; previewSample: string }[] = [
  { id: 'cormorant', name: 'Heirloom Classical', subtitle: 'Timeless, romantic, and regal European letterpress serif', fontClass: 'font-mood-cormorant', previewSample: 'Cormorant Garamond' },
  { id: 'dm-serif', name: 'High-Fashion Editorial', subtitle: 'Dramatic, bold, and modern vogue display lettering', fontClass: 'font-mood-dm-serif', previewSample: 'DM Serif Display' },
  { id: 'space-grotesk', name: 'Contemporary Chic', subtitle: 'Clean, architectural, and minimalist modern sans', fontClass: 'font-mood-space-grotesk', previewSample: 'Space Grotesk' },
  { id: 'script', name: 'Romantic Calligraphy', subtitle: 'Bespoke hand-flowing cursive script for names', fontClass: 'font-mood-script', previewSample: 'Great Vibes Calligraphy' },
];

const atmosphereOptions: { id: AtmosphereKind; label: string; desc: string }[] = [
  { id: 'auto', label: 'Theme Natural (Recommended)', desc: 'Curated atmospheric effects tuned to your chosen suite' },
  { id: 'flowers', label: 'Falling Botanical Petals 🌸', desc: 'Drifting organic blossoms and light dewdrops' },
  { id: 'sparkles', label: 'Golden Starlit Sparkles ✨', desc: 'Glowing nocturnal embers and candlelight reflections' },
  { id: 'fireflies', label: 'Garden Fireflies 🕯️', desc: 'Warm glowing orbs rising gently into the evening sky' },
  { id: 'none', label: 'Still / Minimalist 🍃', desc: 'Pure typography and artwork with zero particle motion' },
];

const sectionLabelDefaults: Record<string, string> = {
  welcome: 'Welcome Letter',
  couple: 'Couple Profiles',
  story: 'Our Love Story',
  events: 'Ceremony Schedule',
  scratch: 'Scratch-to-Reveal Surprise',
  gallery: 'Photo Keepsakes',
  notes: 'Travel & Guest Notes',
  rsvp: 'Guest Replies (RSVP)'
};

export default function DesignStudio({ data, onUpdate }: DesignStudioProps) {
  const [activeTab, setActiveTab] = useState<DesignSubTab>('world');

  const currentDesign = data.design || {};
  const currentSectionOrder = currentDesign.sectionOrder?.length ? currentDesign.sectionOrder : defaultSectionOrder;

  const updateDesign = (patch: Partial<NonNullable<InvitationData['design']>>) => {
    onUpdate({
      design: {
        ...currentDesign,
        ...patch
      }
    });
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...currentSectionOrder];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newOrder.length) return;
    const [moved] = newOrder.splice(index, 1);
    newOrder.splice(targetIndex, 0, moved);
    updateDesign({ sectionOrder: newOrder });
  };

  const updateSectionTitle = (sectionKey: string, customTitle: string) => {
    updateDesign({
      sectionTitles: {
        ...(currentDesign.sectionTitles || {}),
        [sectionKey]: customTitle
      }
    });
  };

  return (
    <div className="design-studio-container">
      {/* Design Studio Navigation Tabs */}
      <nav className="design-studio-nav" role="tablist" aria-label="Design customizer categories">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'world'}
          className={`design-nav-pill ${activeTab === 'world' ? 'active' : ''}`}
          onClick={() => setActiveTab('world')}
        >
          <Sparkle size={15} /> <span>Theme World</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'typography'}
          className={`design-nav-pill ${activeTab === 'typography' ? 'active' : ''}`}
          onClick={() => setActiveTab('typography')}
        >
          <TextT size={15} /> <span>Typography</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'atmosphere'}
          className={`design-nav-pill ${activeTab === 'atmosphere' ? 'active' : ''}`}
          onClick={() => setActiveTab('atmosphere')}
        >
          <Flower size={15} /> <span>Atmosphere</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'layout'}
          className={`design-nav-pill ${activeTab === 'layout' ? 'active' : ''}`}
          onClick={() => setActiveTab('layout')}
        >
          <Rows size={15} /> <span>Layout & Order</span>
        </button>
      </nav>

      {/* 1. Theme World Selector */}
      {activeTab === 'world' && (
        <section className="studio-section" aria-label="Theme World Selection">
          <div className="control-heading">
            <span className="eyebrow">FIVE BESPOKE DESIGN WORLDS</span>
            <h2>Select your aesthetic foundation</h2>
            <p>Switching your theme preserves all your words, events, and guest information.</p>
          </div>
          <div className="theme-picker">
            {themes.map((theme) => (
              <button
                key={theme.id}
                type="button"
                className={data.theme === theme.id ? 'selected' : ''}
                onClick={() => onUpdate({ theme: theme.id })}
                aria-pressed={data.theme === theme.id}
              >
                <img src={theme.art} alt="" />
                <span>
                  <strong>{theme.name}</strong>
                  <small>{theme.opening}</small>
                </span>
                {data.theme === theme.id ? <Check size={18} /> : null}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* 2. Typography Mood Customization */}
      {activeTab === 'typography' && (
        <section className="studio-section" aria-label="Typography Selection">
          <div className="control-heading">
            <span className="eyebrow">EDITORIAL TYPOGRAPHY</span>
            <h2>Choose your lettering mood</h2>
            <p>How your names and ceremony titles will be typeset across your suite.</p>
          </div>

          <div className="typography-grid">
            {fontMoodDetails.map((font) => {
              const isSelected = (currentDesign.fontMood || 'cormorant') === font.id;
              return (
                <button
                  key={font.id}
                  type="button"
                  className={`typography-card ${isSelected ? 'active' : ''}`}
                  onClick={() => updateDesign({ fontMood: font.id })}
                >
                  <div className={`font-preview-stage ${font.fontClass}`}>
                    <span>{data.name1 || 'Ishaan'} <i>&</i> {data.name2 || 'Ananya'}</span>
                  </div>
                  <div className="typography-info">
                    <strong>{font.name}</strong>
                    <small>{font.subtitle}</small>
                  </div>
                  {isSelected && <Check size={16} className="typography-check" />}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* 5. Atmosphere, Particles & Motion */}
      {activeTab === 'atmosphere' && (
        <section className="studio-section" aria-label="Atmosphere and Motion Effects">
          <div className="control-heading">
            <span className="eyebrow">AMBIENT SENSORY MOTION</span>
            <h2>Atmosphere & Particles</h2>
            <p>Fine-tune the floating particles and motion curves on your guests' screens.</p>
          </div>

          <div className="atmosphere-grid">
            {atmosphereOptions.map((atmo) => {
              const isSelected = (currentDesign.atmosphere || 'auto') === atmo.id;
              return (
                <button
                  key={atmo.id}
                  type="button"
                  className={`atmo-card ${isSelected ? 'active' : ''}`}
                  onClick={() => updateDesign({ atmosphere: atmo.id })}
                >
                  <div className="atmo-info">
                    <strong>{atmo.label}</strong>
                    <small>{atmo.desc}</small>
                  </div>
                  {isSelected && <Check size={16} />}
                </button>
              );
            })}
          </div>

          <div className="feature-toggle-card" style={{ marginTop: '28px' }}>
            <div className="toggle-info">
              <Clock size={20} />
              <div>
                <strong>Celebration Countdown Timer</strong>
                <small>Show live ticking days, hours, and minutes until your vows.</small>
              </div>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={currentDesign.countdown !== false}
                onChange={(e) => updateDesign({ countdown: e.target.checked })}
              />
              <span className="slider round" />
            </label>
          </div>
        </section>
      )}

      {/* 6. Layout & Section Reordering */}
      {activeTab === 'layout' && (
        <section className="studio-section" aria-label="Section Organization and Reordering">
          <div className="control-heading">
            <span className="eyebrow">STRUCTURE & FLOW</span>
            <h2>Organize Your Story</h2>
            <p>Reorder sections to craft your ideal narrative flow. Rename section headers to match your style.</p>
          </div>

          <div className="section-order-list">
            {currentSectionOrder.map((sectionId, idx) => {
              const defaultLabel = sectionLabelDefaults[sectionId] || sectionId;
              const customTitle = currentDesign.sectionTitles?.[sectionId] || '';

              return (
                <div key={sectionId} className="section-order-item">
                  <span className="section-index-badge">{idx + 1}</span>
                  <div className="section-item-details">
                    <strong>{defaultLabel}</strong>
                    <input
                      type="text"
                      placeholder={`Custom header (optional)`}
                      value={customTitle}
                      onChange={(e) => updateSectionTitle(sectionId, e.target.value)}
                      className="section-title-input"
                    />
                  </div>
                  <div className="section-reorder-buttons">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveSection(idx, 'up')}
                      aria-label={`Move ${defaultLabel} up`}
                      className="icon-button"
                    >
                      <ArrowUp size={15} />
                    </button>
                    <button
                      type="button"
                      disabled={idx === currentSectionOrder.length - 1}
                      onClick={() => moveSection(idx, 'down')}
                      aria-label={`Move ${defaultLabel} down`}
                      className="icon-button"
                    >
                      <ArrowDown size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            className="text-button"
            style={{ marginTop: '16px' }}
            onClick={() => updateDesign({ sectionOrder: defaultSectionOrder, sectionTitles: {} })}
          >
            <ArrowCounterClockwise size={14} /> Reset to default layout order
          </button>
        </section>
      )}
    </div>
  );
}
