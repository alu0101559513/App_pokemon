import React from "react";
import "../../styles/trade_modals.css"; 

interface Props {
  visible: boolean;
  onClose: () => void;
  onSendMessage: () => void;
  onSendCard: () => void;
}

const TradeModeModal: React.FC<Props> = ({
  visible,
  onClose,
  onSendMessage,
  onSendCard,
}) => {
  if (!visible) return null;

  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <div className="trade-overlay" onClick={onClose}>
      <div className="trade-mode-panel" onClick={stop}>
        <h2 className="trade-mode-title">Selecciona modo de intercambio</h2>

        <div className="trade-mode-options">
          <button className="trade-mode-btn msg" onClick={onSendMessage}>
             Enviar mensaje
          </button>

          <button className="trade-mode-btn card" onClick={onSendCard}>
             Enviar carta
          </button>
        </div>

        <button className="trade-mode-cancel" onClick={onClose}>
          Cancelar
        </button>
      </div>
    </div>
  );
};

export default TradeModeModal;

