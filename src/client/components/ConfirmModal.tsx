import React from 'react';
import { CheckCircle, XCircle, Info } from 'lucide-react';
import '../styles/modal.css';

type Variant = 'success' | 'error' | 'info';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  variant?: 'success' | 'error' | 'info';
  onClose: () => void;
  onConfirm?: () => void;
}

const icons: Record<Variant, React.ReactNode> = {
  success: <CheckCircle size={42} />,
  error: <XCircle size={42} />,
  info: <Info size={42} />,
};

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  open,
  title,
  message,
  variant = 'info',
  onClose,
  onConfirm,
}) => {
  if (!open) return null;

  return (
    <div className="modalOverlay">
      <div className={`modalCard modal-${variant}`}>
        <div className="modalIcon">{icons[variant]}</div>

        <h3 className="modalTitle">{title}</h3>
        <p className="modalMessage">{message}</p>

        <div className="modalActions">
          <button className="modalBtn modalBtn--secondary" onClick={onClose}>
            Cancelar
          </button>

          {onConfirm && (
            <button className="modalBtn modalBtn--primary" onClick={onConfirm}>
              Confirmar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
