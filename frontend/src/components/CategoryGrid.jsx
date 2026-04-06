import {
  FaWrench, FaBolt, FaBroom, FaHardHat,
  FaPaintRoller, FaLeaf, FaCar, FaShieldAlt,
} from 'react-icons/fa';

const ALL_CATEGORIES = [
  { name: 'Plumbing',      icon: <FaWrench />,      key: 'PLUMBING' },
  { name: 'Electrical',    icon: <FaBolt />,         key: 'ELECTRICAL' },
  { name: 'Cleaning',      icon: <FaBroom />,        key: 'CLEANING' },
  { name: 'Construction',  icon: <FaHardHat />,      key: 'CONSTRUCTION' },
  { name: 'Painting',      icon: <FaPaintRoller />,  key: 'PAINTING' },
  { name: 'Gardening',     icon: <FaLeaf />,         key: 'GARDENING' },
  { name: 'Auto Care',     icon: <FaCar />,          key: 'AUTO' },
  { name: 'Security',      icon: <FaShieldAlt />,    key: 'SECURITY' },
];

export default function CategoryGrid({ selected, onSelect, categories }) {
  const display = categories?.length
    ? categories.map((c) => {
        const match = ALL_CATEGORIES.find(
          (a) => a.name.toUpperCase() === (c.CATEGORY_NAME || c.category_name || '').toUpperCase()
        );
        return {
          name: c.CATEGORY_NAME || c.category_name,
          icon: match?.icon || <FaWrench />,
          key: c.CATEGORY_NAME || c.category_name,
        };
      })
    : ALL_CATEGORIES;

  return (
    <div className="category-grid">
      {display.map((cat, i) => (
        <div
          key={cat.key}
          className={`category-item${selected === cat.key ? ' active' : ''}`}
          onClick={() => onSelect && onSelect(selected === cat.key ? null : cat.key)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && onSelect && onSelect(cat.key)}
          style={{ animationDelay: `${i * 0.06}s` }}
        >
          <div className="category-icon">{cat.icon}</div>
          <span className="category-name">{cat.name}</span>
        </div>
      ))}
    </div>
  );
}
