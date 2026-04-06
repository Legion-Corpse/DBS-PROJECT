export default function LoadingSpinner({ text = 'Loading...', size = 'default', shimmer = false }) {
  if (shimmer) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="shimmer" style={{
            height: '80px',
            borderRadius: 'var(--radius-xl)',
            animationDelay: `${i * 0.15}s`,
          }} />
        ))}
      </div>
    );
  }

  return (
    <div className="spinner-overlay">
      <div className={`spinner${size === 'sm' ? ' spinner-sm' : ''}`} />
      {text && <p className="spinner-text">{text}</p>}
    </div>
  );
}
