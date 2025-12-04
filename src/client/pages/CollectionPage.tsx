import React, { useEffect, useMemo, useState } from 'react';
import Header from '../components/Header/Header';
import Footer from '../components/Footer';
import '../styles/collection.css';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUserCollection } from '../features/collection/collectionSlice';
import { RootState, AppDispatch } from '../store/store';
import { authService } from '../services/authService';
import api from '../services/apiService';
import { useTranslation } from 'react-i18next';

const PAGE_SIZE = 12;

// Canonical rarity order (used for filter dropdown and sorting)
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
  'None'
];

const CollectionPage: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const collection = useSelector((s: RootState) => s.collection.cards) as any[];
  const loading = useSelector((s: RootState) => s.collection.loading);
  const [query, setQuery] = useState('');
  const [selectedSet, setSelectedSet] = useState('');
  const [selectedRarity, setSelectedRarity] = useState('');
  const [selectedSort, setSelectedSort] = useState('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [selectedType, setSelectedType] = useState('');
  const [page, setPage] = useState(1);
  const [optimisticTrades, setOptimisticTrades] = useState<Record<string, boolean>>({});
  const [hoverDetails, setHoverDetails] = useState<Record<string, any>>({});
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const user = authService.getUser();
  const username = user?.username;

  useEffect(() => {
    if (!username) return;
    dispatch(fetchUserCollection(username));
  }, [dispatch, username]);

  // derive filter options from collection
  const sets = useMemo(() => {
    const s = new Set<string>();
    (collection || []).forEach((c: any) => { if (c.series) s.add(c.series); if (c.set) s.add(c.set); });
    return Array.from(s).filter(Boolean).sort();
  }, [collection]);

  const rarities = useMemo(() => {
    const s = new Set<string>();
    (collection || []).forEach((c: any) => { if (c.rarity) s.add(c.rarity); });
    const present = Array.from(s).filter(Boolean);

    // create a map for case-insensitive matching to prefer original casing from data
    const presentMap = new Map<string,string>();
    present.forEach(p => presentMap.set(p.toString().toLowerCase(), p));

    // first include rarities that are in the canonical list, in that order
    const orderedFromCanonical: string[] = RARITY_ORDER.filter(r => presentMap.has(r.toLowerCase())).map(r => presentMap.get(r.toLowerCase())!);

    // then include any extras not in the canonical list, sorted alphabetically
    const extras = present.filter(p => !RARITY_ORDER.some(r => r.toLowerCase() === p.toString().toLowerCase())).sort((a,b) => a.toString().localeCompare(b.toString()));

    return [...orderedFromCanonical, ...extras];
  }, [collection]);

  const types = useMemo(() => {
    const s = new Set<string>();
    (collection || []).forEach((c: any) => { if (c.types && Array.isArray(c.types)) c.types.forEach((t: string) => s.add(t)); });
    return Array.from(s).filter(Boolean).sort();
  }, [collection]);

  const filtered = useMemo(() => {
  let items = (collection || []).slice();
    if (query) {
      const q = query.toLowerCase();
      items = items.filter(c => (c.name || '').toLowerCase().includes(q) || (c.series||'').toLowerCase().includes(q) || (c.set||'').toLowerCase().includes(q));
    }
  if (selectedSet) items = items.filter((c:any) => (c.set === selectedSet) || (c.series === selectedSet));
  if (selectedRarity) items = items.filter((c:any) => c.rarity === selectedRarity);
  if (selectedType) items = items.filter((c:any) => c.types?.includes(selectedType));
  // apply sorting if requested
  const dir = sortDir === 'asc' ? 1 : -1;
  if (selectedSort === 'name') {
    items.sort((a:any,b:any) => dir * ( (a.name||'').toString().localeCompare((b.name||'').toString()) ));
  } else if (selectedSort === 'rarity') {
    // sort by canonical rarity order; unknown rarities go to the end and are sorted alphabetically among themselves
    const orderMap = new Map<string, number>();
    RARITY_ORDER.forEach((r, i) => orderMap.set(r.toLowerCase(), i));
    const INF = 1e6;
    items.sort((a:any,b:any) => {
      const ar = (a.rarity || '').toString().toLowerCase();
      const br = (b.rarity || '').toString().toLowerCase();
      const ai = orderMap.has(ar) ? (orderMap.get(ar) as number) : INF;
      const bi = orderMap.has(br) ? (orderMap.get(br) as number) : INF;
      if (ai !== bi) return dir * (ai - bi);
      if (ai === INF && bi === INF) return (a.rarity||'').toString().localeCompare((b.rarity||'').toString());
      // fallback: stable compare by name
      return dir * ( (a.name||'').toString().localeCompare((b.name||'').toString()) );
    });
  }
    return items;
  }, [collection, query, selectedSet, selectedRarity, selectedType, selectedSort, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);

  useEffect(() => { setPage(1); }, [query, selectedSet, selectedRarity, selectedType, selectedSort]);

  return (
    <div className="collection-page">
      <Header />
      <div className="collection-inner">
        <div className="collection-controls">
          <div style={{display:'flex', gap:'.5rem', alignItems:'center'}}>
            <h2 style={{margin:0}}>{t('Colección')}</h2>
            <p style={{margin:0, marginLeft:'.75rem', color:'var(--text-secondary)'}}>{collection.length} {t('collection.cards')}</p>
          </div>

          <div className="collection-filters">
            <input placeholder={t('collection.search')} value={query} onChange={(e)=>setQuery(e.target.value)} className="header-search" />

            <select value={selectedSet} onChange={(e)=>setSelectedSet(e.target.value)}>
              <option value="">{t('collection.sets')}</option>
              {sets.map(s=> <option key={s} value={s}>{s}</option>)}
            </select>

            <select value={selectedRarity} onChange={(e)=>setSelectedRarity(e.target.value)}>
              <option value="">{t('common.rarity')}</option>
              {rarities.map(r=> <option key={r} value={r}>{r}</option>)}
            </select>

            <select value={selectedType} onChange={(e)=>setSelectedType(e.target.value)}>
              <option value="">{t('collection.type')}</option>
              {types.map(ti=> <option key={ti} value={ti}>{ti}</option>)}
            </select>

            <select value={selectedSort} onChange={(e)=>setSelectedSort(e.target.value)}>
              <option value="">{t('collection.sort')}</option>
              <option value="name">{t('collection.sortName')}</option>
              <option value="rarity">{t('common.rarity')}</option>
            </select>
            <button
              title={sortDir === 'asc' ? t('common.ascendingOrder') : t('common.descendingOrder')}
              onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
              style={{marginLeft:8}}
              className="CollectionButton"
            >
              {sortDir === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="collection-empty">{t('common.loading')}</div>
        ) : pageItems.length === 0 ? (
          <div className="collection-empty">{t('collection.empty')}</div>
        ) : (
          <div className="collection-grid">
            {pageItems.map((c:any)=> {
              const isFlipped = hoveredId === c.id;
              return (
                <div key={c.id} className="collection-card">
                  <div
                    className={`card-flip ${isFlipped ? 'is-flipped' : ''}`}
                    onMouseEnter={async ()=>{
                      setHoveredId(c.id);
                      const tcg = c.pokemonTcgId as string | undefined;
                      if (!tcg) return;
                      if (hoverDetails[c.id]) return;
                      const detail = await api.getCachedCardByTcgId(tcg);
                      setHoverDetails(prev => ({ ...prev, [c.id]: detail }));
                    }}
                    onMouseLeave={() => { setHoveredId(null); }}
                  >
                    <div className="card-front">
                      <img src={c.image} alt={c.name} />

                    </div>

                    <div className="card-back">
                                            <button
                        title={ (optimisticTrades[c.id] ?? c.forTrade) ? t('common.markedForTrade') : t('common.markForTrade') }
                        onClick={async (e)=>{
                          e.stopPropagation();
                          const user = authService.getUser();
                          if (!user || !authService.isAuthenticated()) {
                            window.alert(t('common.mustLoginForTrade'));
                            return;
                          }
                          const current = optimisticTrades[c.id] ?? c.forTrade;
                          const next = !current;
                          setOptimisticTrades(prev=> ({ ...prev, [c.id]: next }));
                          const ok = await api.updateUserCard(user.username || user.id, c.id, { forTrade: next });
                          if (!ok) {
                            setOptimisticTrades(prev=> ({ ...prev, [c.id]: current }));
                            window.alert(t('common.errorUpdatingTrade'));
                          } else {
                            dispatch(fetchUserCollection(user.username || user.id));
                          }
                        }}
                        style={{ position:'absolute', top:8, right:8, zIndex:3, background:'white', borderRadius:8, padding:'6px' }}
                      >
                        <span style={{fontSize:'18px'}}>{(optimisticTrades[c.id] ?? c.forTrade) ? '✅' : '⭕'}</span>
                      </button>
                      <div className="card-back-inner collection-back-inner">
                          <h3 className="back-name collection-back-name">{c.name}</h3>
                          <div className="back-row collection-back-row">
                            <div className="back-label">{t('common.rarity')}</div>
                            <div className="back-value">{c.rarity || '—'}</div>
                          </div>
                          <div className="back-row collection-back-row">
                            <div className="back-label">{t('common.set')}</div>
                            <div className="back-value">{c.set || c.series || '—'}</div>
                          </div>
                          <div className="back-row collection-back-row">
                            <div className="back-label">{t('common.illustrator')}</div>
                            <div className="back-value">{(hoverDetails[c.id] && (hoverDetails[c.id].illustrator || hoverDetails[c.id].artist)) || c.illustrator || '—'}</div>
                          </div>
                          <div className="back-price collection-back-price">
                            {hoverDetails[c.id] ? (() => {
                                const d = hoverDetails[c.id];
                                const avg = d?.price?.avg ?? d?.avg ?? d?.price?.cardmarketAvg ?? d?.cardmarketAvg ?? null;
                                return (
                                  <div className="price-grid collection-price-grid">
                                    <div style={{fontWeight:700}}>Average:</div>
                                    <div>{avg === null || avg === undefined ? '—' : `${Number(avg).toFixed(2)}€`}</div>
                                  </div>
                                );
                              })() : (
                                <div className="loading">{t('common.loadingPrices')}</div>
                              )}
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

        <div className="discover-pagination">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="CollectionButton"
          >
            {t("collection.prev") || "Anterior"}
          </button>

          <span className="discover-pagination-info">
            {page} / {totalPages}
          </span>

          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="CollectionButton"
          >
            {t("collection.next") || "Siguiente"}
          </button>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default CollectionPage;
