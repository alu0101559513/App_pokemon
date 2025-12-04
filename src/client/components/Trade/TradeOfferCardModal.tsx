import React from "react";
import "../../styles/trade_modals.css";

interface UserCard {
  id: string;
  name: string;
  image: string;
  rarity: string;
  pokemonTcgId?: string;
  price?: { low?: number; mid?: number; high?: number };
}

interface Props {
  visible: boolean;
  onClose: () => void;

  cardImage: string;
  owners: { username: string; quantity: number }[];

  selectedOwner: string;
  onOwnerChange: (v: string) => void;

  myCards: UserCard[];
  selectedMyCard: UserCard | null;
  onSelectMyCard: (card: UserCard) => void;

  onSend: () => void;
}

const TradeOfferCardModal: React.FC<Props> = ({
  visible,
  onClose,
  cardImage,
  owners,
  selectedOwner,
  onOwnerChange,
  myCards,
  selectedMyCard,
  onSelectMyCard,
  onSend,
}) => {
  if (!visible) return null;
  const stop = (e: React.MouseEvent) => e.stopPropagation();

  const PAGE_SIZE = 9;
  const [page, setPage] = React.useState(1);
  const totalPages = Math.ceil(myCards.length / PAGE_SIZE);

  const paginated = React.useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return myCards.slice(start, start + PAGE_SIZE);
  }, [page, myCards]);

  return (
    <div className="trade-overlay" onClick={onClose}>
      <div className="trade-offer-panel" onClick={stop}>
        <h2 className="trade-mode-title">Intercambiar por carta</h2>

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
                  @{o.username} {o.quantity > 1 ? `(${o.quantity} uds)` : ""}
                </option>
              ))}
            </select>
            <label className="trade-request-label" style={{ marginTop: "10px" }}>
              Selecciona una de tus cartas para ofrecer
            </label>

            <div className="trade-offer-grid">
              {paginated.length === 0 && (
                <p className="trade-no-cards">No tienes cartas marcadas para intercambio.</p>
              )}

              {paginated.map((c) => (
                <div
                  key={c.id}
                  className={`trade-offer-card ${selectedMyCard?.id === c.id ? "selected" : ""}`}
                  onClick={() => onSelectMyCard(c)}
                >
                  <img src={c.image} alt={c.name} />
                </div>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="trade-pagination">
                <button disabled={page === 1} onClick={() => setPage(page - 1)}>◀</button>
                <span>{page} / {totalPages}</span>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                >▶</button>
              </div>
            )}

            <div className="trade-offer-actions">
              <button className="trade-request-cancel" onClick={onClose}>
                Cancelar
              </button>

              <button
                className="trade-request-submit"
                disabled={!selectedMyCard}
                onClick={onSend}
              >
                Enviar solicitud
              </button>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default TradeOfferCardModal;
