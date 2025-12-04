import React, { useState } from 'react';
import { Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { setLanguage } from '../../features/preferences/preferencesSlice';

const LanguageSelector: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { i18n, t } = useTranslation();
  const dispatch = useDispatch();

  const handleLanguageChange = (newLanguage: 'es' | 'en') => {
    i18n.changeLanguage(newLanguage);
    dispatch(setLanguage(newLanguage));
    setIsOpen(false);
    localStorage.setItem('language', newLanguage);
  };

  return (
    <div className="relative">
      <button
        aria-label={t('common.languageSelector')}
        className="p-2 hover:bg-white/20 rounded-full transition"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Globe className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
      </button>

      {isOpen && (
        <div className="language-dropdown absolute right-0 mt-2 w-40 bg-white dark:bg-slate-800 rounded-lg shadow-2xl z-[9999] border border-gray-200 dark:border-gray-700 overflow-hidden">
          <button
            onClick={() => handleLanguageChange('es')}
            className={`w-full text-left px-4 py-3 text-sm font-medium transition border-b border-gray-100 dark:border-gray-700 ${
              i18n.language === 'es'
                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'
            }`}
          >
            🇪🇸 Español
          </button>
          <button
            onClick={() => handleLanguageChange('en')}
            className={`w-full text-left px-4 py-3 text-sm font-medium transition ${
              i18n.language === 'en'
                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'
            }`}
          >
            🇺🇸 English
          </button>
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
