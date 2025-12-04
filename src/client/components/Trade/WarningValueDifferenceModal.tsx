import React from "react";
import "../../styles/trade_modals.css";

interface Props {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  difference: number; 
}

const WarningValueDifferenceModal: React.FC<Props> = ({
  visible,
  onClose,
  onConfirm,
  difference,
}) => {
  if (!visible) return null;
  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <div className="trade-overlay" onClick={onClose}>
      <div className="trade-warning-panel" onClick={stop}>
        <h2 className="trade-warning-title">Diferencia de valor elevada</h2>

        <p className="trade-warning-text">
          La diferencia de valor entre las dos cartas es:
        </p>

        <p className="trade-warning-number">{difference.toFixed(2)}%</p>

        <p className="trade-warning-sub">
          ¿Seguro que deseas continuar?  
          El otro usuario podría rechazar esta oferta.
        </p>

        <div className="trade-warning-actions">
          <button className="trade-request-cancel" onClick={onClose}>
            Cancelar
          </button>

          <button className="trade-request-submit" onClick={onConfirm}>
            Continuar de todas formas
          </button>
        </div>
      </div>
    </div>
  );
};

export default WarningValueDifferenceModal;
