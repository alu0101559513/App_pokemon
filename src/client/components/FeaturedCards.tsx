import React from 'react';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../store/store';
import { addToWishlist, removeFromWishlist } from '../features/whislist/whislistSlice';
import { authService } from '../services/authService';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from "react-i18next";
import "../styles/feature.css"

interface Card {
  id: string;
  name: string;
  image: string;
  hp: string;
  set?: string;
  rarity: string;
  price?: {
    low: number;
    mid: number;
    high: number;
  };
  illustrator?: string;
  cardNumber?: string;
  series?: string;
}

const FeaturedCards: React.FC = () => {
  const { t } = useTranslation();

  const [currentIndex] = React.useState(0);
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const trackRef = React.useRef<HTMLDivElement | null>(null);

  // TCGdex IDs provided by the user to show in featured section
  const featuredIds = [
    'me01-178',
    'me01-180',
    'me02-125',
    'me02-129',
    'sv10.5b-166',
    'sv10.5b-172',
    'sv10.5w-173'
  ];

  const [featuredCards, setFeaturedCards] = React.useState<Card[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [wishlistSet, setWishlistSet] = React.useState<Set<string>>(new Set());

  const normalizeImageUrl = (url: string | undefined) => {
    if (!url) return '';
    // If URL already ends with a known size png, prefer the high.png variant
    if (/\/(?:small|large|high|low)\.png$/i.test(url)) {
      return url.replace(/\/(?:small|large|high|low)\.png$/i, '/high.png');
    }
    // If it's a direct image (ends with png/jpg) keep it
    if (/\.(png|jpg|jpeg|gif|webp)$/i.test(url)) return url;
    // Otherwise append /high.png (handle trailing slash)
    return url.endsWith('/') ? `${url}high.png` : `${url}/high.png`;
  };

  // Fetch card data from backend (cache-first POST /cards)
  React.useEffect(() => {
    let mounted = true;

    async function fetchCards() {
      try {
        setLoading(true);
        const base = 'http://localhost:3000';
        const promises = featuredIds.map(async (tcgId) => {
          const resp = await fetch(`${base}/cards`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: tcgId })
          });
          if (!resp.ok) throw new Error(`Failed to fetch ${tcgId}: ${resp.statusText}`);
          const data = await resp.json();
          // the API returns { source, card }
          return data.card;
        });

        const results = await Promise.all(promises);
        if (!mounted) return;

        // normalize into Card[] shape used by this component
        const normalized: Card[] = results.map((c: any) => {
          const id = c.pokemonTcgId || c._id || c.id || '';
          // prefer server-provided images, fall back to constructed TCGdex path using id
          let rawImage = (c.images && (c.images.large || c.images.small)) || c.imageUrl || c.image || '';
          if (!rawImage && id) {
            const [setCode, number] = id.split('-');
            const m = setCode ? String(setCode).match(/^[a-zA-Z]+/) : null;
            const series = m ? m[0] : (setCode ? setCode.slice(0,2) : '');
            if (setCode && number) {
              rawImage = `https://assets.tcgdex.net/en/${series}/${setCode}/${number}/high.png`;
            }
          }

          // derive set name
          const setName = c.set?.name || c.set?.series || c.set || c.series || '';

          // derive price object from server or API shapes
          let priceObj: { low?: number; mid?: number; high?: number } | undefined = undefined;
          if (c.price) {
            priceObj = {
              low: c.price.cardmarketAvg ?? c.price.tcgplayerMarketPrice ?? undefined,
              mid: c.price.avg ?? c.price.tcgplayerMarketPrice ?? c.price.cardmarketAvg ?? undefined,
              high: c.price.cardmarketAvg ?? c.price.tcgplayerMarketPrice ?? undefined
            };
          } else if (c.prices) {
            priceObj = {
              low: c.prices.low ?? c.prices.mid ?? c.prices.high,
              mid: c.prices.mid ?? c.prices.low ?? c.prices.high,
              high: c.prices.high ?? c.prices.mid ?? c.prices.low
            };
          } else if (c.tcg?.prices) {
            priceObj = {
              low: c.tcg.prices.low ?? c.tcg.prices.mid ?? c.tcg.prices.high,
              mid: c.tcg.prices.mid ?? c.tcg.prices.low ?? c.tcg.prices.high,
              high: c.tcg.prices.high ?? c.tcg.prices.mid ?? c.tcg.prices.low
            };
          } else if (typeof c.marketPrice === 'number') {
            priceObj = { low: c.marketPrice, mid: c.marketPrice, high: c.marketPrice };
          }

          return {
            id,
            name: c.name || 'Unknown',
            image: normalizeImageUrl(rawImage),
            hp: c.hp || '',
            set: setName,
            rarity: c.rarity || '',
            price: priceObj as any,
            illustrator: c.illustrator || undefined,
            cardNumber: c.number || c.cardNumber || undefined,
            series: c.set?.series || c.series || undefined
          };
        });

        setFeaturedCards(normalized);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching featured cards:', err);
        if (mounted) setError(err.message ?? String(err));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchCards();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // load user's wishlist (pokemonTcgIds) so hearts reflect current state
  React.useEffect(() => {
    const loadWishlist = async () => {
      const user = authService.getUser();
      if (!user || !authService.isAuthenticated()) return;
      try {
        const base = 'http://localhost:3000';
        const resp = await fetch(`${base}/users/${user.username}/cards?collection=wishlist`, {
          headers: { ...authService.getAuthHeaders(), 'Content-Type': 'application/json' }
        });
        if (!resp.ok) return;
        const payload = await resp.json();
        const ids = new Set<string>();
        const cards = payload.cards || payload.results || [];
        for (const item of cards) {
          if (item.pokemonTcgId) ids.add(item.pokemonTcgId);
          else if (item.cardId && item.cardId.pokemonTcgId) ids.add(item.cardId.pokemonTcgId);
        }
        setWishlistSet(ids);
      } catch (e) {
        // ignore
      }
    };

    loadWishlist();
  }, [featuredCards]);

  const tripleList = React.useMemo(() => {
    if (!featuredCards || featuredCards.length <= 1) return featuredCards;
    return [...featuredCards, ...featuredCards, ...featuredCards];
  }, [featuredCards]);

  const PokemonCard = ({ card }: { card: Card }) => {
    const [isFlipped, setIsFlipped] = React.useState(false);
    const [isFavorite, setIsFavorite] = React.useState(false);
  const dispatch = useDispatch<AppDispatch>();

    React.useEffect(() => {
      setIsFavorite(wishlistSet.has(card.id));
    }, [wishlistSet, card.id]);

    return (
      <div
        className="relative featured-card"
        onMouseEnter={() => setIsFlipped(true)}
        onMouseLeave={() => setIsFlipped(false)}
      >
        <div className="relative w-full">
          {!isFlipped ? (
            <div className="pokemon-card overflow-hidden cursor-pointer">
              <img
                src={card.image}
                alt={card.name}
                className="pokemon-card-image"
              />
              {/* overlay with name, type and rarity */}
              <div className="absolute left-0 right-0 bottom-0 p-3 bg-linear-to-t from-black/70 to-transparent text-white">
                <div className="flex justify-between items-center">
                  <div className="text-sm font-semibold truncate">{card.name}</div>
                  <div className="text-xs opacity-90">{card.rarity || '—'}</div>
                </div>
                <div className="mt-1 text-xs opacity-80">{card.set || '—'}</div>
              </div>
              
            </div>
          ) : (
            <div className="pokemon-card-back text-gray-100 dark:bg-gray-800 p-4 min-h-80">
              {/* heart button moved to back side so it is clickable when flipped */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const user = authService.getUser();
                  if (!user || !authService.isAuthenticated()) {
                    window.alert(t('common.mustLoginWishlist'));
                    return;
                  }

                  const next = !isFavorite;
                  setIsFavorite(next);

                  if (next) {
                    const promise = dispatch(addToWishlist({ userId: user.username || user.id, cardId: card.id } as any));
                    // update local wishlist set on success, rollback on failure
                    promise.then((res: any) => {
                      if (res?.meta?.requestStatus === 'fulfilled') {
                        setWishlistSet((prev) => new Set(prev).add(card.id));
                      } else {
                        setIsFavorite(false);
                      }
                    }).catch(() => setIsFavorite(false));
                  } else {
                    const promise = dispatch(removeFromWishlist({ userId: user.username || user.id, cardId: card.id } as any));
                    promise.then((res: any) => {
                      if (res?.meta?.requestStatus === 'fulfilled') {
                        setWishlistSet((prev) => {
                          const copy = new Set(prev);
                          copy.delete(card.id);
                          return copy;
                        });
                      } else {
                        // rollback
                        setIsFavorite(true);
                      }
                    }).catch(() => setIsFavorite(true));
                  }
                }}
                className="absolute top-2 right-2 bg-white rounded-full p-2 shadow-lg hover:scale-110 transition-transform z-30"
              >
                <span className={`text-2xl ${isFavorite ? '❤️' : '🤍'}`}>
                  {isFavorite ? '❤️' : '🤍'}
                </span>
              </button>
              <div className="h-full flex flex-col justify-between">
                <div>
                  <h3 className="text-2xl font-bold mb-4 text-center text-gray-800 dark:text-gray-100">{card.name}</h3>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-blue-50 dark:bg-gray-700 rounded-lg p-3">
                      <div className="text-xs text-gray-600 dark:text-gray-300">{t('common.rarity')}</div>
                      <div className="font-semibold text-gray-600 dark:text-gray-100">{card.rarity || '—'}</div>
                    </div>
                    <div className="bg-blue-50 dark:bg-gray-700 rounded-lg p-3">
                      <div className="text-xs text-gray-600 dark:text-gray-300">{t('common.set')}</div>
                      <div className="font-semibold text-gray-600 dark:text-gray-100">{card.set || '—'}</div>
                    </div>
                    <div className="bg-blue-50 dark:bg-gray-700 rounded-lg p-3">
                      <div className="text-xs text-gray-600 dark:text-gray-300">{t('common.hp')}</div>
                      <div className="font-semibold text-gray-600 dark:text-gray-100">{card.hp || '—'}</div>
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
                    <div className="text-sm text-gray-700 dark:text-gray-300">Ilustrador: {card.illustrator || '—'}</div>
                  </div>
                </div>

                <div>
                  <div className="space-y-3">
                    <div className="bg-blue-50 dark:bg-gray-700 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between items-center pt-2 border-t border-blue-200 dark:border-gray-600">
                        <span className="font-bold text-lg text-gray-800 dark:text-gray-100">Precio:</span>
                        <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{card.price?.mid ? `${Number(card.price.mid).toFixed(2)}€` : '—'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const scrollByCard = (direction: "next" | "prev") => {
    const container = containerRef.current;
    const track = trackRef.current;
    if (!container || !track) return;

    const firstCard = track.querySelector<HTMLElement>(".featured-card");
    if (!firstCard) return;

    const gap = 24;
    const cardWidth = firstCard.offsetWidth + gap;

    container.scrollBy({
      left: direction === "next" ? cardWidth : -cardWidth,
      behavior: "smooth",
    });
  };

  React.useEffect(() => {
    if (!featuredCards || featuredCards.length <= 1) return;
    const id = setInterval(() => scrollByCard("next"), 5000);
    return () => clearInterval(id);
  }, [featuredCards]);

  React.useEffect(() => {
    const container = containerRef.current;
    const track = trackRef.current;
    if (!container || !track) return;

    if (!featuredCards || featuredCards.length <= 1) return;

    const timer = setTimeout(() => {
      const singleWidth = track.scrollWidth / 3;
      container.scrollLeft = singleWidth;
    }, 150);

    return () => clearTimeout(timer);
  }, [tripleList, featuredCards]);

  return (
    <section className="featured-wrapper">
      {/* TÍTULO */}
      <div className="text-center mb-8">
        <h2 className="featured-title">{t("featured.title")}</h2>
      </div>

      {/* CONTENEDOR FULL WIDTH */}
      <div className="featured-inner">
        <div ref={containerRef} className="overflow-x-auto no-scrollbar">
          <div ref={trackRef} className="featured-slider">
            {tripleList.map((card, i) => (
              <PokemonCard key={`${card.id}-${i}`} card={card} />
            ))}
          </div>
        </div>

        {/* BOTONES */}
        <button
          onClick={() => scrollByCard("prev")}
          className="slider-button slider-button-left"
        >
          <ChevronLeft className="w-6 h-6 text-gray-700" />
        </button>

        <button
          onClick={() => scrollByCard("next")}
          className="slider-button slider-button-right"
        >
          <ChevronRight className="w-6 h-6 text-gray-700" />
        </button>
      </div>
    </section>
  );
};

export default FeaturedCards;
