import { FiAlertCircle, FiCheckCircle, FiX } from 'react-icons/fi';

export default function ErrorModal({ error, onClose, success = false, title, message }) {
  const displayTitle = title || (success ? 'Success' : 'Something went wrong');
  const displayMessage = message || (error?.message || error || 'An unexpected error occurred.');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className={`modal-icon${success ? ' success' : ''}`}>
          {success ? <FiCheckCircle /> : <FiAlertCircle />}
        </div>
        <h3>{displayTitle}</h3>
        <p>{displayMessage}</p>
        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onClose}>
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
