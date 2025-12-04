import React from 'react';
import { useTranslation } from 'react-i18next';

const Hero: React.FC = () => {
  const { t } = useTranslation();

  return (
    <section className="container mx-auto px-6 py-12">
      <div className="flex items-center justify-between gap-12">
        {/* Texto izquierdo */}
        <div className="flex-1 margin-left=10">
          <h1 className="hero-text">CARDS AMI</h1>
        </div>
    
        {/* Logo central */}
        <div className="flex-1 flex justify-center">
          <img 
            src="/logo.png" 
            alt="AMI Logo" 
            className="hero-logo"
          />
        </div>

        {/* Texto derecho */}
        <div className="flex-1 flex justify-end">
          <h1 className="text-5xl font-extrabold text-sky-700 text-center dark:text-sky-400">
            {t("start.titulo")}
          </h1>
        </div>
      </div>
    </section>
  );
};

export default Hero;