import React, { useEffect, useState, useMemo } from "react";
import Header from "../components/Header/Header";
import Footer from "../components/Footer";
import { authService } from "../services/authService";
import { useTranslation } from "react-i18next";
import { Search, SlidersHorizontal } from "lucide-react";
import "../styles/discover.css";

import TradeModeModal from "@/components/Trade/TradeModeModal";
import TradeMessageModal from "@/components/Trade/TradeMessageModal";
import TradeOfferCardModal from "@/components/Trade/TradeOfferCardModal";

interface ApiCardNormalized {
  id: string;
  name: string;
  image: string;
  hp: string;
  set?: string;
  rarity: string;
  price?: { low?: number; mid?: number; high?: number };
  illustrator?: string;
  series?: string;
}

interface TradeOwnerInfo {
  username: string;
  quantity: number;
  condition?: string;
}

interface TradeCard extends ApiCardNormalized {
  owners: TradeOwnerInfo[];
}

interface UserCard {
  id: string;
  name: string;
  image: string;
  rarity: string;
  pokemonTcgId?: string;
  price?: {
    low?: number;
    mid?: number;
    high?: number;
  };
}


const CARDS_PER_PAGE = 12;

const DiscoverTradeCards: React.FC = () => {
  const { t } = useTranslation();
  const tt = (k: string, f: string) => {
    const v = t(k);
    return v === k ? f : v;
  };

  const user = authService.getUser();
  const currentUsername = user?.username;

  const [tradeCards, setTradeCards] = useState<TradeCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [priceOrder, setPriceOrder] = useState<"" | "asc" | "desc">("");
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);


  const [selectedCardForTrade, setSelectedCardForTrade] = useState<TradeCard | null>(null);
  const [selectedOwner, setSelectedOwner] = useState("");
  const [tradeNote, setTradeNote] = useState("");

  const [modeModalVisible, setModeModalVisible] = useState(false);
  const [messageModalVisible, setMessageModalVisible] = useState(false);
  const [offerModalVisible, setOfferModalVisible] = useState(false);

  const [myCards, setMyCards] = useState<UserCard[]>([]);
  const [selectedMyCard, setSelectedMyCard] = useState<UserCard | null>(null);


  const normalizeImageUrl = (url?: string) => {
    if (!url) return "";
    if (/\/(small|large|high|low)\.png$/i.test(url))
      return url.replace(/\/(small|large|high|low)\.png$/i, "/high.png");
    if (/\.(png|jpg|jpeg|gif|webp)$/i.test(url)) return url;
    return url.endsWith("/") ? url + "high.png" : url + "/high.png";
  };
const normalizeApiCard = (raw: any): ApiCardNormalized => {
  const id = raw.pokemonTcgId || raw.id || "";
  let img =
    raw.images?.large ||
    raw.images?.small ||
    raw.imageUrl ||
    raw.image ||
    "";

  if (!img && id.includes("-")) {
    const [setCode, number] = id.split("-");
    const series = (setCode.match(/^[a-zA-Z]+/) || ["xx"])[0];
    img = `https://assets.tcgdex.net/en/${series}/${setCode}/${number}/high.png`;
  }

  let priceObj: { low?: number; mid?: number; high?: number } | undefined =
    undefined;

  if (raw.price) {
    priceObj = {
      low:
        raw.price.cardmarketAvg ??
        raw.price.tcgplayerMarketPrice ??
        raw.price.low,
      mid:
        raw.price.avg ??
        raw.price.tcgplayerMarketPrice ??
        raw.price.cardmarketAvg ??
        raw.price.mid,
      high:
        raw.price.high ??
        raw.price.cardmarketAvg ??
        raw.price.tcgplayerMarketPrice,
    };
  } else if (raw.prices) {
    priceObj = {
      low: raw.prices.low ?? raw.prices.mid ?? raw.prices.high,
      mid: raw.prices.mid ?? raw.prices.low ?? raw.prices.high,
      high: raw.prices.high ?? raw.prices.mid ?? raw.prices.low,
    };
  } else if (raw.tcgplayer?.prices?.holofoil) {
    priceObj = {
      low: raw.tcgplayer.prices.holofoil.low,
      mid: raw.tcgplayer.prices.holofoil.mid,
      high: raw.tcgplayer.prices.holofoil.high,
    };
  }

  return {
    id,
    name: raw.name || "",
    image: normalizeImageUrl(img),
    hp: raw.hp || "",
    set: raw.set?.name || raw.set?.series || raw.set || raw.series || "",
    rarity: raw.rarity || "",
    illustrator: raw.illustrator ?? raw.artist ?? "",
    price: priceObj,
    series: raw.set?.series || raw.series || "",
  };
};

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        setLoading(true);
        const base = "http://localhost:3000";

        const params = new URLSearchParams();
        params.set("limit", "200");
        if (currentUsername) params.set("excludeUsername", currentUsername);

        const resp = await fetch(`${base}/usercards/discover?${params}`, {
          headers: {
            "Content-Type": "application/json",
            ...authService.getAuthHeaders(),
          },
        });
        if (!resp.ok) throw new Error("Error cargando intercambio");

        const data = await resp.json();
        const rawItems = data.cards || [];

        const ids = [...new Set(rawItems.map((i: any) => i.pokemonTcgId).filter(Boolean))];

        const details = await Promise.all(
          ids.map(async (id) => {
            const r = await fetch(`${base}/cards`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id }),
            });
            if (!r.ok) return null;
            const d = await r.json();
            return { id, card: normalizeApiCard(d.card || d) };
          })
        );

        const map = new Map<string, ApiCardNormalized>();
        details
          .filter((x): x is { id: string; card: ApiCardNormalized } => x !== null && typeof x.id === "string")
          .forEach((x) => map.set(x.id, x.card));

        const grouped = new Map<string, TradeCard>();

        for (const item of rawItems) {
          const id = item.pokemonTcgId;
          if (!id) continue;

          const owner = {
            username: item.userId?.username || "",
            quantity: item.quantity ?? 1,
          };

          if (!grouped.has(id)) {
            grouped.set(id, { ...map.get(id)!, owners: [owner] });
          } else {
            grouped.get(id)!.owners.push(owner);
          }
        }

        if (!mounted) return;
        setTradeCards([...grouped.values()]);
      } catch (err: any) {
        if (mounted) setError(err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [currentUsername]);

  const setsData = useMemo(() => {
    let list = [...tradeCards];
    const q = search.toLowerCase().trim();

    if (q) {
      list = list.filter((c) => {
        const ownerMatch = c.owners.some((o) =>
          o.username.toLowerCase().includes(q)
        );
        const priceMatch = c.price?.mid?.toString().includes(q);
        return (
          c.name.toLowerCase().includes(q) ||
          c.set?.toLowerCase().includes(q) ||
          c.rarity?.toLowerCase().includes(q) ||
          ownerMatch ||
          priceMatch
        );
      });
    }

    const bySet = new Map<string, TradeCard[]>();
    list.forEach((c) => {
      const set = c.set || "Otros";
      if (!bySet.has(set)) bySet.set(set, []);
      bySet.get(set)!.push(c);
    });

    const orderedSetNames = [...bySet.keys()].sort((a, b) => a.localeCompare(b));

    return { bySet, orderedSetNames };
  }, [tradeCards, search, priceOrder]);

  const paginatedSets = useMemo(() => {
    const pages: Array<Array<{ setName: string; cards: TradeCard[] }>> = [];
    let current: Array<{ setName: string; cards: TradeCard[] }> = [];
    let count = 0;

    for (const setName of setsData.orderedSetNames) {
      const cards = setsData.bySet.get(setName)!;
      let idx = 0;

      while (idx < cards.length) {
        if (count === CARDS_PER_PAGE) {
          pages.push(current);
          current = [];
          count = 0;
        }

        const remaining = CARDS_PER_PAGE - count;
        const take = Math.min(remaining, cards.length - idx);

        current.push({ setName, cards: cards.slice(idx, idx + take) });
        count += take;
        idx += take;

        if (count === CARDS_PER_PAGE) {
          pages.push(current);
          current = [];
          count = 0;
        }
      }
    }

    if (current.length) pages.push(current);
    return pages;
  }, [setsData]);

  const safePage = Math.min(page, paginatedSets.length);
  const pageData = paginatedSets[safePage - 1] || [];

  useEffect(() => {
    setPage(1);
  }, [search, priceOrder, tradeCards]);

  const TradeFlipCard = ({
    card,
    onProposeTrade,
  }: {
    card: TradeCard;
    onProposeTrade: (c: TradeCard) => void;
  }) => {
    const [flip, setFlip] = useState(false);
    const totalQuantity = card.owners.reduce((s, o) => s + o.quantity, 0);

    return (
      <div
        className={`flip-card ${flip ? "flipped" : ""}`}
        onMouseEnter={() => setFlip(true)}
        onMouseLeave={() => setFlip(false)}
      >
        <div className="flip-card-inner">
          <div className="flip-card-front pokemon-card holo-card">
            <img src={card.image} alt={card.name} />
          </div>
<div className="flip-card-back">
  <h3>{card.name}</h3>

  <p className="owner-line">
    @{card.owners[0].username}
    {card.owners.length > 1 && ` +${card.owners.length - 1}`}
  </p>

  <div className="card-attrs">
    <div className="attr-box">
      <div className="attr-label">{t('common.rarity')}</div>
      <div className="attr-value">{card.rarity}</div>
    </div>

    <div className="attr-box">
      <div className="attr-label">Set</div>
      <div className="attr-value">{card.set}</div>
    </div>

    <div className="attr-box">
      <div className="attr-label">HP</div>
      <div className="attr-value">{card.hp}</div>
    </div>

    <div className="attr-box">
      <div className="attr-label">Cantidad</div>
      <div className="attr-value">
        {card.owners.reduce((s, o) => s + o.quantity, 0)}
      </div>
    </div>
  </div>

  <div className="card-back-section">
    <div className="card-back-section-title">Ilustrador</div>
    <div className="attr-value">{card.illustrator || "—"}</div>
  </div>

  <div className={`price-box ${card.rarity?.toLowerCase().includes("rare") ? "gold-border" : ""}`}>
    <div className="price-label">Precio estimado</div>
    <div className="price-value">
      {card.price?.mid ? card.price.mid.toFixed(2) + "€" : "—"}
    </div>
  </div>

  <button className="trade-btn" onClick={(e) => { e.stopPropagation(); onProposeTrade(card); }}>
    Proponer intercambio
  </button>
</div>

        </div>
      </div>
    );
  };

  const handleOpenTradeMode = (card: TradeCard) => {
    setSelectedCardForTrade(card);
    setSelectedOwner(card.owners[0].username);
    setTradeNote("");
    setModeModalVisible(true);
  };
const loadMyCardsForTrade = async () => {
  if (!currentUsername) return;

  const resp = await fetch(
    `http://localhost:3000/usercards/${currentUsername}/collection?forTrade=true`
  );
  const data = await resp.json();

  const normalized = (data.cards || []).map((item: any) => {
    const card = item.cardId || item.card || {};

    let image =
      card.image ||
      card.imageUrl ||
      card.imageUrlHiRes ||
      card.images?.large ||
      card.images?.small ||
      "";

    const pokemonTcgId = item.pokemonTcgId || card.pokemonTcgId || "";
    if (!image && pokemonTcgId.includes("-")) {
      const [setCode, number] = pokemonTcgId.split("-");
      const series = (setCode.match(/^[a-zA-Z]+/) || ["xx"])[0];
      image = `https://assets.tcgdex.net/en/${series}/${setCode}/${number}/high.png`;
    }

    return {
      id: item._id || card._id || pokemonTcgId,
      name: card.name || item.name || "",
      image,
      rarity: card.rarity || "",
      pokemonTcgId,
    };
  });

  setMyCards(normalized);
};

const handleSendTradeRequest = async () => {
  if (!selectedCardForTrade) return;

  const base = "http://localhost:3000";

  try {
    const resp = await fetch(`${base}/trade-requests`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authService.getAuthHeaders(),
      },
      body: JSON.stringify({
        receiverIdentifier: selectedOwner,
        pokemonTcgId: selectedCardForTrade.id,
        cardName: selectedCardForTrade.name,
        cardImage: selectedCardForTrade.image,
        note: tradeNote,
        requestedPokemonTcgId: selectedCardForTrade.id,
      }),
    });

    const data = await resp.json();

    if (!resp.ok) {
      alert(data.error || "Error enviando solicitud.");
      return;
    }

    alert("Solicitud enviada.");
    setSelectedCardForTrade(null);
    setMessageModalVisible(false);

  } catch (err) {
    console.error(err);
    alert("Error enviando solicitud.");
  }
};

  const sendTradeWithCard = async () => {
  if (!selectedCardForTrade || !selectedMyCard) return;

  const base = "http://localhost:3000";

  try {
    const resp = await fetch(`${base}/trade-requests`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authService.getAuthHeaders(),
      },
      body: JSON.stringify({
        receiverIdentifier: selectedOwner,
        pokemonTcgId: selectedCardForTrade.id,
        cardName: selectedCardForTrade.name,
        cardImage: selectedCardForTrade.image,
        targetPrice: selectedCardForTrade.price?.mid ?? null,
        offeredPrice: selectedMyCard.price!?.mid ?? null,
        requestedPokemonTcgId: selectedCardForTrade.id,

        offeredCard: {
          pokemonTcgId: selectedMyCard.pokemonTcgId,
          cardName: selectedMyCard.name,
          cardImage: selectedMyCard.image,
        },
      }),
    });

    const data = await resp.json();

    if (!resp.ok) {
      if (data.error === "TRADE_VALUE_DIFF_TOO_HIGH") {
        alert("La diferencia de valor entre cartas es demasiado alta.");
        return;
      }

      alert(data.error || "Error enviando solicitud.");
      return;
    }
    alert("Solicitud enviada con carta.");
    setOfferModalVisible(false);
    setSelectedCardForTrade(null);

  } catch (err) {
    console.error(err);
    alert("Error al enviar solicitud.");
  }
};

  return (
    <div className="discover-page min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 px-4 py-10 md:px-10 lg:px-16">
        <div className="discover-header">
          <h2 className="featured-title">Descubrir cartas de intercambio</h2>
          <p className="discover-subtitle">
            Explora las cartas que otros usuarios han marcado como disponibles.
          </p>
        </div>
        <div className="discover-toolbar">
          <div className="discover-search">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar…"
              className="discover-search-input"
            />
            <Search className="discover-search-icon" />
          </div>

          <div className="discover-filter-wrapper">
            <button
              className="discover-filter-button"
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filtros
            </button>

            {showFilters && (
              <div className="discover-filter-panel">
                <select
                  value={priceOrder}
                  onChange={(e) =>
                    setPriceOrder(e.target.value as "" | "asc" | "desc")
                  }
                  className="discover-filter-select"
                >
                  <option value="">Orden por set</option>
                  <option value="asc">Precio más bajo</option>
                  <option value="desc">Precio más alto</option>
                </select>
              </div>
            )}
          </div>
        </div>
        <div className="discover-sets">
          {loading && (
            <div className="discover-empty">Cargando cartas…</div>
          )}

          {!loading &&
            pageData.map((block, i) => (
              <section key={i} className="discover-set-section">
                <div className="discover-set-header">
                  <h3 className="discover-set-title">{block.setName}</h3>
                  <span>{block.cards.length} cartas</span>
                </div>

                <div className="discover-set-grid">
                  {block.cards.map((card) => (
                    <TradeFlipCard
                      key={card.id}
                      card={card}
                      onProposeTrade={handleOpenTradeMode}
                    />
                  ))}
                </div>
              </section>
            ))}
          <div className="discover-pagination">
            <button
              disabled={safePage <= 1}
              onClick={() => setPage(page - 1)}
              className="CollectionButton"
            >
              Anterior
            </button>

            <span>{safePage} / {paginatedSets.length}</span>

            <button
              disabled={safePage >= paginatedSets.length}
              onClick={() => setPage(page + 1)}
              className="CollectionButton"
            >
              Siguiente
            </button>
          </div>
        </div>

        <TradeModeModal
          visible={modeModalVisible}
          onClose={() => setModeModalVisible(false)}
          onSendMessage={() => {
            setModeModalVisible(false);
            setMessageModalVisible(true);
          }}
          onSendCard={async () => {
            setModeModalVisible(false);
            await loadMyCardsForTrade();
            setOfferModalVisible(true);
          }}
        />
        {selectedCardForTrade && (
          <TradeMessageModal
            visible={messageModalVisible}
            onClose={() => setMessageModalVisible(false)}
            onSend={handleSendTradeRequest}
            cardImage={selectedCardForTrade.image}
            owners={selectedCardForTrade.owners}
            selectedOwner={selectedOwner}
            onOwnerChange={setSelectedOwner}
            note={tradeNote}
            onNoteChange={setTradeNote}
          />
        )}
        {selectedCardForTrade && (
          <TradeOfferCardModal
            visible={offerModalVisible}
            onClose={() => setOfferModalVisible(false)}
            cardImage={selectedCardForTrade.image}
            owners={selectedCardForTrade.owners}
            selectedOwner={selectedOwner}
            onOwnerChange={setSelectedOwner}
            myCards={myCards}
            selectedMyCard={selectedMyCard}
            onSelectMyCard={setSelectedMyCard}
            onSend={sendTradeWithCard}
          />
        )}

      </main>

      <Footer />
    </div>
  );
};

export default DiscoverTradeCards;
