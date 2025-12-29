import React, { useEffect, useMemo, useState } from 'react';
import Header from '../components/Header/Header';
import Footer from '../components/Footer';
import '../styles/collection.css';
import api from '../services/apiService';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchWishlist,
  addToWishlist,
  removeFromWishlist,
} from '../features/whislist/whislistSlice';
import { authService } from '../services/authService';
import { RootState, AppDispatch } from '../store/store';
import { useSearchParams } from 'react-router-dom';

const PAGE_SIZE = 12;

const RARITY_ORDER = [
  'Common',
  'Uncommon',
  'Rare',
  'Holo Rare',
  'Rare Holo',
  'Ultra Rare',
  'Secret Rare',
];

const SearchPage: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const wishlistState = useSelector((s: RootState) => s.wishlist.cards);
  const [wishlistSet, setWishlistSet] = useState<Set<string>>(new Set());
  const [params] = useSearchParams();
  const qParam = params.get('q') || '';

  const [query, setQuery] = useState(qParam);
  const [results, setResults] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedSet, setSelectedSet] = useState('');
  const [selectedRarity, setSelectedRarity] = useState('');
  const [allSets, setAllSets] = useState<Array<{ id: string; name: string }>>(
    []
  );
  const [hoverDetails, setHoverDetails] = useState<Record<string, any>>({});
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    setQuery(qParam);
    setPage(1);
  }, [qParam]);

  // load wishlist for heart state
  useEffect(() => {
    const user = authService.getUser();
    if (!user || !authService.isAuthenticated()) return;
    dispatch(fetchWishlist(user.username || user.id));
  }, [dispatch]);

  useEffect(() => {
    const s = new Set<string>();
    (wishlistState || []).forEach((it: any) => {
      if (it.pokemonTcgId) s.add(it.pokemonTcgId);
      if (it.id) s.add(it.id);
    });
    setWishlistSet(s);
  }, [wishlistState]);

  function normalizeImageUrl(url?: string) {
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
    if (/\/(?:small|large|high|low)\.png$/i.test(s))
      return s.replace(/\/(?:small|large|high|low)\.png$/i, '/high.png');
    if (/\.(png|jpg|jpeg|gif|webp)$/i.test(s)) return s;
    return s.endsWith('/') ? `${s}high.png` : `${s}/high.png`;
  }

  useEffect(() => {
    const load = async () => {
      if (!query) {
        setResults([]);
        setTotal(0);
        return;
      }
      setLoading(true);
      try {
        const resp = await api.searchTcgCards(
          query,
          page,
          PAGE_SIZE,
          selectedSet,
          selectedRarity
        );
        setResults(resp.data || []);
        setTotal(resp.total || 0);
      } catch (e) {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [query, page, selectedSet, selectedRarity]);

  // fetch list of sets once to populate the Set dropdown with friendly names
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const payload: any = await api.getTcgDexSets();
        if (!mounted || !payload) return;
        // payload may be { data: [...] } or an array
        let arr: any[] = [];
        if (Array.isArray(payload)) arr = payload;
        else if (Array.isArray(payload.data)) arr = payload.data;
        else if (Array.isArray(payload.sets)) arr = payload.sets;

        const normalized = arr
          .map((s: any) => {
            const id = s.id || s.code || s.setId || s.setCode || s.name || '';
            const name = s.name || s.title || s.setName || id;
            return { id: String(id), name: String(name) };
          })
          .filter((s: any) => s.id);

        // dedupe by id
        const map = new Map<string, string>();
        normalized.forEach((s: any) => map.set(s.id, s.name));
        setAllSets(
          Array.from(map.entries()).map(([id, name]) => ({ id, name }))
        );
      } catch (e) {
        // ignore
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const totalPages = Math.max(
    1,
    Math.ceil((total || results.length) / PAGE_SIZE)
  );

  // const setsOptions = useMemo(() => [], []);
  const setsOptions = useMemo(() => {
    // produce array of { id, name }
    const map = new Map<string, string>();
    // include global sets first (from TCGdex)
    (allSets || []).forEach((s) => {
      if (s && s.id) map.set(s.id, s.name || s.id);
    });
    // then overwrite/augment from current results
    results.forEach((r) => {
      const id = r.setId || r.set || '';
      const name = r.set || '';
      if (id) map.set(id, name || id);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [results]);

  const raritiesOptions = useMemo(() => {
    const s = new Set<string>();
    results.forEach((r) => {
      if (r.rarity) s.add(r.rarity);
    });
    const arr = Array.from(s).filter(Boolean);
    // fallback to canonical list when none discovered in results
    const fallback = RARITY_ORDER.slice();
    const finalArr = arr.length ? arr : fallback;
    // try to order by canonical RARITY_ORDER
    const orderMap = new Map(RARITY_ORDER.map((v, i) => [v.toLowerCase(), i]));
    finalArr.sort((a, b) => {
      const ai = orderMap.has(a.toLowerCase())
        ? orderMap.get(a.toLowerCase())!
        : 1e6;
      const bi = orderMap.has(b.toLowerCase())
        ? orderMap.get(b.toLowerCase())!
        : 1e6;
      if (ai !== bi) return ai - bi;
      return a.localeCompare(b);
    });
    return finalArr;
  }, [results]);

  return (
    <div className="collection-page">
      <Header />
      <div className="collection-inner">
        <div className="collection-controls">
          <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
            <h2 style={{ margin: 0 }}>{t('common.searchCards')}</h2>
            <p
              style={{
                margin: 0,
                marginLeft: '.75rem',
                color: 'var(--text-secondary)',
              }}
            >
              {total} {t('common.results')}
            </p>
          </div>

          <div className="collection-filters">
            <input
              placeholder={t('common.searchPlaceholder')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="header-search"
            />
            <select
              value={selectedSet}
              onChange={(e) => {
                setSelectedSet(e.target.value);
                setPage(1);
              }}
            >
              <option value="">{t('common.set')}</option>
              {setsOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name || s.id}
                </option>
              ))}
            </select>
            <select
              value={selectedRarity}
              onChange={(e) => {
                setSelectedRarity(e.target.value);
                setPage(1);
              }}
            >
              <option value="">{t('common.rarity')}</option>
              {raritiesOptions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="collection-empty">{t('common.loading')}</div>
        ) : results.length === 0 ? (
          <div className="collection-empty">{t('common.noResults')}</div>
        ) : (
          <div className="collection-grid">
            {results.map((c: any) => {
              const isFlipped = hoveredId === c.id;
              const rawImage =
                (c.images && (c.images.large || c.images.small)) || '';
              const image =
                normalizeImageUrl(rawImage) ||
                (c.imageUrl ? normalizeImageUrl(c.imageUrl) : '');
              return (
                <div key={c.id} className="collection-card">
                  <div
                    className={`card-flip ${isFlipped ? 'is-flipped' : ''}`}
                    onMouseEnter={async () => {
                      setHoveredId(c.id);
                      if (hoverDetails[c.id]) return;
                      const tcg = c.pokemonTcgId || c.id;
                      if (!tcg) return;
                      // try cached first
                      let d = await api
                        .getCachedCardByTcgId(tcg)
                        .catch(() => null);
                      if (!d) {
                        // fallback: fetch directly from TCGdex (do not persist)
                        try {
                          const [setCode, number] = String(tcg).split('-');
                          if (setCode && number) {
                            const raw = await api
                              .getTcgDexCard(setCode, number)
                              .catch(() => null);
                            const payload = raw?.data ?? raw ?? null;
                            d = payload;
                          }
                        } catch (e) {
                          d = null;
                        }
                      }

                      // normalize the detail to guarantee set and rarity presence
                      const normalizeDetail = (x: any) => {
                        if (!x) return null;
                        const out: any = {};
                        out.set =
                          x.set?.name ||
                          x.set ||
                          x.series ||
                          x.setName ||
                          x.setCode ||
                          '';
                        out.rarity =
                          x.rarity ||
                          x.rarityText ||
                          x.rarity_name ||
                          x.set?.rarity ||
                          '';
                        out.illustrator =
                          x.illustrator || x.artist || x?.authors || '';
                        out.images =
                          x.images ||
                          (x.imageUrl
                            ? { small: x.imageUrl, large: x.imageUrl }
                            : x.image
                              ? { small: x.image, large: x.image }
                              : {});
                        out.price =
                          x.price && x.price.avg
                            ? x.price
                            : x.prices
                              ? x.prices
                              : x?.cardmarket
                                ? x.cardmarket
                                : null;
                        // try other common shapes
                        out.price = out.price || {
                          avg:
                            x.avg ??
                            x.cardmarketAvg ??
                            x.tcgplayerMarketPrice ??
                            null,
                        };
                        return out;
                      };

                      const nd = normalizeDetail(d);
                      setHoverDetails((prev) => ({ ...prev, [c.id]: nd }));
                    }}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    <div className="card-front">
                      <img src={image} alt={c.name} />
                    </div>
                    <div className="card-back">
                      <div className="card-back-inner collection-back-inner">
                        <h3 className="back-name collection-back-name">
                          {c.name}
                        </h3>
                        <div className="back-row collection-back-row">
                          <div className="back-label">{t('common.rarity')}</div>
                          <div className="back-value">
                            {hoverDetails[c.id]?.rarity || c.rarity || '—'}
                          </div>
                        </div>
                        <div className="back-row collection-back-row">
                          <div className="back-label">{t('common.set')}</div>
                          <div className="back-value">
                            {hoverDetails[c.id]?.set || c.set || '—'}
                          </div>
                        </div>
                        <div className="back-row collection-back-row">
                          <div className="back-label">
                            {t('common.illustrator')}
                          </div>
                          <div className="back-value">
                            {(hoverDetails[c.id] &&
                              hoverDetails[c.id].illustrator) ||
                              '—'}
                          </div>
                        </div>
                        <div className="back-price collection-back-price">
                          {hoverDetails[c.id] ? (
                            (() => {
                              const d = hoverDetails[c.id];
                              const avg =
                                d?.price?.avg ??
                                d?.price?.average ??
                                d?.avg ??
                                d?.cardmarketAvg ??
                                null;
                              return (
                                <div className="price-grid collection-price-grid">
                                  <div style={{ fontWeight: 700 }}>
                                    {t('common.average')}:
                                  </div>
                                  <div>
                                    {avg == null
                                      ? '—'
                                      : `${Number(avg).toFixed(2)}€`}
                                  </div>
                                </div>
                              );
                            })()
                          ) : (
                            <div className="loading">{t('common.loading')}</div>
                          )}
                        </div>
                        <div style={{ position: 'absolute', top: 8, right: 8 }}>
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              const user = authService.getUser();
                              if (!user || !authService.isAuthenticated()) {
                                window.alert(t('common.mustLogin'));
                                return;
                              }
                              const tcgId = c.pokemonTcgId || c.id;
                              const isFav =
                                wishlistSet.has(tcgId) || wishlistSet.has(c.id);
                              if (!isFav) {
                                dispatch(
                                  addToWishlist({
                                    userId: user.username || user.id,
                                    cardId: tcgId,
                                  } as any)
                                );
                                setWishlistSet((prev) =>
                                  new Set(prev).add(tcgId)
                                );
                              } else {
                                dispatch(
                                  removeFromWishlist({
                                    userId: user.username || user.id,
                                    cardId: tcgId,
                                  } as any)
                                );
                                setWishlistSet((prev) => {
                                  const copy = new Set(prev);
                                  copy.delete(tcgId);
                                  return copy;
                                });
                              }
                            }}
                            className="absolute top-2 right-2 bg-white rounded-full p-2 shadow-lg hover:scale-110 transition-transform z-30"
                          >
                            <span style={{ fontSize: 20 }}>
                              {wishlistSet.has(c.pokemonTcgId || c.id)
                                ? '❤️'
                                : '🤍'}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="card-name">{c.name}</div>
                </div>
              );
            })}
          </div>
        )}

        <div className="collection-pagination">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="CollectionButton"
          >
            {t('common.prev')}
          </button>
          <div style={{ alignSelf: 'center' }}>
            {page} / {totalPages}
          </div>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="CollectionButton"
          >
            {t('common.next')}
          </button>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default SearchPage;
