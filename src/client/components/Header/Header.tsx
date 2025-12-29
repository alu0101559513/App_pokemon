import React, { useEffect, useId, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Search, User, ChevronDown, Menu, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import NotificationBell from './NotificationBell';
import LanguageSelector from './LanguageSelector';
import DarkModeToggle from './DarkModeToggle';
import { authService } from '../../services/authService';
import apiService from '../../services/apiService';
import { PokemonCard } from '../../types';
import '../../styles/header.css';

const Header: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const listId = useId();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [tradeOpen, setTradeOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PokemonCard[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  const profileRef = useRef<HTMLDivElement | null>(null);
  const tradeRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLDivElement | null>(null);

  const isAuthed = authService.isAuthenticated();
  const user = authService.getUser();

  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults([]);
      setSearchOpen(false);
      setSearchLoading(false);
      return;
    }

    let alive = true;
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      const results = await apiService.searchTcgQuick(q, 8).catch(() => []);
      if (!alive) return;
      setSearchResults(results);
      setSearchLoading(false);
      setSearchOpen(true);
    }, 260);

    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (profileRef.current && !profileRef.current.contains(target))
        setProfileOpen(false);
      if (tradeRef.current && !tradeRef.current.contains(target))
        setTradeOpen(false);
      if (searchRef.current && !searchRef.current.contains(target))
        setSearchOpen(false);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setProfileOpen(false);
        setTradeOpen(false);
        setSearchOpen(false);
        setMobileOpen(false);
      }
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const onSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchResults([]);
    }
  };

  const handleCardSelect = (card: any) => {
    navigate(`/card/${card._id || card.id}`);
    setSearchQuery('');
    setSearchOpen(false);
    setSearchResults([]);
  };

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark-mode');
    localStorage.setItem(
      'theme',
      document.documentElement.classList.contains('dark-mode')
        ? 'dark'
        : 'light'
    );
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark-mode');
    }
  }, []);

  return (
    <header className="siteHeader">
      <div className="siteHeader__inner">
        {/* LEFT */}
        <div className="siteHeader__left">
          <button
            className="iconBtn iconBtn--mobile"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={
              mobileOpen
                ? t('common.close', 'Cerrar')
                : t('common.open', 'Abrir')
            }
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          <Link
            to="/home"
            className="brand"
            aria-label={t('header.home', 'AMI Home')}
          >
            <span className="brand__text brand__text--gradient">AMI</span>
          </Link>

          <nav className="topNav" aria-label="Primary">
            <NavLink
              to="/collection"
              className={({ isActive }) =>
                `topNav__link ${isActive ? 'is-active' : ''}`
              }
            >
              {t('header.collection', 'Collection')}
            </NavLink>

            <NavLink
              to="/abrir"
              className={({ isActive }) =>
                `topNav__link ${isActive ? 'is-active' : ''}`
              }
            >
              {t('header.open', 'Open')}
            </NavLink>

            <div className="dropdown" ref={tradeRef}>
              <button
                className="topNav__link topNav__link--btn"
                onClick={() => setTradeOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={tradeOpen}
              >
                <span>{t('header.trade', 'Trade')}</span>
                <ChevronDown
                  size={18}
                  className={`chev ${tradeOpen ? 'chev--open' : ''}`}
                />
              </button>

              {tradeOpen && (
                <div className="menu" role="menu">
                  <button
                    role="menuitem"
                    className="menu__item"
                    onClick={() => {
                      setTradeOpen(false);
                      navigate('/discover');
                    }}
                  >
                    {t('header.discoverCards', 'Discover Cards')}
                  </button>

                  <button
                    role="menuitem"
                    className="menu__item"
                    onClick={() => {
                      setTradeOpen(false);
                      navigate('/trade-requests');
                    }}
                  >
                    {t('header.requests', 'Requests')}
                  </button>

                  <button
                    role="menuitem"
                    className="menu__item"
                    onClick={() => {
                      setTradeOpen(false);
                      navigate('/trade-room/create');
                    }}
                  >
                    {t('header.createRoom', 'Create Room')}
                  </button>
                </div>
              )}
            </div>
          </nav>
        </div>

        {/* SEARCH */}
        <div className="siteHeader__search" ref={searchRef}>
          <div className="search">
            <Search size={20} className="search__icon" />
            <input
              className="search__input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={onSearchKeyDown}
              onFocus={() => setSearchOpen(true)}
              placeholder={t('header.search', 'Search')}
              aria-controls={listId}
              aria-expanded={searchOpen}
              aria-autocomplete="list"
            />
          </div>

          {searchOpen && searchQuery.trim() && (
            <div className="searchDrop" id={listId} role="listbox">
              {searchLoading && (
                <div className="searchDrop__state">
                  <span className="spinner" aria-hidden="true" />
                  {t('common.searching') || 'Buscando...'}
                </div>
              )}

              {!searchLoading && searchResults.length === 0 && (
                <div className="searchDrop__state">
                  {t('common.noResults') || 'No se encontraron cartas'}
                </div>
              )}

              {!searchLoading && searchResults.length > 0 && (
                <div className="searchDrop__list">
                  {searchResults.map((card) => (
                    <button
                      key={card.id}
                      className="searchItem"
                      role="option"
                      onClick={() => handleCardSelect(card)}
                    >
                      <div className="searchItem__img">
                        {card.image ? (
                          <img
                            src={card.image}
                            alt={card.name}
                            loading="lazy"
                          />
                        ) : null}
                      </div>

                      <div className="searchItem__info">
                        <div className="searchItem__name">{card.name}</div>
                        <div className="searchItem__meta">
                          {card.set ? (
                            <span className="badge badge--set">{card.set}</span>
                          ) : null}
                          {card.rarity ? (
                            <span className="badge badge--rarity">
                              {card.rarity}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT */}
        <div className="siteHeader__right">
          <NotificationBell />
          <LanguageSelector />
          <DarkModeToggle />

          <div className="dropdown" ref={profileRef}>
            <button
              className="iconBtn iconBtn--profile"
              onClick={() => setProfileOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={profileOpen}
              aria-label={t('header.profile', 'Profile')}
            >
              <User size={22} />
            </button>

            {profileOpen && (
              <div className="menu menu--right" role="menu">
                {isAuthed ? (
                  <>
                    <div className="menu__header">
                      <div className="menu__title">
                        {user?.username || 'AMI'}
                      </div>
                      <div className="menu__sub">
                        {t('header.account', 'Account')}
                      </div>
                    </div>

                    <button
                      className="menu__item"
                      role="menuitem"
                      onClick={() => {
                        setProfileOpen(false);
                        navigate('/friends');
                      }}
                    >
                      {t('header.friends', 'Friends')}
                    </button>
                    <button
                      className="menu__item"
                      role="menuitem"
                      onClick={() => {
                        setProfileOpen(false);
                        navigate('/profile');
                      }}
                    >
                      {t('header.settings', 'Settings')}
                    </button>
                    <button
                      className="menu__item menu__item--danger"
                      role="menuitem"
                      onClick={() => {
                        authService.logout();
                        navigate('/');
                      }}
                    >
                      {t('header.logout', 'Log Out')}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="menu__item"
                      role="menuitem"
                      onClick={() => {
                        setProfileOpen(false);
                        navigate('/');
                      }}
                    >
                      {t('header.login', 'Log In')}
                    </button>
                    <button
                      className="menu__item"
                      role="menuitem"
                      onClick={() => {
                        setProfileOpen(false);
                        navigate('/register');
                      }}
                    >
                      {t('header.register', 'Register')}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MOBILE NAV */}
      {mobileOpen && (
        <div className="mobileNav">
          <NavLink
            to="/collection"
            onClick={() => setMobileOpen(false)}
            className="mobileNav__link"
          >
            {t('header.coleccion')}
          </NavLink>
          <NavLink
            to="/abrir"
            onClick={() => setMobileOpen(false)}
            className="mobileNav__link"
          >
            {t('header.abrir')}
          </NavLink>
          <NavLink
            to="/discover"
            onClick={() => setMobileOpen(false)}
            className="mobileNav__link"
          >
            {t('header.descubrirCartas')}
          </NavLink>
          <NavLink
            to="/trade-requests"
            onClick={() => setMobileOpen(false)}
            className="mobileNav__link"
          >
            {t('header.solicitudes')}
          </NavLink>
          <NavLink
            to="/trade-room/create"
            onClick={() => setMobileOpen(false)}
            className="mobileNav__link"
          >
            {t('header.crearSala')}
          </NavLink>
        </div>
      )}
    </header>
  );
};

export default Header;
