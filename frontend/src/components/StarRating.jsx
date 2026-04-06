import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';

export default function StarRating({ rating = 0, showNumber = true, size = 'default' }) {
  const stars = Array.from({ length: 5 }, (_, i) => {
    const val = i + 1;
    if (rating >= val) return 'full';
    if (rating >= val - 0.5) return 'half';
    return 'empty';
  });

  const fontSize = size === 'sm' ? '0.75rem' : size === 'lg' ? '1.1rem' : '0.9rem';

  return (
    <div className="star-rating" style={{ fontSize }}>
      {stars.map((type, i) => (
        <span key={i} className={`star ${type === 'empty' ? 'empty' : 'filled'}`}>
          {type === 'full' && <FaStar />}
          {type === 'half' && <FaStarHalfAlt />}
          {type === 'empty' && <FaRegStar />}
        </span>
      ))}
      {showNumber && (
        <span className="rating-number">{Number(rating).toFixed(1)}</span>
      )}
    </div>
  );
}
