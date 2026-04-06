import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  FaWrench, FaBolt, FaBroom, FaHardHat,
  FaPaintRoller, FaLeaf, FaArrowRight,
} from 'react-icons/fa';
import { FiZap, FiSearch, FiArrowRight, FiCheck } from 'react-icons/fi';
import { MdOutlineHomeRepairService } from 'react-icons/md';
import ProviderCard from '../components/ProviderCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { getProviders } from '../api/providers';

/* ── Floating Orb ─────────────────────────────── */
function Orb({ style, animClass }) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        borderRadius: '50%',
        filter: 'blur(80px)',
        pointerEvents: 'none',
        ...style,
      }}
      className={animClass}
    />
  );
}

/* ── Typewriter headline ──────────────────────── */
const HEADLINE_WORDS = ['Plumber', 'Electrician', 'Cleaner', 'Painter', 'Handyman'];

function TypewriterWord() {
  const [idx, setIdx] = useState(0);
  const [text, setText] = useState('');
  const [del, setDel] = useState(false);
  const word = HEADLINE_WORDS[idx];

  useEffect(() => {
    let timer;
    if (!del && text.length < word.length) {
      timer = setTimeout(() => setText(word.slice(0, text.length + 1)), 90);
    } else if (!del && text.length === word.length) {
      timer = setTimeout(() => setDel(true), 1600);
    } else if (del && text.length > 0) {
      timer = setTimeout(() => setText(text.slice(0, -1)), 55);
    } else if (del && text.length === 0) {
      setDel(false);
      setIdx((i) => (i + 1) % HEADLINE_WORDS.length);
    }
    return () => clearTimeout(timer);
  }, [text, del, word]);

  return (
    <span style={{
      background: 'linear-gradient(135deg, #A78BFA 0%, #00F5A0 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      borderRight: '3px solid #00F5A0',
      paddingRight: '3px',
      animation: 'pulse-mint 1s ease-in-out infinite',
    }}>
      {text || '\u00A0'}
    </span>
  );
}

/* ── Category pill card ───────────────────────── */
const CATEGORIES = [
  { name: 'Plumbing', icon: <FaWrench />, accent: '#60A5FA' },
  { name: 'Electrical', icon: <FaBolt />, accent: '#FBBF24' },
  { name: 'Cleaning', icon: <FaBroom />, accent: '#34D399' },
  { name: 'Construction', icon: <FaHardHat />, accent: '#F87171' },
  { name: 'Painting', icon: <FaPaintRoller />, accent: '#A78BFA' },
  { name: 'Gardening', icon: <FaLeaf />, accent: '#2DD4BF' },
];

/* ── How it works steps ───────────────────────── */
const STEPS = [
  { num: '01', title: 'Browse & Filter', body: 'Search providers by service type. Every listing is a real person — no bots, no fake reviews.' },
  { num: '02', title: 'Pick a Slot', body: 'Choose a time that works for you. The provider confirms and you get notified instantly.' },
  { num: '03', title: 'Job Done', body: 'Service is delivered, invoice is auto-generated. Pay only when you\'re satisfied.' },
];

/* ── Features ──────────────────────── */
const PERKS = [
  'Verified professional profiles',
  'Priority customer support — real humans, fast',
  'Secure matching technology',
];

export default function Landing() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getProviders()
      .then((res) => { if (res.success) setProviders(res.data); })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  const displayed = providers.slice(0, 6);

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh', overflowX: 'hidden' }}>

      {/* ══════════════════════════════════════════
          HERO
      ══════════════════════════════════════════ */}
      <section style={{ position: 'relative', minHeight: '92vh', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>

        {/* Animated gradient orbs */}
        <Orb animClass="float-a-anim" style={{
          width: '520px', height: '520px',
          top: '-140px', right: '-100px',
          background: 'radial-gradient(circle, rgba(124,58,237,0.28) 0%, transparent 70%)',
          animation: 'float-a 9s ease-in-out infinite',
        }} />
        <Orb animClass="float-b-anim" style={{
          width: '380px', height: '380px',
          bottom: '-80px', left: '-80px',
          background: 'radial-gradient(circle, rgba(0,245,160,0.18) 0%, transparent 70%)',
          animation: 'float-b 12s ease-in-out infinite',
        }} />
        <Orb animClass="float-c-anim" style={{
          width: '260px', height: '260px',
          top: '30%', left: '30%',
          background: 'radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 70%)',
          animation: 'float-c 16s ease-in-out infinite',
        }} />

        {/* Subtle grid pattern */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />

        <div className="container" style={{ position: 'relative', zIndex: 1, padding: '6rem 1.5rem' }}>
          <div style={{ maxWidth: '780px' }}>

            {/* Headline */}
            <h1 className="animate-fade-up delay-1" style={{
              fontSize: 'clamp(2.4rem, 6vw, 4.25rem)',
              fontWeight: 800,
              lineHeight: 1.08,
              marginBottom: '1.75rem',
              letterSpacing: '-0.03em',
            }}>
              Book a trusted{' '}
              <TypewriterWord />
              <br />
              <span style={{ color: 'var(--text-secondary)', fontWeight: 300, fontStyle: 'italic', fontSize: '0.75em' }}>
                in your city, today.
              </span>
            </h1>

            <p className="animate-fade-up delay-2" style={{
              fontSize: '1.1rem',
              color: 'var(--text-secondary)',
              maxWidth: '540px',
              lineHeight: 1.7,
              marginBottom: '2.5rem',
            }}>
              ServeMart connects you with verified local professionals for plumbing, electrical work, cleaning, and more.
            </p>

            {/* CTA row */}
            <div className="animate-fade-up delay-3" style={{
              display: 'flex', gap: '0.875rem', flexWrap: 'wrap', alignItems: 'center',
              marginBottom: '3rem',
            }}>
              <Link to="/register/customer" className="btn btn-primary btn-lg" style={{ minWidth: '220px' }}>
                Find a Professional <FiArrowRight />
              </Link>
              <Link to="/register/provider" className="btn btn-mint btn-lg" style={{ minWidth: '220px' }}>
                Join as Professional <FaHardHat />
              </Link>
            </div>

            {/* Search bar (public preview) */}
            <div className="animate-fade-up delay-4" style={{ maxWidth: '520px' }}>
              <div className="search-bar">
                <FiSearch style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                <input
                  placeholder="Search services — plumbing, cleaning, electrical..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <Link
                  to="/register/customer"
                  className="btn btn-primary btn-sm"
                  style={{ borderRadius: '999px', animation: 'none' }}
                >
                  Search
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* ══════════════════════════════════════════
          CATEGORIES
      ══════════════════════════════════════════ */}
      <section style={{ padding: '5rem 0' }}>
        <div className="container">
          <div style={{ marginBottom: '2.5rem' }}>
            <div style={{
              display: 'inline-block',
              fontFamily: 'Syne, sans-serif', fontWeight: 700,
              fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.12em',
              color: 'var(--accent-mint)', marginBottom: '0.75rem',
            }}>
              Services Available
            </div>
            <h2 style={{ marginBottom: '0.5rem' }}>What do you need done?</h2>
            <p>Every category, every skill — right in your neighbourhood.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem' }}>
            {CATEGORIES.map((cat, i) => (
              <Link
                key={cat.name}
                to="/register/customer"
                className="animate-fade-up"
                style={{
                  animationDelay: `${i * 0.07}s`,
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-xl)',
                  padding: '1.5rem 1rem',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem',
                  textDecoration: 'none',
                  transition: 'all 0.25s ease',
                  position: 'relative', overflow: 'hidden',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = cat.accent;
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = `0 12px 32px ${cat.accent}22`;
                  e.currentTarget.querySelector('.cat-icon').style.background = cat.accent;
                  e.currentTarget.querySelector('.cat-icon').style.color = '#0D0F1A';
                  e.currentTarget.querySelector('.cat-icon').style.boxShadow = `0 0 20px ${cat.accent}55`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.querySelector('.cat-icon').style.background = `${cat.accent}18`;
                  e.currentTarget.querySelector('.cat-icon').style.color = cat.accent;
                  e.currentTarget.querySelector('.cat-icon').style.boxShadow = 'none';
                }}
              >
                <div className="cat-icon" style={{
                  width: '56px', height: '56px', borderRadius: '14px',
                  background: `${cat.accent}18`, color: cat.accent,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.5rem',
                  transition: 'all 0.25s ease',
                }}>
                  {cat.icon}
                </div>
                <span style={{
                  fontSize: '0.875rem', fontWeight: 600,
                  fontFamily: 'Syne, sans-serif',
                  color: 'var(--text-secondary)',
                  textAlign: 'center', transition: 'color 0.25s',
                }}>
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          PROVIDERS GRID
      ══════════════════════════════════════════ */}
      <section style={{ padding: '0 0 5rem', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-subtle)' }}>
        <div className="container" style={{ paddingTop: '5rem' }}>
          <div style={{
            display: 'flex', alignItems: 'flex-end',
            justifyContent: 'space-between', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem',
          }}>
            <div>
              <div style={{
                fontFamily: 'Syne, sans-serif', fontWeight: 700,
                fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.12em',
                color: 'var(--accent-mint)', marginBottom: '0.75rem',
              }}>
                Meet the team
              </div>
              <h2 style={{ marginBottom: '0.375rem' }}>Providers on ServeMart</h2>
              <p style={{ fontSize: '0.9rem' }}>Real professionals. Real people. Every one verified by us.</p>
            </div>
            <Link to="/register/customer" className="btn btn-outline btn-sm">
              View All <FiArrowRight />
            </Link>
          </div>

          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
              {[1, 2, 3].map((i) => (
                <div key={i} className="shimmer" style={{ height: '180px', borderRadius: 'var(--radius-xl)' }} />
              ))}
            </div>
          ) : displayed.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
              {displayed.map((p, i) => (
                <div key={p.PROVIDER_ID || p.provider_id || i} className="animate-fade-up" style={{ animationDelay: `${i * 0.08}s` }}>
                  <ProviderCard provider={p} onBook={() => { }} />
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              textAlign: 'center', padding: '4rem 2rem',
              background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)',
              border: '1px dashed var(--border-medium)',
            }}>
              <MdOutlineHomeRepairService size={52} style={{ color: 'rgba(124,58,237,0.3)', marginBottom: '1rem' }} />
              <h4 style={{ marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>No providers yet</h4>
              <p style={{ fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                Be the very first provider on ServeMart in your city.
              </p>
              <Link to="/register/provider" className="btn btn-mint">
                Register as Provider
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════════ */}
      <section style={{ padding: '5rem 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <div style={{
              fontFamily: 'Syne, sans-serif', fontWeight: 700,
              fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.12em',
              color: 'var(--accent-violet)', marginBottom: '0.75rem',
            }}>
              The Process
            </div>
            <h2 style={{ marginBottom: '0.5rem' }}>Simple. Transparent. Done.</h2>
            <p>Three steps to a finished job.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', position: 'relative' }}>
            {/* connector line */}
            <div aria-hidden="true" style={{
              position: 'absolute', top: '3rem', left: '20%', right: '20%', height: '1px',
              background: 'linear-gradient(90deg, transparent, var(--border-violet), transparent)',
              pointerEvents: 'none',
            }} />
            {STEPS.map((s, i) => (
              <div
                key={s.num}
                className="card animate-fade-up"
                style={{
                  textAlign: 'center', padding: '2rem 1.5rem',
                  animationDelay: `${i * 0.12}s`,
                  position: 'relative',
                }}
              >
                <div style={{
                  width: '56px', height: '56px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(0,245,160,0.1))',
                  border: '1px solid rgba(124,58,237,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 1.25rem',
                  fontFamily: 'Syne, sans-serif', fontWeight: 800,
                  fontSize: '1rem', color: 'var(--accent-mint)',
                }}>
                  {s.num}
                </div>
                <h4 style={{ marginBottom: '0.625rem' }}>{s.title}</h4>
                <p style={{ fontSize: '0.875rem', lineHeight: 1.65 }}>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          PROVIDER CTA BANNER
      ══════════════════════════════════════════ */}
      <section style={{ padding: '0 1.5rem 5rem' }}>
        <div className="container">
          <div style={{
            background: 'linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(0,245,160,0.06) 100%)',
            border: '1px solid rgba(124,58,237,0.3)',
            borderRadius: 'var(--radius-xl)',
            padding: '3rem',
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            alignItems: 'center',
            gap: '2rem',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* decorative orb */}
            <div aria-hidden="true" style={{
              position: 'absolute', right: '-60px', top: '-60px',
              width: '200px', height: '200px', borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(0,245,160,0.1) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />

            <div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                background: 'rgba(0,245,160,0.1)', border: '1px solid rgba(0,245,160,0.2)',
                borderRadius: '999px', padding: '0.3rem 0.875rem',
                fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-mint)',
                fontFamily: 'Syne, sans-serif', textTransform: 'uppercase',
                letterSpacing: '0.08em', marginBottom: '1rem',
              }}>
                <FiZap size={12} /> For Professionals
              </div>
              <h2 style={{ marginBottom: '0.75rem', maxWidth: '480px' }}>
                Earn on your schedule. Grow your business.
              </h2>
              <p style={{ fontSize: '0.95rem', maxWidth: '420px' }}>
                List your skills, set your rates, and start getting booked. Join real professionals building trust.
              </p>
            </div>
            <div style={{ flexShrink: 0 }}>
              <Link to="/register/provider" className="btn btn-mint btn-lg">
                Join as Provider <FaArrowRight />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════ */}
      <footer style={{
        background: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border-subtle)',
        padding: '2.5rem 1.5rem',
      }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FiZap size={18} style={{ color: '#A78BFA' }} />
            <span style={{
              fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.1rem',
              background: 'linear-gradient(135deg, #A78BFA, #00F5A0)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              ServeMart
            </span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            © 2026 ServeMart — Built by Abhyuday, Shaurya & Neelaksha · CSE-C, Batch 2024
          </p>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            {['Privacy', 'Terms', 'Contact'].map((l) => (
              <Link key={l} to="/" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', transition: 'color 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-mint)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
              >
                {l}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
