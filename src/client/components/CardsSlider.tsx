import React from 'react';
import { normalizeImageUrl } from '../utils/imageHelpers';
import '../styles/feature.css';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SimpleCard {
  id: string;
  name?: string;
  image?: string;
  rarity?: string;
  price?: { mid?: number } | null;
}

const CardsSlider: React.FC<{ title?: string; cards: SimpleCard[] }> = ({
  title,
  cards,
}) => {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const trackRef = React.useRef<HTMLDivElement | null>(null);

  const displayCards = React.useMemo(() => cards || [], [cards]);

  const CardView = ({ card }: { card: SimpleCard }) => (
    <div className="relative featured-card">
      <div className="relative w-full">
        <div className="pokemon-card overflow-hidden cursor-pointer">
          <img
            src={normalizeImageUrl(card.image)}
            alt={card.name}
            className="pokemon-card-image"
          />
          <div className="absolute left-0 right-0 bottom-0 p-3 bg-linear-to-t from-black/70 to-transparent text-white">
            <div className="flex justify-between items-center">
              <div className="text-sm font-semibold truncate">{card.name}</div>
              <div className="text-xs opacity-90">{card.rarity || '—'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const [currentIndex, setCurrentIndex] = React.useState(0);

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
    if (!displayCards || displayCards.length === 0) return;
    const nextIndex =
      direction === 'next'
        ? (currentIndex + 1) % displayCards.length
        : (currentIndex - 1 + displayCards.length) % displayCards.length;
    setCurrentIndex(nextIndex);
    scrollToIndex(nextIndex);
  };

  React.useEffect(() => {
    if (!displayCards || displayCards.length <= 1) return;
    const id = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = (prev + 1) % displayCards.length;
        scrollToIndex(next);
        return next;
      });
    }, 5000);
    return () => clearInterval(id);
  }, [displayCards]);

  React.useEffect(() => {
    setCurrentIndex(0);
    setTimeout(() => scrollToIndex(0), 100);
  }, [displayCards]);

  return (
    <section className="featured-wrapper">
      {title && (
        <div className="text-center mb-4">
          <h2 className="featured-title">{title}</h2>
        </div>
      )}
      <div className="featured-inner">
        <div ref={containerRef} className="overflow-x-auto no-scrollbar">
          <div ref={trackRef} className="featured-slider">
            {displayCards.map((c, i) => (
              <CardView key={`${c.id}-${i}`} card={c} />
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

export default CardsSlider;
