import React, { useEffect, useMemo, useRef, useState } from 'react';
import Header from '../components/Header/Header';
import Footer from '../components/Footer';
import { authService } from '../services/authService';
import { useTranslation } from 'react-i18next';
import {
  Search,
  SlidersHorizontal,
  X,
  LayoutGrid,
  Grid2X2,
  ChevronDown,
} from 'lucide-react';

import '../styles/discover.css';

import TradeModeModal from '@/components/Trade/TradeModeModal';
import TradeMessageModal from '@/components/Trade/TradeMessageModal';
import TradeOfferCardModal from '@/components/Trade/TradeOfferCardModal';
import ConfirmModal from '@/components/ConfirmModal';
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
  price?: { low?: number; mid?: number; high?: number };
}

const CARDS_PER_PAGE = 12;
type GridMode = 'normal' | 'large';
type SortBy = 'name' | 'price';
type SortDir = 'asc' | 'desc';

type Opt = { value: string; label: string };

function SelectPro({
  value,
  options,
  placeholder,
  onChange,
  twoCol = false,
  searchable = true,
}: {
  value: string;
  options: Opt[];
  placeholder?: string;
  onChange: (v: string) => void;
  twoCol?: boolean;
  searchable?: boolean;
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');

  const selectedLabel = useMemo(() => {
    const found = options.find((o) => o.value === value);
    return found?.label ?? '';
  }, [options, value]);

  const filtered = useMemo(() => {
    if (!searchable) return options;
    const term = q.trim().toLowerCase();
    if (!term) return options;
    return options.filter((o) => o.label.toLowerCase().includes(term));
  }, [options, q, searchable]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  useEffect(() => {
    if (!open) setQ('');
  }, [open]);

  return (
    <div className="selectWrap" ref={wrapRef}>
      <button
        type="button"
        className="selectTrigger"
        onClick={() => setOpen((v) => !v)}
      >
        <span className={`selectValue ${value ? '' : 'isPlaceholder'}`}>
          {value ? selectedLabel : placeholder || 'Selecciona…'}
        </span>
        <span className="selectChevron">
          <ChevronDown size={18} />
        </span>
      </button>

      {open && (
        <div className="selectPopover selectPopover--natural">
          {searchable && (
            <div className="selectSearchRow">
              <input
                className="selectSearch"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar…"
                autoFocus
              />
            </div>
          )}

          <div className={'selectList' + (twoCol ? ' selectList--twoCol' : '')}>
            {filtered.length === 0 ? (
              <div className="selectEmpty">Sin resultados</div>
            ) : (
              filtered.map((o) => (
                <button
                  type="button"
                  key={o.value}
                  className={
                    'selectItem' + (o.value === value ? ' isActive' : '')
                  }
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                >
                  <span>{o.label}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const DiscoverTradeCards: React.FC = () => {
  const { t } = useTranslation();
  const user = authService.getUser();
  const currentUsername = user?.username;

  const [tradeCards, setTradeCards] = useState<TradeCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const [sortBy, setSortBy] = useState<SortBy>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const [rarityFilter, setRarityFilter] = useState<string>('all');
  const [setFilter, setSetFilter] = useState<string>('all');
  const [groupBySet, setGroupBySet] = useState<boolean>(false);

  const [gridMode, setGridMode] = useState<GridMode>('normal');
  const [page, setPage] = useState(1);

  const [selectedCardForTrade, setSelectedCardForTrade] =
    useState<TradeCard | null>(null);
  const [selectedOwner, setSelectedOwner] = useState('');
  const [tradeNote, setTradeNote] = useState('');

  const [modeModalVisible, setModeModalVisible] = useState(false);
  const [messageModalVisible, setMessageModalVisible] = useState(false);
  const [offerModalVisible, setOfferModalVisible] = useState(false);

  const [myCards, setMyCards] = useState<UserCard[]>([]);
  const [selectedMyCard, setSelectedMyCard] = useState<UserCard | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    message: string;
    variant?: 'success' | 'error' | 'info';
  } | null>(null);
  const normalizeImageUrl = (url?: string) => {
    if (!url) return '';
    let s = String(url);
    
    // Correct malformed TCGdex URLs (missing series component)
    const tcgdexMatch = s.match(/^(https?:\/\/assets\.tcgdex\.net\/)(?:jp|en)\/([a-z0-9.]+)\/(.+)$/i);
    if (tcgdexMatch) {
      const [, baseUrl, setCode, rest] = tcgdexMatch;
      const seriesMatch = setCode.match(/^([a-z]+)/i);
      if (seriesMatch) {
        const series = seriesMatch[1].toLowerCase();
        s = `${baseUrl}en/${series}/${setCode.toLowerCase()}/${rest}`;
      }
    }
    
    // Normalize quality to high
    if (/\/(small|large|high|low)\.png$/i.test(s))
      return s.replace(/\/(small|large|high|low)\.png$/i, '/high.png');
    if (/\.(png|jpg|jpeg|gif|webp)$/i.test(s)) return s;
    return s.endsWith('/') ? s + 'high.png' : s + '/high.png';
  };
  const translateTradeError = (code?: string) => {
    switch (code) {
      case 'TRADE_ALREADY_EXISTS':
        return t(
          'discover.alreadyExists',
          'Ya existe un intercambio activo con este usuario.'
        );

      case 'TRADE_VALUE_DIFF_TOO_HIGH':
        return t(
          'discover.tradeValueDifferenceTooHigh',
          'La diferencia de valor entre las cartas es demasiado alta.'
        );

      default:
        return t('common.errorSendingRequest', 'Error enviando solicitud.');
    }
  };
  const normalizeApiCard = (raw: any): ApiCardNormalized => {
    const id = raw.pokemonTcgId || raw.id || '';
    let img =
      raw.images?.large || raw.images?.small || raw.imageUrl || raw.image || '';

    if (!img && id.includes('-')) {
      const [setCode, number] = id.split('-');
      const series = (setCode.match(/^[a-zA-Z]+/) || ['xx'])[0];
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
      name: raw.name || '',
      image: normalizeImageUrl(img),
      hp: raw.hp || '',
      set: raw.set?.name || raw.set?.series || raw.set || raw.series || '',
      rarity: raw.rarity || '',
      illustrator: raw.illustrator ?? raw.artist ?? '',
      price: priceObj,
      series: raw.set?.series || raw.series || '',
    };
  };

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const base = 'http://localhost:3000';
        const params = new URLSearchParams();
        params.set('limit', '200');
        if (currentUsername) params.set('excludeUsername', currentUsername);

        const resp = await fetch(`${base}/usercards/discover?${params}`, {
          headers: {
            'Content-Type': 'application/json',
            ...authService.getAuthHeaders(),
          },
        });

        if (!resp.ok) throw new Error('Error cargando intercambio');

        const data = await resp.json();
        const rawItems = data.cards || [];

        // Agrupar cartas por pokemonTcgId
        const grouped = new Map<string, TradeCard>();

        for (const item of rawItems) {
          const id = item.pokemonTcgId;
          const cardData = item.cardId;
          
          if (!id || !cardData) continue;

          // Obtener la imagen con fallback
          let image = '';
          if (cardData.images) {
            image = cardData.images.large || cardData.images.small || '';
          }
          if (!image && cardData.imageUrl) {
            image = cardData.imageUrl;
          }
          if (!image && cardData.imageUrlHiRes) {
            image = cardData.imageUrlHiRes;
          }
          
          // Generar URL de TCGdex como fallback
          if (!image && id) {
            const [setCode, number] = id.split('-');
            if (setCode && number) {
              const series = setCode.slice(0, 2);
              image = `https://assets.tcgdex.net/en/${series}/${setCode}/${number}/high.png`;
            }
          }

          // Normalizar la carta desde los datos poblados
          const normalizedCard: ApiCardNormalized = {
            id: id,
            name: cardData.name || '',
            image: image,
            hp: cardData.hp || '',
            set: cardData.set?.name || cardData.set || '',
            rarity: cardData.rarity || '',
            price: cardData.price ? {
              low: cardData.price.low,
              mid: cardData.price.mid,
              high: cardData.price.high,
            } : undefined,
            illustrator: cardData.illustrator || cardData.artist || '',
            series: cardData.set?.series || cardData.series || '',
          };

          const owner = {
            username: item.userId?.username || '',
            quantity: item.quantity ?? 1,
            condition: item.condition,
          };

          if (!grouped.has(id)) {
            grouped.set(id, { ...normalizedCard, owners: [owner] });
          } else {
            grouped.get(id)!.owners.push(owner);
          }
        }

        if (!mounted) return;
        setTradeCards([...grouped.values()]);
      } catch (err: any) {
        if (mounted) setError(err.message || 'Error');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [currentUsername]);

  const availableSets = useMemo(() => {
    const s = new Set<string>();
    tradeCards.forEach((c) => {
      const v = (c.set || '').trim();
      if (v) s.add(v);
    });
    return [...s].sort((a, b) => a.localeCompare(b));
  }, [tradeCards]);

  const availableRarities = useMemo(() => {
    const s = new Set<string>();
    tradeCards.forEach((c) => {
      const v = (c.rarity || '').trim();
      if (v) s.add(v);
    });
    return [...s].sort((a, b) => a.localeCompare(b));
  }, [tradeCards]);

  const filteredAndSorted = useMemo(() => {
    let list = [...tradeCards];
    const q = search.trim().toLowerCase();

    if (q) {
      list = list.filter((c) => {
        const ownerMatch = c.owners.some((o) =>
          o.username.toLowerCase().includes(q)
        );
        const priceMid = c.price?.mid;
        const priceMatch =
          typeof priceMid === 'number'
            ? priceMid.toFixed(2).includes(q)
            : false;
        return (
          c.name.toLowerCase().includes(q) ||
          (c.set || '').toLowerCase().includes(q) ||
          (c.rarity || '').toLowerCase().includes(q) ||
          ownerMatch ||
          priceMatch
        );
      });
    }

    if (rarityFilter !== 'all')
      list = list.filter((c) => (c.rarity || '') === rarityFilter);
    if (setFilter !== 'all')
      list = list.filter((c) => (c.set || '') === setFilter);

    const priceMid = (c: TradeCard) =>
      typeof c.price?.mid === 'number' ? c.price!.mid! : null;
    const dirMul = sortDir === 'asc' ? 1 : -1;

    list.sort((a, b) => {
      if (sortBy === 'price') {
        const pa = priceMid(a),
          pb = priceMid(b);
        if (pa === null && pb === null) return a.name.localeCompare(b.name);
        if (pa === null) return 1;
        if (pb === null) return -1;
        return (pa - pb) * dirMul;
      }
      return a.name.localeCompare(b.name) * dirMul;
    });

    return list;
  }, [tradeCards, search, rarityFilter, setFilter, sortBy, sortDir]);

  const groupedData = useMemo(() => {
    const bySet = new Map<string, TradeCard[]>();
    for (const c of filteredAndSorted) {
      const setName = (c.set || 'Otros').trim() || 'Otros';
      if (!bySet.has(setName)) bySet.set(setName, []);
      bySet.get(setName)!.push(c);
    }
    const orderedSetNames = [...bySet.keys()].sort((a, b) =>
      a.localeCompare(b)
    );
    return { bySet, orderedSetNames };
  }, [filteredAndSorted]);

  const paginatedFlat = useMemo(() => {
    const total = filteredAndSorted.length;
    const totalPages = Math.max(1, Math.ceil(total / CARDS_PER_PAGE));
    const safe = Math.min(page, totalPages);
    const start = (safe - 1) * CARDS_PER_PAGE;
    const items = filteredAndSorted.slice(start, start + CARDS_PER_PAGE);
    return { items, totalPages, safe };
  }, [filteredAndSorted, page]);

  const paginatedSets = useMemo(() => {
    const pages: Array<Array<{ setName: string; cards: TradeCard[] }>> = [];
    let current: Array<{ setName: string; cards: TradeCard[] }> = [];
    let count = 0;

    for (const setName of groupedData.orderedSetNames) {
      const cards = groupedData.bySet.get(setName)!;
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
    const totalPages = Math.max(1, pages.length);
    const safe = Math.min(page, totalPages);
    const pageData = pages[safe - 1] || [];
    return { pageData, totalPages, safe };
  }, [groupedData, page]);

  useEffect(() => {
    setPage(1);
  }, [
    search,
    rarityFilter,
    setFilter,
    sortBy,
    sortDir,
    groupBySet,
    tradeCards,
  ]);

  const TradeFlipCard = ({
    card,
    onProposeTrade,
  }: {
    card: TradeCard;
    onProposeTrade: (c: TradeCard) => void;
  }) => {
    const [flip, setFlip] = useState(false);
    const highlightGold =
      typeof card.price?.mid === 'number' && card.price.mid > 500;

    return (
      <div
        className={`flip-card ${flip ? 'flipped' : ''}`}
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
                <div className="attr-label">{t('discover.set')}</div>
                <div className="attr-value">{card.set}</div>
              </div>

              <div className="attr-box">
                <div className="attr-label">{t('discover.hp')}</div>
                <div className="attr-value">{card.hp}</div>
              </div>

              <div className="attr-box">
                <div className="attr-label">{t('discover.quantity')}</div>
                <div className="attr-value">
                  {card.owners.reduce((s, o) => s + o.quantity, 0)}
                </div>
              </div>
            </div>

            <div className="card-back-section">
              <div className="card-back-section-title">
                {t('discover.illustrator')}
              </div>
              <div className="attr-value">{card.illustrator || '—'}</div>
            </div>

            <div className={`price-box ${highlightGold ? 'gold-border' : ''}`}>
              <div className="price-label">{t('discover.estimatedPrice')}</div>
              <div className="price-value">
                {card.price?.mid ? card.price.mid.toFixed(2) + '€' : '—'}
              </div>
            </div>

            <button
              className="trade-btn"
              onClick={(e) => {
                e.stopPropagation();
                onProposeTrade(card);
              }}
            >
              {t('discover.proposeTrade')}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const handleOpenTradeMode = (card: TradeCard) => {
    setSelectedCardForTrade(card);
    setSelectedOwner(card.owners[0].username);
    setTradeNote('');
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
        '';

      const pokemonTcgId = item.pokemonTcgId || card.pokemonTcgId || '';
      if (!image && pokemonTcgId.includes('-')) {
        const [setCode, number] = pokemonTcgId.split('-');
        const series = (setCode.match(/^[a-zA-Z]+/) || ['xx'])[0];
        image = `https://assets.tcgdex.net/en/${series}/${setCode}/${number}/high.png`;
      }

      return {
        id: item._id || card._id || pokemonTcgId,
        name: card.name || item.name || '',
        image,
        rarity: card.rarity || '',
        pokemonTcgId,
        price: item.price || card.price || card.prices,
      };
    });

    setMyCards(normalized);
  };

  const handleSendTradeRequest = async () => {
    if (!selectedCardForTrade) return;

    const base = 'http://localhost:3000';

    try {
      const resp = await fetch(`${base}/trade-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authService.getAuthHeaders(),
        },
        body: JSON.stringify({
          receiverIdentifier: selectedOwner,
          pokemonTcgId: selectedCardForTrade.id,
          cardName: selectedCardForTrade.name,
          cardImage: selectedCardForTrade.image,
          note: selectedOwner ? tradeNote : tradeNote,
          requestedPokemonTcgId: selectedCardForTrade.id,
        }),
      });

      const data = await resp.json();

      if (!resp.ok) {
        setConfirmModal({
          title: t('common.error', 'Error'),
          message:
            translateTradeError(data.error) ||
            t('common.errorSendingRequest', 'Error enviando solicitud.'),
          variant: 'error',
        });

        return;
      }

      setConfirmModal({
        title: t('common.done', 'Hecho'),
        message: t('common.requestSent', 'Solicitud enviada'),
        variant: 'success',
      });
      setSelectedCardForTrade(null);
      setMessageModalVisible(false);
    } catch (err) {
      console.error(err);
      setConfirmModal({
        title: t('common.error', 'Error'),
        message: t('common.errorSendingRequest', 'Error enviando solicitud.'),
        variant: 'error',
      });
    }
  };

  const sendTradeWithCard = async () => {
    if (!selectedCardForTrade || !selectedMyCard) return;

    const base = 'http://localhost:3000';

    try {
      const resp = await fetch(`${base}/trade-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authService.getAuthHeaders(),
        },
        body: JSON.stringify({
          receiverIdentifier: selectedOwner,
          pokemonTcgId: selectedCardForTrade.id,
          cardName: selectedCardForTrade.name,
          cardImage: selectedCardForTrade.image,
          targetPrice: selectedCardForTrade.price?.mid ?? null,
          offeredPrice: selectedMyCard.price?.mid ?? null,
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
        setConfirmModal({
          title: t('common.error', 'Error'),
          message:
            translateTradeError(data.error) ||
            t('common.errorSendingRequest', 'Error enviando solicitud.'),
          variant: 'error',
        });
        return;
      }

      setConfirmModal({
        title: t('common.done', 'Hecho'),
        message: t(
          'common.requestSentWithCard',
          'Solicitud enviada con carta.'
        ),
        variant: 'success',
      });
      setOfferModalVisible(false);
      setSelectedCardForTrade(null);
    } catch (err) {
      console.error(err);
      setConfirmModal({
        title: t('common.error', 'Error'),
        message: t('common.errorSendingRequest', 'Error enviando solicitud.'),
        variant: 'error',
      });
    }
  };

  const totalResults = filteredAndSorted.length;

  const sortByOptions: Opt[] = [
    { value: 'name', label: t('discover.sortByName') || 'Nombre' },
    { value: 'price', label: t('discover.sortByPrice') || 'Precio' },
  ];

  const sortDirOptions: Opt[] = [
    { value: 'asc', label: t('discover.sortAsc') || 'Ascendente' },
    { value: 'desc', label: t('discover.sortDesc') || 'Descendente' },
  ];

  const rarityOptions: Opt[] = [
    { value: 'all', label: t('common.all', 'Todas') },
    ...availableRarities.map((r) => ({ value: r, label: r })),
  ];

  const setOptions: Opt[] = [
    { value: 'all', label: t('common.all', 'Todos') },
    ...availableSets.map((s) => ({ value: s, label: s })),
  ];

  return (
    <div className="discover-page min-h-screen flex flex-col">
      <Header />

      <main className="discover-main">
        <div className="discover-header">
          <h1 className="discover-title">{t('discover.title')}</h1>
          <p className="discover-subtitle">{t('discover.subtitle')}</p>
        </div>

        <div className="collectionToolbar discoverToolbar">
          <div className="toolbarRightGroup">
            <div className="discoverSearchWrap">
              <Search className="discoverSearchIcon" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('discover.searchPlaceholder')}
                className="searchInput searchInput--right discoverSearchInput"
              />
            </div>

            <div className="panelWrap">
              <button
                className="iconBtn"
                onClick={() => setShowFilters((v) => !v)}
                type="button"
                aria-label={t('discover.filters')}
                title={t('discover.filters')}
              >
                <SlidersHorizontal size={18} />
              </button>

              {showFilters && (
                <div className="panel panel--pro discoverPanel">
                  <div className="panelHeader panelHeader--simple">
                    <button
                      className="panelCloseBtn"
                      onClick={() => setShowFilters(false)}
                      type="button"
                      aria-label={t('common.close')}
                      title={t('common.close')}
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="panelBody">
                    <div className="panelField discoverField">
                      <span>{t('discover.sortBy')}</span>
                      <SelectPro
                        value={sortBy}
                        options={sortByOptions}
                        onChange={(v) => setSortBy(v as SortBy)}
                        searchable={false}
                      />
                    </div>

                    <div className="panelField discoverField">
                      <span>{t('discover.direction')}</span>
                      <SelectPro
                        value={sortDir}
                        options={sortDirOptions}
                        onChange={(v) => setSortDir(v as SortDir)}
                        searchable={false}
                      />
                    </div>

                    <div className="panelField discoverField">
                      <span>{t('common.rarity')}</span>
                      <SelectPro
                        value={rarityFilter}
                        options={rarityOptions}
                        onChange={(v) => setRarityFilter(v)}
                        twoCol={rarityOptions.length > 10}
                      />
                    </div>

                    <div className="panelField discoverField">
                      <span>{t('discover.set')}</span>
                      <SelectPro
                        value={setFilter}
                        options={setOptions}
                        onChange={(v) => setSetFilter(v)}
                        twoCol={setOptions.length > 14}
                      />
                    </div>

                    <label className="discoverGroupRow">
                      <input
                        type="checkbox"
                        checked={groupBySet}
                        onChange={(e) => setGroupBySet(e.target.checked)}
                      />
                      <span className="discoverGroupUi" />
                      <span className="discoverGroupText">
                        {t('discover.groupBySet')}
                      </span>
                    </label>
                  </div>

                  <div className="panelFooter panelFooter--sticky">
                    <button
                      className="btnGold"
                      type="button"
                      onClick={() => {
                        setSortBy('name');
                        setSortDir('asc');
                        setRarityFilter('all');
                        setSetFilter('all');
                        setGroupBySet(false);
                        setSearch('');
                      }}
                    >
                      {t('common.clear')}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div
              className="viewToggles"
              role="group"
              aria-label={t('discover.gridDensity')}
            >
              <button
                className={gridMode === 'normal' ? 'isActive' : ''}
                aria-pressed={gridMode === 'normal'}
                onClick={() => setGridMode('normal')}
                type="button"
                title={t('discover.gridNormal')}
              >
                <LayoutGrid size={18} />
              </button>

              <button
                className={gridMode === 'large' ? 'isActive' : ''}
                aria-pressed={gridMode === 'large'}
                onClick={() => setGridMode('large')}
                type="button"
                title={t('discover.gridLarge')}
              >
                <Grid2X2 size={18} />
              </button>
            </div>
          </div>
        </div>

        <div className="discoverResultsLine">
          {t('discover.results')}{' '}
          <span className="discoverResultsBadge">{totalResults}</span>
        </div>

        <div className={`discover-content grid-${gridMode}`}>
          {loading && (
            <div className="discover-empty">{t('discover.loading')}</div>
          )}
          {error && !loading && <div className="discover-empty">{error}</div>}
          {!loading && !error && totalResults === 0 && (
            <div className="discover-empty">{t('discover.noResults')}</div>
          )}

          {!loading && !error && totalResults > 0 && !groupBySet && (
            <>
              <div className="discover-grid">
                {paginatedFlat.items.map((card) => (
                  <TradeFlipCard
                    key={card.id}
                    card={card}
                    onProposeTrade={handleOpenTradeMode}
                  />
                ))}
              </div>

              <div className="pagerZone">
                <div className="pager">
                  <button
                    className="pagerBtn"
                    disabled={paginatedFlat.safe <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    {t('common.prev')}
                  </button>

                  <div className="pagerInfo">
                    {paginatedFlat.safe} / {paginatedFlat.totalPages}
                  </div>

                  <button
                    className="pagerBtn"
                    disabled={paginatedFlat.safe >= paginatedFlat.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    {t('common.next')}
                  </button>
                </div>
              </div>
            </>
          )}

          {!loading && !error && totalResults > 0 && groupBySet && (
            <>
              {paginatedSets.pageData.map((block, i) => (
                <section
                  key={`${block.setName}-${i}`}
                  className="discover-set-section"
                >
                  <div className="discover-set-header">
                    <h3 className="discover-set-title">{block.setName}</h3>
                    <span className="discover-set-count">
                      {block.cards.length}
                    </span>
                  </div>

                  <div className="discover-grid">
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

              <div className="pagerZone">
                <div className="pager">
                  <button
                    className="pagerBtn"
                    disabled={paginatedSets.safe <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    {t('common.prev')}
                  </button>

                  <div className="pagerInfo">
                    {paginatedSets.safe} / {paginatedSets.totalPages}
                  </div>

                  <button
                    className="pagerBtn"
                    disabled={paginatedSets.safe >= paginatedSets.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    {t('common.next')}
                  </button>
                </div>
              </div>
            </>
          )}
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
      {confirmModal && (
        <ConfirmModal
          open={true}
          title={confirmModal.title}
          message={confirmModal.message}
          variant={confirmModal.variant}
          onClose={() => setConfirmModal(null)}
        />
      )}
    </div>
  );
};

export default DiscoverTradeCards;
