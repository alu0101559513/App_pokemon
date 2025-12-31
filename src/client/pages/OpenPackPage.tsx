import React, { useRef, useEffect, useState } from 'react';
import Header from '../components/Header/Header';
import Footer from '../components/Footer';
import api from '../services/apiService';
import { authService } from '../services/authService';
import { authenticatedFetch } from '../utils/fetchHelpers';
import { API_BASE_URL } from '../config/constants';
import { useTranslation } from 'react-i18next';
import confetti from 'canvas-confetti';
import '../styles/open_pack.css';

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

const explodePack = () => {
  confetti({ particleCount: 180, spread: 70, origin: { y: 0.6 } });
  confetti({
    particleCount: 90,
    angle: 60,
    spread: 55,
    origin: { x: 0, y: 0.6 },
  });
  confetti({
    particleCount: 90,
    angle: 120,
    spread: 55,
    origin: { x: 1, y: 0.6 },
  });
};

const OpenPackPage: React.FC = () => {
  const { t } = useTranslation();
  const [setInfo, setSetInfo] = useState<any | null>(null);
  const [loadingSet, setLoadingSet] = useState(false);
  const [opening, setOpening] = useState(false);
  const [packOpened, setPackOpened] = useState(false);
  const [openedCards, setOpenedCards] = useState<any[]>([]);
  const [packStatus, setPackStatus] = useState<{
    remaining: number;
    count24: number;
    nextAllowed?: string | null;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resetCode, setResetCode] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [showReset, setShowReset] = useState(false);
  const [timeUntilNext, setTimeUntilNext] = useState<string>('');
  const openedCardsRef = useRef<HTMLDivElement | null>(null);

  const SET_OPTIONS = [
    {
      id: 'me01',
      label: t('openPack.setMegaEvolution', 'Mega Evolution (me01)'),
    },
    { id: 'sm9', label: t('openPack.setTeamUp', 'Team Up (sm9)') },
    { id: 'base1', label: t('openPack.setBaseSet', 'Base Set (base1)') },
    { id: 'bw9', label: t('openPack.setPlasmaFreeze', 'Plasma Freeze (bw9)') },
    {
      id: 'sv05',
      label: t('openPack.setTemporalForces', 'Temporal Forces (sv05)'),
    },
  ];

  const [selectedSet, setSelectedSet] = useState<string>(SET_OPTIONS[0].id);

  useEffect(() => {
    if (openedCards.length > 0) {
      openedCardsRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  }, [openedCards]);

  // Actualizar el tiempo restante cada segundo
  useEffect(() => {
    const updateTimer = () => {
      if (!packStatus?.nextAllowed) {
        setTimeUntilNext('');
        return;
      }

      const nextDate = new Date(packStatus.nextAllowed);
      const now = Date.now();
      const diff = nextDate.getTime() - now;

      if (diff <= 0) {
        setTimeUntilNext(t('openPack.readyNow', 'Ready now!'));
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeUntilNext(`${hours}h ${minutes}m ${seconds}s`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [packStatus, t]);

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
        const resp = await authenticatedFetch(
          `/users/${encodeURIComponent(user.username || user.id)}/pack-status`
        );

        if (resp.ok) {
          const json = await resp.json();
          console.log('Pack status loaded:', json); // Debug
          setPackStatus(json.data || json); // Extraer data si existe
        } else {
          console.error('Failed to load pack status:', resp.status);
        }
      } catch (err) {
        console.error('Error loading pack status:', err);
      }
    }
    loadStatus();

    return () => {
      mounted = false;
    };
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

    if (imgs.symbol)
      return typeof imgs.symbol === 'string' ? imgs.symbol : imgs.symbol.url;
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
        setError('Debes iniciar sesión');
        return;
      }

      const resp = await authenticatedFetch(
        `/users/${encodeURIComponent(user.username || user.id)}/open-pack`,
        {
          method: 'POST',
          body: JSON.stringify({ setId: selectedSet }),
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
        image: c.image,
      }));

      setOpenedCards(normalized);

      const statusResp = await authenticatedFetch(
        `/users/${encodeURIComponent(user.username || user.id)}/pack-status`
      );

      if (statusResp.ok) {
        const newStatus = await statusResp.json();
        setPackStatus(newStatus.data || newStatus); // Extraer data si existe
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
          <h2 className="open-pack-title">
            {t('openPack.openPackTitle', 'Open Pack')}
          </h2>
        </div>

        <div className="open-pack-content">
          {loadingSet ? (
            <div>{t('common.loadingSet')}</div>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 20,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  gap: 12,
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                }}
              >
                {SET_OPTIONS.map((s) => (
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
                  src={
                    packOpened
                      ? '/assets/foil_pack_open.png'
                      : '/assets/foil_pack.png'
                  }
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

              {packStatus ? (
                <div className="open-pack-status">
                  <div style={{ fontSize: '1.2em', marginBottom: '8px' }}>
                    <span style={{ opacity: 0.8 }}>
                      {t('openPack.availableTokens', 'Tokens disponibles')}:
                    </span>{' '}
                    <strong style={{ fontSize: '1.3em', color: (packStatus.remaining ?? 0) > 0 ? '#4CAF50' : '#f44336' }}>
                      {packStatus.remaining ?? 0} / 2
                    </strong>
                  </div>
                  
                  {(packStatus.remaining ?? 0) < 2 && timeUntilNext && (
                    <div style={{ 
                      fontSize: '0.95em', 
                      opacity: 0.9,
                      padding: '8px 12px',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '8px',
                      marginTop: '8px'
                    }}>
                      <div>
                        {t('openPack.nextTokenIn', 'Próximo token en')}:{' '}
                        <strong style={{ color: '#FFB74D' }}>{timeUntilNext}</strong>
                      </div>
                      {packStatus.remaining === 0 && (
                        <small style={{ opacity: 0.7, display: 'block', marginTop: '4px' }}>
                          {t('openPack.noTokensAvailable', 'No tienes tokens disponibles')}
                        </small>
                      )}
                    </div>
                  )}
                  
                  {packStatus.remaining === 2 && (
                    <div style={{ 
                      fontSize: '0.9em', 
                      opacity: 0.7,
                      marginTop: '4px'
                    }}>
                      {t('openPack.maxTokens', 'Tienes el máximo de tokens')}
                    </div>
                  )}
                </div>
              ) : (
                <div className="open-pack-status">
                  <div style={{ opacity: 0.6 }}>
                    {t('common.loading', 'Cargando...')}
                  </div>
                </div>
              )}

              <div>
                {!showReset && (
                  <button
                    className="open-pack-reset-toggle"
                    onClick={() => setShowReset(true)}
                  >
                    {t('openPack.code', 'Enter Reset Code')}
                  </button>
                )}

                {showReset && (
                  <div className="open-pack-reset-panel">
                    <button
                      className="open-pack-reset-close"
                      onClick={() => setShowReset(false)}
                      aria-label="Cerrar"
                    >
                      ✕
                    </button>

                    <input
                      placeholder={t(
                        'openPack.enterCode',
                        'Enter your reset code'
                      )}
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value)}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {error && <div style={{ color: 'red', marginTop: 12 }}>{error}</div>}

        {openedCards.length > 0 && (
          <div ref={openedCardsRef} style={{ marginTop: 20 }}>
            <div className="collection-grid">
              {openedCards.map((c) => (
                <div key={c.id} className="collection-card">
                  <img src={c.image} alt={c.name} />
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
