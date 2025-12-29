import React from 'react';
import '../../styles/trade_modals.css';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSend: () => void;
  cardImage: string;
  owners: { username: string; quantity: number }[];
  selectedOwner: string;
  onOwnerChange: (u: string) => void;
  note: string;
  onNoteChange: (v: string) => void;
}

const TradeMessageModal: React.FC<Props> = ({
  visible,
  onClose,
  onSend,
  cardImage,
  owners,
  selectedOwner,
  onOwnerChange,
  note,
  onNoteChange,
}) => {
  if (!visible) return null;

  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <div className="trade-overlay" onClick={onClose}>
      <div className="trade-offer-panel" onClick={stop}>
        <h2 className="trade-mode-title">Enviar mensaje</h2>
        <div className="trade-offer-body">
          <div className="trade-offer-left">
            <img src={cardImage} alt="card" className="trade-offer-img" />
          </div>

          <div className="trade-offer-right">
            <label className="trade-request-label">
              Usuario con el que quieres intercambiar
            </label>

            <select
              className="trade-request-select"
              value={selectedOwner}
              onChange={(e) => onOwnerChange(e.target.value)}
            >
              {owners.map((o) => (
                <option key={o.username} value={o.username}>
                  @{o.username} {o.quantity > 1 ? `(${o.quantity} uds)` : ''}
                </option>
              ))}
            </select>

            <label
              className="trade-request-label"
              style={{ marginTop: '14px' }}
            >
              Mensaje o carta que ofreces
            </label>

            <textarea
              className="trade-request-textarea full-width"
              value={note}
              onChange={(e) => onNoteChange(e.target.value)}
              placeholder="Describe la carta que ofreces o los términos del intercambio…"
            />

            <div className="trade-offer-actions">
              <button className="trade-request-cancel" onClick={onClose}>
                Cancelar
              </button>
              <button className="trade-request-submit" onClick={onSend}>
                Enviar solicitud
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradeMessageModal;
