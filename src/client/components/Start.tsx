import React from 'react';
import { useTranslation } from 'react-i18next';

interface StartProps {
  onStart?: () => void;
}

const Start: React.FC<StartProps> = ({ onStart }) => {
  const { t } = useTranslation();

  return (
    <section
      className="
        flex flex-col items-center
        px-6 py-20
        text-gray-900 dark:text-gray-100

        bg-[radial-gradient(900px_500px_at_50%_-200px,rgba(48,120,211,0.06),transparent_60%)]
        dark:bg-[radial-gradient(900px_500px_at_50%_-200px,rgba(48,120,211,0.10),transparent_60%)]
      "
    >
      <div className="flex flex-col items-center justify-center gap-20 max-w-6xl w-full">
        <div className="flex flex-col items-center gap-6 text-center">
          <img
            src="/logo.png"
            alt="Cards AMI Logo"
            className="w-48 drop-shadow-lg"
          />

          <h1 className="text-5xl md:text-6xl font-extrabold text-sky-700 dark:text-sky-400">
            {t('start.title', 'Welcome to Cards AMI')}
          </h1>

          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl">
            {t(
              'start.subtitle',
              'Collect, trade, and explore the world of Pokémon cards.'
            )}
          </p>

          <button
            onClick={onStart}
            className="
              mt-2
              bg-gradient-to-r
              from-sky-600
              to-blue-600
              text-white
              font-extrabold
              py-4 px-14
              rounded-lg
              border border-[rgba(212,175,55,0.45)]
              shadow-[0_10px_22px_rgba(48,120,211,0.35)]
              hover:from-sky-700 hover:to-blue-700
              hover:shadow-[0_12px_26px_rgba(212,175,55,0.25)]
              active:scale-[0.98]
              transition
              text-lg
            "
          >
            {t('start.getStarted', 'Get Started')}
          </button>
        </div>

        <div className="grid sm:grid-cols-1 md:grid-cols-3 gap-8 w-full px-6">
          <div
            className="
              bg-white rounded-2xl p-8 text-center
              border border-sky-100
              shadow-md hover:shadow-lg transition
              dark:bg-gray-800 dark:border-gray-700
            "
          >
            <h3 className="text-xl font-bold text-sky-700 mb-3 dark:text-sky-400">
              {t('start.collect', 'Collect')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {t(
                'start.collectDesc',
                'Build your collection of Pokémon cards.'
              )}
            </p>
          </div>

          <div
            className="
              bg-white rounded-2xl p-8 text-center
              border border-sky-100
              shadow-md hover:shadow-lg transition
              dark:bg-gray-800 dark:border-gray-700
            "
          >
            <h3 className="text-xl font-bold text-sky-700 mb-3 dark:text-sky-400">
              {t('start.trade', 'Trade')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {t('start.tradeDesc', 'Exchange cards with other collectors.')}
            </p>
          </div>

          <div
            className="
              bg-white rounded-2xl p-8 text-center
              border border-sky-100
              shadow-md hover:shadow-lg transition
              dark:bg-gray-800 dark:border-gray-700
            "
          >
            <h3 className="text-xl font-bold text-sky-700 mb-3 dark:text-sky-400">
              {t('start.explore', 'Explore')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {t('start.exploreDesc', 'Discover rare and unique cards.')}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Start;
