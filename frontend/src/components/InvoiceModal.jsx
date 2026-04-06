import { FiX, FiPrinter, FiCheckCircle } from 'react-icons/fi';

export default function InvoiceModal({ invoice, onClose }) {
  if (!invoice) return null;

  const inv = invoice;

  return (
    <div className="modal-overlay" style={{ backdropFilter: 'blur(8px)', zIndex: 1000 }}>
      <div className="modal-box" style={{ maxWidth: '600px', padding: '0', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ background: 'var(--purple-primary)', color: 'white', padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0 }}>Invoice #{inv.INVOICE_ID}</h3>
            <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.8 }}>Issued on {new Date(inv.GENERATED_AT).toLocaleDateString()}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.5rem' }}>
            <FiX />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
            <div>
              <p style={{ fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>BILL FROM</p>
              <h4 style={{ margin: 0 }}>ServeMart Marketplace</h4>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>support@servemart.com</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>STATUS</p>
              <span className={`status-pill status-${(inv.PAYMENT_STATUS || 'PENDING').toLowerCase()}`}>
                {inv.PAYMENT_STATUS || 'PENDING'}
              </span>
            </div>
          </div>

          <div className="divider" />

          {/* Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <th style={{ textAlign: 'left', padding: '1rem 0', color: 'var(--text-muted)', fontWeight: 600 }}>Description</th>
                <th style={{ textAlign: 'center', padding: '1rem 0', color: 'var(--text-muted)', fontWeight: 600 }}>Qty/Hrs</th>
                <th style={{ textAlign: 'right', padding: '1rem 0', color: 'var(--text-muted)', fontWeight: 600 }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '1rem 0' }}>Professional Service Fee</td>
                <td style={{ textAlign: 'center', padding: '1rem 0' }}>1.0</td>
                <td style={{ textAlign: 'right', padding: '1rem 0' }}>₹{Number(inv.BASE_AMOUNT).toFixed(2)}</td>
              </tr>
              {inv.PLATFORM_FEE > 0 && (
                <tr>
                  <td style={{ padding: '1rem 0' }}>Platform Service Fee (10%)</td>
                  <td style={{ textAlign: 'center', padding: '1rem 0' }}>—</td>
                  <td style={{ textAlign: 'right', padding: '1rem 0' }}>₹{Number(inv.PLATFORM_FEE).toFixed(2)}</td>
                </tr>
              )}
              {inv.DISCOUNT_AMOUNT > 0 && (
                <tr style={{ color: 'var(--success)' }}>
                  <td style={{ padding: '1rem 0' }}>Promo Discount</td>
                  <td style={{ textAlign: 'center', padding: '1rem 0' }}>—</td>
                  <td style={{ textAlign: 'right', padding: '1rem 0' }}>−₹{Number(inv.DISCOUNT_AMOUNT).toFixed(2)}</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Totals */}
          <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Subtotal</span>
              <span>₹{(Number(inv.BASE_AMOUNT) + Number(inv.PLATFORM_FEE || 0) - Number(inv.DISCOUNT_AMOUNT || 0)).toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Tax (5%)</span>
              <span>₹{Number(inv.TAX_AMOUNT).toFixed(2)}</span>
            </div>
            <div className="divider" style={{ margin: '0.75rem 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.25rem' }}>
              <span>Total Bill Amount</span>
              <span style={{ color: 'var(--purple-primary)' }}>₹{Number(inv.NET_TOTAL).toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Info */}
          <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', borderRadius: 'var(--radius-md)', fontSize: '0.875rem' }}>
            <FiCheckCircle size={20} />
            <div>
              <div style={{ fontWeight: 600 }}>Payment Confirmed</div>
              <div>Method: {inv.PAYMENT_METHOD || 'Cash'} — Trxn: {inv.TRANSACTION_ID || 'N/A'}</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '1.5rem 2rem', background: 'var(--bg-secondary)', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => window.print()}>
            <FiPrinter style={{ marginRight: '0.375rem' }} /> Print Invoice
          </button>
          <button className="btn btn-primary btn-sm" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
