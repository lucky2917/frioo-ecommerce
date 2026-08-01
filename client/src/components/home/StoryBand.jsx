import { Link } from 'react-router-dom';
import SwipeRow from './SwipeRow';
import { prefetchHandlers } from '../../hooks/usePrefetchRoute';
import { loadShop } from '../../lib/routeLoaders';

const STORY_IMAGE = 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=1600&q=80';

const STEPS = [
  { key: 'market', title: 'Before sunrise', body: 'We buy from the Vizag markets each morning, choosing by hand rather than by order sheet.' },
  { key: 'kitchen', title: 'Prepped the same day', body: 'Juices are pressed and salads are cut in our Allipuram kitchen, never the night before.' },
  { key: 'door', title: 'At your door', body: 'Packed and driven out within our 6 km radius, so it reaches you while it is still cold.' }
];

export default function StoryBand() {
  return (
    <section className="fr-story" aria-label="How Frioo works">
      <div className="fr-story-media" aria-hidden="true">
        <img src={STORY_IMAGE} alt="" loading="lazy" decoding="async" />
        <div className="fr-story-veil" />
      </div>

      <div className="fr-wrap fr-story-inner">
        <header className="fr-story-head">
          <p className="fr-eyebrow fr-story-eyebrow">Our day</p>
          <h2 className="fr-story-title">From the market to your kitchen, in one day</h2>
        </header>

        <SwipeRow as="ol" className="fr-story-steps" count={STEPS.length} column="80%" onDark>
          {STEPS.map(({ key, title, body }, index) => (
            <li className="fr-story-step" key={key} style={{ '--fr-stagger': index }}>
              <span className="fr-story-num">{String(index + 1).padStart(2, '0')}</span>
              <h3 className="fr-story-step-title">{title}</h3>
              <p className="fr-story-step-body">{body}</p>
            </li>
          ))}
        </SwipeRow>

        <Link to="/shop" className="fr-story-cta" {...prefetchHandlers(loadShop)}>Shop today&apos;s range</Link>
      </div>

      <style>{`
        .fr-story { position: relative; padding: var(--fr-s10) 0; overflow: hidden; isolation: isolate; background: var(--fr-brand); }
        .fr-story-media { position: absolute; inset: 0; z-index: -1; }
        .fr-story-media img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .fr-story-veil { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(10, 24, 18, 0.9) 0%, rgba(10, 24, 18, 0.82) 100%); }
        .fr-story-head { max-width: 42rem; margin-bottom: var(--fr-s8); }
        .fr-story-eyebrow { color: #A8D5B5; }
        .fr-story-title { font-family: var(--fr-font-display); font-size: var(--fr-fs-headline); font-weight: var(--fr-fw-bold); line-height: var(--fr-lh-tight); letter-spacing: var(--fr-track-headline); color: #FFFFFF; margin: 0; text-wrap: balance; }
        .fr-story-steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--fr-s7); list-style: none; margin: 0 0 var(--fr-s8); padding: 0; }
        .fr-story-step { border-top: 1px solid rgba(255, 255, 255, 0.28); padding-top: var(--fr-s4); }
        .fr-story-num { display: block; font-family: var(--fr-font-mono); font-size: var(--fr-fs-eyebrow); font-weight: var(--fr-fw-medium); line-height: var(--fr-lh-snug); letter-spacing: var(--fr-track-eyebrow); color: #A8D5B5; margin-bottom: var(--fr-s3); }
        .fr-story-step-title { font-family: var(--fr-font-display); font-size: var(--fr-fs-title); font-weight: var(--fr-fw-bold); line-height: var(--fr-lh-snug); letter-spacing: var(--fr-track-headline); color: #FFFFFF; margin: 0 0 var(--fr-s2); }
        .fr-story-step-body { font-family: var(--fr-font-sans); font-size: var(--fr-fs-body); font-weight: var(--fr-fw-regular); line-height: var(--fr-lh-relaxed); color: #CBDDD2; margin: 0; }
        .fr-story-cta { display: inline-flex; align-items: center; justify-content: center; min-height: 52px; padding: 0 var(--fr-s7); background: var(--fr-surface); color: var(--fr-brand); border-radius: var(--fr-r-control); font-family: var(--fr-font-sans); font-size: var(--fr-fs-control); font-weight: var(--fr-fw-medium); line-height: var(--fr-lh-control); text-decoration: none; transition: background var(--fr-dur-quick) var(--fr-ease-standard); }
        .fr-story-cta:hover { background: #EAF3EC; }
        .fr-story-cta:focus-visible { outline: 2px solid #FFFFFF; outline-offset: 3px; }

        @media (prefers-reduced-motion: reduce) { .fr-story-cta { transition: none; } }
        @media (max-width: 900px) {
          .fr-story { padding: var(--fr-s9) 0; }
          .fr-story-steps { margin-bottom: 0; }
          .fr-story-step { padding: var(--fr-s4) var(--fr-s4) var(--fr-s5); background: rgba(255, 255, 255, 0.07); border-top: none; border-radius: var(--fr-r-card); }
          .fr-story-cta { width: 100%; margin-top: var(--fr-s7); }
        }
      `}</style>
    </section>
  );
}
