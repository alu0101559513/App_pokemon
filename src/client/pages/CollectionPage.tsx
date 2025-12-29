import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import Header from '../components/Header/Header';
import Footer from '../components/Footer';
import '../styles/collection.css';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUserCollection } from '../features/collection/collectionSlice';
import { RootState, AppDispatch } from '../store/store';
import { authService } from '../services/authService';
import api from '../services/apiService';
import { useTranslation } from 'react-i18next';
import {
  SlidersHorizontal,
  ArrowUpDown,
  Grid2X2,
  Grid3X3,
  ArrowUp,
  ArrowDown,
  Tag,
  X,
  ChevronDown,
  Check,
} from 'lucide-react';

const RARITY_ORDER = [
  'Common',
  'Uncommon',
  'Rare',
  'Holo Rare',
  'Rare Holo',
  'Double rare',
  'ACE SPEC Rare',
  'Amazing Rare',
  'Illustration rare',
  'Special illustration rare',
  'Ultra Rare',
  'Holo Rare V',
  'Holo Rare VMAX',
  'Holo Rare VSTAR',
  'Shiny rare',
  'Shiny Ultra Rare',
  'Shiny rare V',
  'Shiny rare VMAX',
  'Radiant Rare',
  'Hyper rare',
  'Mega Hyper Rare',
  'Secret Rare',
  'Rare PRIME',
  'Rare Holo LV.X',
  'LEGEND',
  'Full Art Trainer',
  'Classic Collection',
  'Black White Rare',
  'Crown',
  'One Diamond',
  'Two Diamond',
  'Three Diamond',
  'Four Diamond',
  'One Star',
  'Two Star',
  'Three Star',
  'One Shiny',
  'Two Shiny',
  'None',
];

type ViewMode = 'comfortable' | 'dense';
type SelectOption = { value: string; label: string };

function useOutsideClick<T extends HTMLElement>(
  ref: React.RefObject<T | null>,
  onOutside: () => void,
  enabled: boolean
) {
  useEffect(() => {
    if (!enabled) return;
    const handle = (e: MouseEvent) => {
      const el = ref.current;
      if (!el) return;
      if (!el.contains(e.target as Node)) onOutside();
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [enabled, onOutside, ref]);
}

const SelectPopover: React.FC<{
  value: string;
  onChange: (v: string) => void;
  options: SelectOption[];
  placeholder: string;
  searchable?: boolean;
  maxHeight?: number;
}> = ({
  value,
  onChange,
  options,
  placeholder,
  searchable = true,
  maxHeight = 420,
}) => {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');

  const close = useCallback(() => setOpen(false), []);
  useOutsideClick(wrapRef, close, open);

  const selected = options.find((o) => o.value === value);
  const label = selected?.label || placeholder;

  const showSearch = searchable && options.length >= 8;
  const useTwoColumns = options.length >= 24;

  const filtered = useMemo(() => {
    if (!searchable || !q.trim()) return options;
    const qq = q.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(qq));
  }, [options, q, searchable]);

  return (
    <div className="selectWrap" ref={wrapRef}>
      <button
        type="button"
        className={`selectTrigger ${open ? 'isOpen' : ''}`}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={`selectValue ${value ? '' : 'isPlaceholder'}`}>
          {label}
        </span>
        <span className="selectChevron" aria-hidden="true">
          <ChevronDown size={20} />
        </span>
      </button>

      {open && (
        <div
          className="selectPopover selectPopover--natural"
          role="listbox"
          style={{ ['--popMaxH' as any]: `${maxHeight}px` }}
        >
          {showSearch && (
            <div className="selectSearchRow">
              <input
                className="selectSearch"
                placeholder="Buscar…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                autoFocus
              />
            </div>
          )}

          <div
            className={`selectList ${useTwoColumns ? 'selectList--twoCol' : ''}`}
          >
            {filtered.length === 0 ? (
              <div className="selectEmpty">Sin resultados</div>
            ) : (
              filtered.map((o) => {
                const active = o.value === value;
                return (
                  <button
                    type="button"
                    key={o.value || '__empty__'}
                    className={`selectItem ${active ? 'isActive' : ''}`}
                    onClick={() => {
                      onChange(o.value);
                      setOpen(false);
                      setQ('');
                    }}
                  >
                    <span className="selectItemLabel">{o.label}</span>
                    {active && (
                      <span className="selectItemCheck" aria-hidden="true">
                        <Check size={18} />
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const CollectionPage: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();

  const collection = useSelector((s: RootState) => s.collection.cards) as any[];
  const loading = useSelector((s: RootState) => s.collection.loading);

  const [query, setQuery] = useState('');
  const [selectedSet, setSelectedSet] = useState('');
  const [selectedRarity, setSelectedRarity] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedSort, setSelectedSort] = useState<'' | 'name' | 'rarity'>('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const [view, setView] = useState<ViewMode>('comfortable');
  const pageSize = view === 'dense' ? 25 : 18;

  const [page, setPage] = useState(1);

  const [optimisticTrades, setOptimisticTrades] = useState<
    Record<string, boolean>
  >({});
  const [detailsById, setDetailsById] = useState<Record<string, any>>({});
  const [flippedId, setFlippedId] = useState<string | null>(null);

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const filtersRef = useRef<HTMLDivElement | null>(null);
  const sortRef = useRef<HTMLDivElement | null>(null);

  const user = authService.getUser();
  const username = user?.username;

  useEffect(() => {
    if (!username) return;
    dispatch(fetchUserCollection(username));
  }, [dispatch, username]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (filtersRef.current && !filtersRef.current.contains(target))
        setFiltersOpen(false);
      if (sortRef.current && !sortRef.current.contains(target))
        setSortOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const isTouchLike = () => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia?.('(hover: none)').matches ?? false;
  };

  const ensureDetail = async (card: any) => {
    const tcg = card.pokemonTcgId as string | undefined;
    if (!tcg) return;
    if (detailsById[card.id]) return;
    const detail = await api.getCachedCardByTcgId(tcg);
    setDetailsById((prev) => ({ ...prev, [card.id]: detail }));
  };

  const sets = useMemo(() => {
    const s = new Set<string>();
    (collection || []).forEach((c: any) => {
      if (c.series) s.add(c.series);
      if (c.set) s.add(c.set);
    });
    return Array.from(s).filter(Boolean).sort();
  }, [collection]);

  const rarities = useMemo(() => {
    const s = new Set<string>();
    (collection || []).forEach((c: any) => {
      if (c.rarity) s.add(c.rarity);
    });
    const present = Array.from(s).filter(Boolean);

    const presentMap = new Map<string, string>();
    present.forEach((p) => presentMap.set(p.toString().toLowerCase(), p));

    const orderedFromCanonical = RARITY_ORDER.filter((r) =>
      presentMap.has(r.toLowerCase())
    ).map((r) => presentMap.get(r.toLowerCase())!);

    const extras = present
      .filter(
        (p) =>
          !RARITY_ORDER.some(
            (r) => r.toLowerCase() === p.toString().toLowerCase()
          )
      )
      .sort((a, b) => a.toString().localeCompare(b.toString()));

    return [...orderedFromCanonical, ...extras];
  }, [collection]);

  const types = useMemo(() => {
    const s = new Set<string>();
    (collection || []).forEach((c: any) => {
      if (Array.isArray(c.types)) c.types.forEach((tt: string) => s.add(tt));
    });
    return Array.from(s).filter(Boolean).sort();
  }, [collection]);

  const filtered = useMemo(() => {
    let items = (collection || []).slice();

    if (query) {
      const q = query.toLowerCase();
      items = items.filter(
        (c: any) =>
          (c.name || '').toLowerCase().includes(q) ||
          (c.series || '').toLowerCase().includes(q) ||
          (c.set || '').toLowerCase().includes(q)
      );
    }

    if (selectedSet)
      items = items.filter(
        (c: any) => c.set === selectedSet || c.series === selectedSet
      );
    if (selectedRarity)
      items = items.filter((c: any) => c.rarity === selectedRarity);
    if (selectedType)
      items = items.filter((c: any) => c.types?.includes(selectedType));

    const dir = sortDir === 'asc' ? 1 : -1;

    if (selectedSort === 'name') {
      items.sort(
        (a: any, b: any) =>
          dir *
          (a.name || '').toString().localeCompare((b.name || '').toString())
      );
    } else if (selectedSort === 'rarity') {
      const orderMap = new Map<string, number>();
      RARITY_ORDER.forEach((r, i) => orderMap.set(r.toLowerCase(), i));
      const INF = 1e6;

      items.sort((a: any, b: any) => {
        const ar = (a.rarity || '').toString().toLowerCase();
        const br = (b.rarity || '').toString().toLowerCase();
        const ai = orderMap.has(ar) ? (orderMap.get(ar) as number) : INF;
        const bi = orderMap.has(br) ? (orderMap.get(br) as number) : INF;
        if (ai !== bi) return dir * (ai - bi);
        if (ai === INF && bi === INF)
          return (a.rarity || '')
            .toString()
            .localeCompare((b.rarity || '').toString());
        return (
          dir *
          (a.name || '').toString().localeCompare((b.name || '').toString())
        );
      });
    }

    return items;
  }, [
    collection,
    query,
    selectedSet,
    selectedRarity,
    selectedType,
    selectedSort,
    sortDir,
  ]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [
    query,
    selectedSet,
    selectedRarity,
    selectedType,
    selectedSort,
    sortDir,
    view,
  ]);

  const clearFilters = () => {
    setSelectedSet('');
    setSelectedRarity('');
    setSelectedType('');
  };

  const setOptions: SelectOption[] = useMemo(
    () => [
      { value: '', label: t('common.all', 'Todos') },
      ...sets.map((s) => ({ value: s, label: s })),
    ],
    [sets, t]
  );

  const rarityOptions: SelectOption[] = useMemo(
    () => [
      { value: '', label: t('common.all', 'Todas') },
      ...rarities.map((r) => ({ value: r, label: r })),
    ],
    [rarities, t]
  );

  const typeOptions: SelectOption[] = useMemo(
    () => [
      { value: '', label: t('common.all', 'Todos') },
      ...types.map((tp) => ({ value: tp, label: tp })),
    ],
    [types, t]
  );

  const sortOptions: SelectOption[] = useMemo(
    () => [
      { value: '', label: t('common.none', 'Ninguno') },
      { value: 'name', label: t('collection.sortName', 'Nombre') },
      { value: 'rarity', label: t('common.rarity', 'Rareza') },
    ],
    [t]
  );

  return (
    <div
      className="collectionPage"
      style={{ backgroundColor: 'var(--background)', color: 'var(--text)' }}
    >
      <Header />

      <main className="collectionMain">
        <div className="collectionHeaderRow collectionHeaderRow--center">
          <h1 className="collectionTitleLine">
            <span className="collectionTitleWord">{t('collection.title')}</span>
            <span className="collectionTitleSep">|</span>
            <span className="collectionTitleCount">{filtered.length}</span>
            <span className="collectionTitleText">{t('collection.cards')}</span>
          </h1>
        </div>

        <section className="collectionToolbar">
          <div className="toolbarRightGroup">
            <input
              className="searchInput searchInput--right"
              placeholder={t('collection.search')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />

            <div className="panelWrap" ref={filtersRef}>
              <button
                className={`iconAction ${filtersOpen ? 'isActive' : ''}`}
                onClick={() => {
                  setFiltersOpen((v) => !v);
                  setSortOpen(false);
                }}
                type="button"
              >
                <SlidersHorizontal size={22} />
              </button>

              {filtersOpen && (
                <div className="panel panel--pro">
                  <div className="panelHeader">
                    <div className="panelHeaderTitle">
                      {t('common.filter') || 'Filtrar'}
                    </div>
                    <button
                      className="panelCloseBtn"
                      onClick={() => setFiltersOpen(false)}
                      type="button"
                      aria-label="Cerrar"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className="panelDivider" />

                  <div className="panelBody">
                    <label className="panelField">
                      <span>{t('collection.sets')}</span>
                      <SelectPopover
                        value={selectedSet}
                        onChange={setSelectedSet}
                        options={setOptions}
                        placeholder={t('collection.sets')}
                        searchable
                        maxHeight={320}
                      />
                    </label>

                    <label className="panelField">
                      <span>{t('common.rarity')}</span>
                      <SelectPopover
                        value={selectedRarity}
                        onChange={setSelectedRarity}
                        options={rarityOptions}
                        placeholder={t('common.rarity')}
                        searchable
                        maxHeight={320}
                      />
                    </label>

                    <label className="panelField">
                      <span>{t('collection.type')}</span>
                      <SelectPopover
                        value={selectedType}
                        onChange={setSelectedType}
                        options={typeOptions}
                        placeholder={t('collection.type')}
                        searchable
                        maxHeight={320}
                      />
                    </label>
                  </div>

                  <div className="panelFooter panelFooter--sticky">
                    <button
                      className="btnLite btnLite--ghost"
                      onClick={clearFilters}
                      type="button"
                    >
                      {t('common.clear') || 'Limpiar'}
                    </button>
                    <button
                      className="btnPrimary"
                      onClick={() => setFiltersOpen(false)}
                      type="button"
                    >
                      {t('common.done') || 'Listo'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="panelWrap" ref={sortRef}>
              <button
                className={`iconAction ${sortOpen ? 'isActive' : ''}`}
                onClick={() => {
                  setSortOpen((v) => !v);
                  setFiltersOpen(false);
                }}
                type="button"
              >
                <ArrowUpDown size={22} />
              </button>

              {sortOpen && (
                <div className="panel panel--pro">
                  <div className="panelHeader">
                    <div className="panelHeaderTitle">
                      {t('collection.sort') || 'Ordenar'}
                    </div>
                    <button
                      className="panelCloseBtn"
                      onClick={() => setSortOpen(false)}
                      type="button"
                      aria-label="Cerrar"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className="panelDivider" />

                  <div className="panelBody">
                    <label className="panelField">
                      <span>{t('collection.sort') || 'Ordenar por'}</span>
                      <SelectPopover
                        value={selectedSort}
                        onChange={(v) => setSelectedSort(v as any)}
                        options={sortOptions}
                        placeholder={t('collection.sort')}
                        searchable={false}
                        maxHeight={240}
                      />
                    </label>

                    <button
                      className="btnLite btnLite--full btnLite--ghost"
                      onClick={() =>
                        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
                      }
                      type="button"
                    >
                      {sortDir === 'asc' ? (
                        <ArrowUp size={18} />
                      ) : (
                        <ArrowDown size={18} />
                      )}
                      {sortDir === 'asc'
                        ? t('common.asc') || 'Ascendente'
                        : t('common.desc') || 'Descendente'}
                    </button>
                  </div>

                  <div className="panelFooter panelFooter--sticky">
                    <button
                      className="btnLite btnLite--ghost"
                      onClick={() => {
                        setSelectedSort('');
                        setSortDir('asc');
                      }}
                      type="button"
                    >
                      {t('common.clear') || 'Limpiar'}
                    </button>
                    <button
                      className="btnPrimary"
                      onClick={() => setSortOpen(false)}
                      type="button"
                    >
                      {t('common.done') || 'Listo'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="viewToggles">
              <button
                className={`iconAction ${view === 'comfortable' ? 'isActive' : ''}`}
                onClick={() => setView('comfortable')}
                type="button"
              >
                <Grid2X2 size={22} />
              </button>

              <button
                className={`iconAction ${view === 'dense' ? 'isActive' : ''}`}
                onClick={() => setView('dense')}
                type="button"
              >
                <Grid3X3 size={22} />
              </button>
            </div>
          </div>
        </section>

        <div className="collectionContent">
          {loading ? (
            <div className="stateBox loadingState">{t('common.loading')}</div>
          ) : pageItems.length === 0 ? (
            <div className="stateBox">{t('collection.empty')}</div>
          ) : (
            <section
              className={`cardsGrid ${view === 'dense' ? 'isDense' : 'isComfortable'}`}
            >
              {pageItems.map((c: any) => {
                const isFlipped = flippedId === c.id;
                const forTrade =
                  (optimisticTrades[c.id] ?? c.forTrade) ? true : false;
                const d = detailsById[c.id];

                return (
                  <article key={c.id} className="cardTileBig">
                    <div
                      className={`flipCard ${isFlipped ? 'isFlipped' : ''}`}
                      onMouseEnter={async () => {
                        setFlippedId(c.id);
                        await ensureDetail(c);
                      }}
                      onMouseLeave={() => setFlippedId(null)}
                      onClick={async () => {
                        if (isTouchLike()) {
                          const next = flippedId === c.id ? null : c.id;
                          setFlippedId(next);
                          if (next) await ensureDetail(c);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="flipFace flipFront">
                        <div className="cardImageWrap">
                          <img src={c.image} alt={c.name} loading="lazy" />
                        </div>
                      </div>
                      <div className="flipFace flipBack">
                        <button
                          className={`tradeIconBack ${forTrade ? 'isOn' : ''}`}
                          onClick={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();

                            const u = authService.getUser();
                            if (!u || !authService.isAuthenticated()) {
                              window.alert(t('common.mustLoginForTrade'));
                              return;
                            }

                            const current =
                              optimisticTrades[c.id] ?? c.forTrade;
                            const next = !current;
                            setOptimisticTrades((prev) => ({
                              ...prev,
                              [c.id]: next,
                            }));

                            const ok = await api.updateUserCard(
                              u.username || u.id,
                              c.id,
                              { forTrade: next }
                            );
                            if (!ok) {
                              setOptimisticTrades((prev) => ({
                                ...prev,
                                [c.id]: current,
                              }));
                              window.alert(t('common.errorUpdatingTrade'));
                            } else {
                              dispatch(fetchUserCollection(u.username || u.id));
                            }
                          }}
                          type="button"
                        >
                          <Tag size={20} />
                        </button>

                        <div className="backBody">
                          <div className="backTitle" title={c.name}>
                            {c.name}
                          </div>

                          <div className="backAttrGrid">
                            <div className="backAttrBox">
                              <span className="backAttrLabel">
                                {t('common.rarity')}
                              </span>
                              <span className="backAttrValue">
                                {c.rarity || '—'}
                              </span>
                            </div>

                            <div className="backAttrBox">
                              <span className="backAttrLabel">
                                {t('common.set')}
                              </span>
                              <span className="backAttrValue">
                                {c.set || c.series || '—'}
                              </span>
                            </div>
                          </div>

                          <div className="backSection">
                            <span className="backSectionTitle">
                              {t('common.illustrator')}
                            </span>
                            <span className="backSectionValue">
                              {(d && (d.illustrator || d.artist)) ||
                                c.illustrator ||
                                '—'}
                            </span>
                          </div>

                          <div className="backPrice">
                            {d || c.price ? (
                              (() => {
                                const avg =
                                  c?.price?.avg ??
                                  d?.price?.avg ??
                                  c?.avg ??
                                  d?.avg ??
                                  c?.price?.cardmarketAvg ??
                                  d?.price?.cardmarketAvg ??
                                  c?.cardmarketAvg ??
                                  d?.cardmarketAvg ??
                                  null;

                                return (
                                  <div className="priceRow">
                                    <span className="priceLabel">
                                      {t('common.price')}
                                    </span>
                                    <span className="priceValue">
                                      {avg === null || avg === undefined
                                        ? '—'
                                        : `${Number(avg).toFixed(2)}€`}
                                    </span>
                                  </div>
                                );
                              })()
                            ) : (
                              <div className="loadingTiny">
                                {t('common.loadingPrices')}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="cardCaption" title={c.name}>
                      {c.name}
                    </div>
                  </article>
                );
              })}
            </section>
          )}
        </div>
        {!loading && pageItems.length > 0 && (
          <div className="pagerZone">
            <div className="pager">
              <button
                className="pagerBtn"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                type="button"
              >
                {t('collection.prev') || 'Anterior'}
              </button>

              <div className="pagerInfo">
                {page} / {totalPages}
              </div>

              <button
                className="pagerBtn"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                type="button"
              >
                {t('collection.next') || 'Siguiente'}
              </button>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default CollectionPage;
