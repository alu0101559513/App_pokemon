import React, { useState, useRef, useEffect } from "react";
import { Search, Menu, User } from "lucide-react";
import { useTranslation } from "react-i18next";
import NotificationBell from "./NotificationBell";
import LanguageSelector from "./LanguageSelector";
import DarkModeToggle from "./DarkModeToggle";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "../../services/authService";
import apiService from "../../services/apiService";
import { PokemonCard } from "../../types";
import "../../styles/header.css";

const Header: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PokemonCard[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [menuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [isTradeOpen, setIsTradeOpen] = useState(false);

  const tradeDropdownRef = useRef<HTMLDivElement | null>(null);
  const user = authService.getUser();
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearchOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchLoading(true);
      // Use TCGdex proxy quick search to avoid creating DB entries for ephemeral searches
      const results = await apiService.searchTcgQuick(searchQuery, 8).catch(() => []);
      setSearchResults(results);
      setSearchLoading(false);
      setSearchOpen(true);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const clickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", clickOutside);
    return () => document.removeEventListener("mousedown", clickOutside);
  }, []);
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        tradeDropdownRef.current &&
        !tradeDropdownRef.current.contains(e.target as Node)
      ) {
        setIsTradeOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCardSelect = (card: any) => {
    navigate(`/card/${card._id || card.id}`);
    setSearchQuery("");
    setSearchOpen(false);
    setSearchResults([]);
  };

  // navigate to search page on Enter
  const onSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchResults([]);
    }
  };

  return (
    <header className="header-wrapper">
      
      <div className="header-container">
        
        {/* IZQUIERDA */}
        <div className="header-left">
          <Link to="/home">
            <img src="/logo.png" alt="AMI Logo" className="header-logo" />
          </Link>

        <nav className="nav-desktop">

          {/* COLECCIÓN */}
          <Link to="/collection" className="CollectionButton">
            {t("header.coleccion")}
          </Link>

          {/* ABRIR SOBRES */}
          <Link to="/abrir" className="CollectionButton">
            {t('header.abrir')}
          </Link>

          {/* INTERCAMBIO */}
            <div className="relative" ref={tradeDropdownRef}>
              <button
                className="CollectionButton"
                onClick={() => setIsTradeOpen(!isTradeOpen)}
              >
                {t("header.intercambio")}
              </button>

              {isTradeOpen && (
                <div className="profile-dropdown fadeIn" style={{ top: "50px" }}>
                  <button
                    onClick={() => {
                      setIsTradeOpen(false);
                      navigate("/discover");
                    }}
                    className="dropdown-item"
                  >
                    {t("header.descubrirCartas")}
                  </button>

                  <button
                    onClick={() => {
                      setIsTradeOpen(false);
                      navigate("/trade-requests");
                    }}
                    className="dropdown-item"
                  >
                    {t("header.solicitudes")}
                  </button>

                  <button
                    onClick={() => {
                      setIsTradeOpen(false);
                      navigate("/trade-room/create");
                    }}
                    className="dropdown-item"
                  >
                    {t("header.crearSala")}
                  </button>
                </div>
              )}
            </div>
          </nav>
        </div>
        {/* BUSCADOR */}
        <div className="search-container" ref={searchRef}>
          <input
            type="text"
            placeholder={t("header.buscar")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={onSearchKeyDown}
            onFocus={() => setSearchOpen(true)}
            className="header-search"
          />
          <Search className="search-icon" />
          
          {/* DROPDOWN DE BÚSQUEDA */}
          {searchOpen && searchQuery.trim() && (
            <div className="search-dropdown">
              {searchLoading && (
                <div className="search-dropdown-loading">
                  <div className="spinner"></div>
                  Buscando...
                </div>
              )}
              
              {!searchLoading && searchResults.length === 0 && (
                <div className="search-dropdown-empty">
                  No se encontraron cartas
                </div>
              )}
              
              {!searchLoading && searchResults.length > 0 && (
                <div className="search-dropdown-list">
                  {searchResults.map((card) => (
                    <div
                      key={card.id}
                      className="search-dropdown-item"
                      onClick={() => handleCardSelect(card)}
                    >
                      <div className="dropdown-item-image">
                        {card.image && (
                          <img
                            src={card.image}
                            alt={card.name}
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        )}
                      </div>
                      <div className="dropdown-item-info">
                        <div className="dropdown-item-name">{card.name}</div>
                        <div className="dropdown-item-details">
                          {card.set && <span className="set-badge">{card.set}</span>}
                          {card.rarity && <span className="rarity-badge">{card.rarity}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* DERECHA */}
        <div className="header-right">
          <NotificationBell />
          <LanguageSelector />
          <DarkModeToggle />

          {/* PERFIL + DROPDOWN */}
          <div className="relative" ref={dropdownRef}>
            <button
              className="profile-button"
              onClick={() => setProfileOpen(!profileOpen)}
            >
              <User className="profile-icon" />
            </button>

            {/* DROPDOWN */}
            {profileOpen && (
              <div className="profile-dropdown fadeIn">
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    navigate("/friends");
                  }}
                  className="dropdown-item"
                >
                  {t("header.amigos")}
                </button>
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    navigate("/profile");
                  }}
                  className="dropdown-item"
                >
                  {t("header.ajustes")}
                </button>

                <button
                  onClick={() => {
                    authService.logout();
                    navigate("/");
                  }}
                  className="dropdown-item logout"
                >
                  {t("header.cerrarSesion")}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MENÚ MÓVIL */}
      {menuOpen && (
        <nav className="mobile-menu fadeIn">
          <img src="/logo.png" alt="Logo" className="mobile-logo" />
          <Link to="/coleccion" className="mobile-link">
            {t("header.coleccion")}
          </Link>
          <Link to="/trade" className="mobile-link">
            {t("header.intercambio")}
          </Link>
        </nav>
      )}
    </header>
  );
};

export default Header;
