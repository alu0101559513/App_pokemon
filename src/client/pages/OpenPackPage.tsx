import React, { useEffect, useState } from 'react';
import Header from '../components/Header/Header';
import Footer from '../components/Footer';
import api from '../services/apiService';
import { authService } from '../services/authService';
import { useTranslation } from 'react-i18next';
import confetti from "canvas-confetti";
import '../styles/collection.css';

const RARITY_ORDER = [
  'Common','Uncommon','Rare','Holo Rare','Rare Holo','Double rare','ACE SPEC Rare',
  'Amazing Rare','Illustration rare','Special illustration rare','Ultra Rare','Holo Rare V',
  'Holo Rare VMAX','Holo Rare VSTAR','Shiny rare','Shiny Ultra Rare','Shiny rare V',
  'Shiny rare VMAX','Radiant Rare','Hyper rare','Mega Hyper Rare','Secret Rare','Rare PRIME',
  'Rare Holo LV.X','LEGEND','Full Art Trainer','Classic Collection','Black White Rare',
  'Crown','One Diamond','Two Diamond','Three Diamond','Four Diamond','One Star','Two Star',
  'Three Star','One Shiny','Two Shiny','None'
];

const explodePack = () => {
  confetti({ particleCount: 180, spread: 70, origin: { y: 0.6 } });
  confetti({ particleCount: 90, angle: 60, spread: 55, origin: { x: 0, y: 0.6 } });
  confetti({ particleCount: 90, angle: 120, spread: 55, origin: { x: 1, y: 0.6 } });
};

const OpenPackPage: React.FC = () => {
  const { t } = useTranslation();
  const [setInfo, setSetInfo] = useState<any | null>(null);
  const [loadingSet, setLoadingSet] = useState(false);

  const [opening, setOpening] = useState(false);
  const [packOpened, setPackOpened] = useState(false);

  const [openedCards, setOpenedCards] = useState<any[]>([]);
  const [packStatus, setPackStatus] = useState<{ remaining:number; count24:number; nextAllowed?: string | null } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [resetCode, setResetCode] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [showReset, setShowReset] = useState(false);

  const SET_OPTIONS = [
    { id: 'me01', label: 'Mega Evolución (me01)' },
    { id: 'sm9', label: 'Team Up (sm9)' },
    { id: 'base1', label: 'Base Set (base1)' },
    { id: 'bw9', label: 'Plasma Freeze (bw9)' },
    { id: 'sv05', label: 'Temporal Forces (sv05)' },
  ];

  const [selectedSet, setSelectedSet] = useState<string>(SET_OPTIONS[0].id);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoadingSet(true);
      try {
        const resp = await api.getCardsFromTcgDexSet(selectedSet);
        if (mounted) setSetInfo(resp);
      } catch (err: any) {
        if (mounted) setError(err?.message ?? String(err));
      } finally {
        if (mounted) setLoadingSet(false);
      }
    }
    load();

    async function loadStatus() {
      const user = authService.getUser();
      if (!user) return;

      try {
        const resp = await fetch(
          `http://localhost:3000/users/${encodeURIComponent(user.username||user.id)}/pack-status`,
          { headers: { ...authService.getAuthHeaders() } }
        );

        if (resp.ok) {
          const json = await resp.json();
          setPackStatus(json);
        }
      } catch {}
    }
    loadStatus();

    return () => { mounted = false };
  }, [selectedSet]);

  const getLogoUrl = () => {
    if (!setInfo) return '';
    const imgs = setInfo.images || {};

    if (typeof imgs === 'string') {
      let v = imgs;
      if (!v.startsWith('http')) v = `https://assets.tcgdex.net${v}`;
      if (v.endsWith('/logo')) v += '.png';
      return v;
    }

    if (imgs.symbol) return typeof imgs.symbol === 'string' ? imgs.symbol : imgs.symbol.url;
    if (setInfo.logo) return setInfo.logo;

    return '';
  };


  const openPack = async () => {
    setOpening(true);
    setOpenedCards([]);
    setError(null);

    try {
      const user = authService.getUser();
      if (!user) {
        setOpening(false);
        setError("Debes iniciar sesión");
        return;
      }

      const resp = await fetch(
        `http://localhost:3000/users/${encodeURIComponent(user.username||user.id)}/open-pack`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authService.getAuthHeaders() },
          body: JSON.stringify({ setId: selectedSet })
        }
      );

      if (!resp.ok) {
        const text = await resp.text();
        setError(text);
        setOpening(false);
        return;
      }

      const payload = await resp.json();
      const cards = payload.cards || [];
      const normalized = cards.map((c: any) => ({
        id: c.pokemonTcgId || c.tcgId,
        name: c.name,
        image: c.image
      }));

      setOpenedCards(normalized);

      const statusResp = await fetch(
        `http://localhost:3000/users/${encodeURIComponent(user.username||user.id)}/pack-status`,
        { headers: { ...authService.getAuthHeaders() } }
      );

      if (statusResp.ok) {
        const newStatus = await statusResp.json();
        setPackStatus(newStatus);
      }

    } catch (e: any) {
      setError(e?.message ?? String(e));
    }

    setOpening(false);
    setPackOpened(false); 
  };

  return (
    <div className="collection-page">
      <Header />
      <div className="collection-inner">

        <div className="open-pack-title-wrapper">
          <h2 className="open-pack-title">{t('header.abrir')}</h2>
        </div>


        {loadingSet ? (
          <div>{t('common.loadingSet')}</div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:20 }}>

            {/* selector de sets */}
            <div style={{ display:'flex', gap:12, flexWrap:'wrap', justifyContent:'center' }}>
              {SET_OPTIONS.map(s => (
                <button
                  key={s.id}
                    className={`set-button ${selectedSet === s.id ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedSet(s.id);
                    setOpenedCards([]);
                    setError(null);
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* sobre */}
            <div
              className="pack-container"
              onClick={() => {
                if (opening) return;
                if (!packStatus || packStatus.remaining <= 0) return;

                explodePack();
                setPackOpened(true);

                setTimeout(() => {
                  openPack();
                }, 400);
              }}
            >
              <img
                src={packOpened ? "/assets/foil_pack_open.png" : "/assets/foil_pack.png"}
                className="pack-base"
                alt="Sobre"
                draggable="false"
              />
              {getLogoUrl() && (
                <img
                  src={getLogoUrl()}
                  className="pack-logo"
                  alt="Logo del set"
                />
              )}
            </div>
            
            {packStatus && (
              <div style={{ textAlign:'center' }}>
                <div>{t('openPack.available')}: <strong>{packStatus.remaining}</strong></div>
                {packStatus.nextAllowed && (
                  <div style={{ fontSize:12, color:'#666' }}>
                    {t('openPack.nextAllowed')}: {new Date(packStatus.nextAllowed).toLocaleString()}
                  </div>
                )}
              </div>
            )}

            {/* reset admin */}
            <div>
              <button className="CollectionButton" onClick={() => setShowReset(s => !s)}>
                {showReset ? t('openPack.close') : t('openPack.code')}
              </button>

              {showReset && (
                <div style={{ marginTop:10, display:'flex', gap:8 }}>
                  <input value={resetCode} onChange={e => setResetCode(e.target.value)} />
                  <button className="CollectionButton">{t('openPack.reset')}</button>
                </div>
              )}
            </div>

          </div>
        )}

        {error && <div style={{ color:'red', marginTop:12 }}>{error}</div>}

        {/* cartas obtenidas */}
        {openedCards.length > 0 && (
          <div style={{ marginTop:20 }}>
            <h3>{t('openPack.cardsObtained')}</h3>
            <div className="collection-grid">
              {openedCards.map(c => (
                <div key={c.id} className="collection-card">
                  <img src={c.image} alt={c.name} />
                  <div className="card-name">{c.name}</div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
      <Footer />
    </div>
  );
};

export default OpenPackPage;
