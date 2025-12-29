import React from 'react';
import { useTranslation } from 'react-i18next';
const Hero: React.FC = () => {
  const { t } = useTranslation();

  return (
    <section className="home-hero">
      <div className="home-hero-bg" />

      <div className="home-hero-content">
        <h1 className="home-hero-brand">CARDS AMI</h1>

        <p className="home-hero-tagline">
          {t(
            'hero.tagline',
            'Descubre el mundo Pokémon a través de nuestras cartas'
          )}
        </p>

        <div className="home-hero-actions">
          <a href="/discover" className="hero-btn hero-btn-primary">
            {t('hero.explore', 'Explorar cartas')}
          </a>
          <a href="/collection" className="hero-btn hero-btn-secondary">
            {t('hero.myCollection', 'Mi colección')}
          </a>
        </div>
      </div>
    </section>
  );
};

export default Hero;
