import React from 'react';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../store/store';
import { normalizeImageUrl } from '../utils/imageHelpers';
import { getCardImage } from '../utils/cardHelpers';
import { API_BASE_URL } from '../config/constants';
import {
  addToWishlist,
  removeFromWishlist,
} from '../features/whislist/whislistSlice';
import { authService } from '../services/authService';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLoadingError } from '../hooks';
import '../styles/feature.css';

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

  const [currentIndex, setCurrentIndex] = React.useState(0);
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const trackRef = React.useRef<HTMLDivElement | null>(null);

  const featuredIds = [
    'me01-178',
    'me01-180',
    'me02-125',
    'me02-129',
    'sv10.5b-166',
    'sv10.5b-172',
    'sv10.5w-173',
  ];

  const [featuredCards, setFeaturedCards] = React.useState<Card[]>([]);
  const { loading, error, startLoading, stopLoading, handleError } = useLoadingError(true);
  const [wishlistSet, setWishlistSet] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    let mounted = true;

    async function fetchCards() {
      startLoading();
      
      try {
        // Usar el nuevo endpoint /cards/featured que obtiene cartas directamente de TCGdex
        const resp = await fetch(`${API_BASE_URL}/cards/featured`);
        if (!resp.ok) {
          throw new Error(`Failed to fetch featured cards: ${resp.statusText}`);
        }
        
        const data = await resp.json();
        const cards = data.data || data;
        
        if (!mounted) return;

        const normalized: Card[] = cards
          .filter((c: any) => c != null)
          .map((c: any) => {
            const id = c.pokemonTcgId || c._id || c.id || '';
            
            // Usar helper para obtener la mejor imagen disponible
            const rawImage = getCardImage(
              c.images,
              id,
              c.imageUrl || c.image
            );

          const setName =
            c.set?.name || c.set?.series || c.set || c.series || '';

          let priceObj:
            | { low?: number; mid?: number; high?: number }
            | undefined = undefined;
          if (c.price) {
            priceObj = {
              low:
                c.price.cardmarketAvg ??
                c.price.tcgplayerMarketPrice ??
                undefined,
              mid:
                c.price.avg ??
                c.price.tcgplayerMarketPrice ??
                c.price.cardmarketAvg ??
                undefined,
              high:
                c.price.cardmarketAvg ??
                c.price.tcgplayerMarketPrice ??
                undefined,
            };
          } else if (c.prices) {
            priceObj = {
              low: c.prices.low ?? c.prices.mid ?? c.prices.high,
              mid: c.prices.mid ?? c.prices.low ?? c.prices.high,
              high: c.prices.high ?? c.prices.mid ?? c.prices.low,
            };
          } else if (c.tcg?.prices) {
            priceObj = {
              low: c.tcg.prices.low ?? c.tcg.prices.mid ?? c.tcg.prices.high,
              mid: c.tcg.prices.mid ?? c.tcg.prices.low ?? c.tcg.prices.high,
              high: c.tcg.prices.high ?? c.tcg.prices.mid ?? c.tcg.prices.low,
            };
          } else if (typeof c.marketPrice === 'number') {
            priceObj = {
              low: c.marketPrice,
              mid: c.marketPrice,
              high: c.marketPrice,
            };
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
            series: c.set?.series || c.series || undefined,
          };
        });

        setFeaturedCards(normalized);
      } catch (err: any) {
        console.error('Error fetching featured cards:', err);
        if (mounted) handleError(err);
      } finally {
        if (mounted) stopLoading();
      }
    }

    fetchCards();
    return () => {
      mounted = false;
    };
  }, []);

  React.useEffect(() => {
    const loadWishlist = async () => {
      const user = authService.getUser();
      if (!user || !authService.isAuthenticated()) return;
      try {
        const resp = await fetch(
          `${API_BASE_URL}/users/${user.username}/cards?collection=wishlist`,
          {
            headers: {
              ...authService.getAuthHeaders(),
              'Content-Type': 'application/json',
            },
          }
        );
        if (!resp.ok) return;
        const payload = await resp.json();
        const ids = new Set<string>();
        const cards = payload.cards || payload.results || [];
        for (const item of cards) {
          if (item.pokemonTcgId) ids.add(item.pokemonTcgId);
          else if (item.cardId && item.cardId.pokemonTcgId)
            ids.add(item.cardId.pokemonTcgId);
        }
        setWishlistSet(ids);
      } catch (e) {}
    };

    loadWishlist();
  }, [featuredCards]);

  const tripleList = React.useMemo(() => {
    if (!featuredCards || featuredCards.length <= 1) return featuredCards;
    return [...featuredCards, ...featuredCards, ...featuredCards];
  }, [featuredCards]);

  const scrollToIndex = (index: number) => {
    const container = containerRef.current;
    const track = trackRef.current;
    if (!container || !track) return;
    const firstCard = track.querySelector<HTMLElement>('.featured-card');
    if (!firstCard) return;
    const gap = 24;
    const cardWidth = firstCard.offsetWidth + gap;
    const left = index * cardWidth;
    container.scrollTo({ left, behavior: 'smooth' });
  };

  const scrollByCard = (direction: 'next' | 'prev') => {
    if (!tripleList || tripleList.length === 0) return;
    const nextIndex =
      direction === 'next'
        ? (currentIndex + 1) % tripleList.length
        : (currentIndex - 1 + tripleList.length) % tripleList.length;
    setCurrentIndex(nextIndex);
    scrollToIndex(nextIndex);
  };

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
              <div className="absolute left-0 right-0 bottom-0 p-3 bg-linear-to-t from-black/70 to-transparent text-white">
                <div className="flex justify-between items-center">
                  <div className="text-sm font-semibold truncate">
                    {card.name}
                  </div>
                  <div className="text-xs opacity-90">{card.rarity || '—'}</div>
                </div>
                <div className="mt-1 text-xs opacity-80">{card.set || '—'}</div>
              </div>
            </div>
          ) : (
            <div className="pokemon-card-back text-gray-100 dark:bg-gray-800 p-4">
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
                    const promise = dispatch(
                      addToWishlist({
                        userId: user.username || user.id,
                        cardId: card.id,
                      } as any)
                    );
                    promise
                      .then((res: any) => {
                        if (res?.meta?.requestStatus === 'fulfilled') {
                          setWishlistSet((prev) => new Set(prev).add(card.id));
                        } else {
                          setIsFavorite(false);
                        }
                      })
                      .catch(() => setIsFavorite(false));
                  } else {
                    const promise = dispatch(
                      removeFromWishlist({
                        userId: user.username || user.id,
                        cardId: card.id,
                      } as any)
                    );
                    promise
                      .then((res: any) => {
                        if (res?.meta?.requestStatus === 'fulfilled') {
                          setWishlistSet((prev) => {
                            const copy = new Set(prev);
                            copy.delete(card.id);
                            return copy;
                          });
                        } else {
                          setIsFavorite(true);
                        }
                      })
                      .catch(() => setIsFavorite(true));
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
                  <h3 className="text-2xl font-bold mb-4 text-center text-gray-800 dark:text-gray-100">
                    {card.name}
                  </h3>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-blue-50 dark:bg-gray-700 rounded-lg p-3">
                      <div className="text-xs text-gray-600 dark:text-gray-300">
                        {t('common.rarity', 'Rarity')}
                      </div>
                      <div className="font-semibold text-gray-600 dark:text-gray-100">
                        {card.rarity || '—'}
                      </div>
                    </div>
                    <div className="bg-blue-50 dark:bg-gray-700 rounded-lg p-3">
                      <div className="text-xs text-gray-600 dark:text-gray-300">
                        {t('common.set', 'Set')}
                      </div>
                      <div className="font-semibold text-gray-600 dark:text-gray-100">
                        {card.set || '—'}
                      </div>
                    </div>
                    <div className="bg-blue-50 dark:bg-gray-700 rounded-lg p-3">
                      <div className="text-xs text-gray-600 dark:text-gray-300">
                        {t('common.hp', 'HP')}
                      </div>
                      <div className="font-semibold text-gray-600 dark:text-gray-100">
                        {card.hp || '—'}
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      {t('common.illustrator', 'Illustrator')}:{' '}
                      {card.illustrator || '—'}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="space-y-3">
                    <div className="bg-blue-50 dark:bg-gray-700 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between items-center pt-2 border-t border-blue-200 dark:border-gray-600">
                        <span className="font-bold text-lg text-gray-800 dark:text-gray-100">
                          {t('common.price', 'Price')}:
                        </span>
                        <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {card.price?.mid
                            ? `${Number(card.price.mid).toFixed(2)}€`
                            : '—'}
                        </span>
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

  React.useEffect(() => {
    if (!tripleList || tripleList.length <= 1) return;
    const id = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = (prev + 1) % tripleList.length;
        scrollToIndex(next);
        return next;
      });
    }, 5000);
    return () => clearInterval(id);
  }, [tripleList]);

  React.useEffect(() => {
    if (!featuredCards || featuredCards.length <= 1) return;
    setCurrentIndex(0);
    setTimeout(() => scrollToIndex(0), 150);
  }, [tripleList, featuredCards]);

  return (
    <section className="featured-wrapper">
      <div className="text-center mb-8">
        <h2 className="featured-heading">
          {t('featured.title', 'Featured Cards')}
        </h2>
        <p className="featured-description">
          {t(
            'featured.description',
            'A selection of popular cards among collectors.'
          )}
        </p>
      </div>

      <div className="featured-inner">
        <div ref={containerRef} className="overflow-x-auto no-scrollbar">
          <div ref={trackRef} className="featured-slider">
            {tripleList.map((card, i) => (
              <PokemonCard key={`${card.id}-${i}`} card={card} />
            ))}
          </div>
        </div>

        <button
          onClick={() => scrollByCard('prev')}
          className="slider-button slider-button-left"
        >
          <ChevronLeft className="w-6 h-6 text-gray-700" />
        </button>

        <button
          onClick={() => scrollByCard('next')}
          className="slider-button slider-button-right"
        >
          <ChevronRight className="w-6 h-6 text-gray-700" />
        </button>
      </div>
    </section>
  );
};

export default FeaturedCards;
