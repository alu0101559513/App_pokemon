import React, { useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { RootState } from '../../store/store';
import { setDarkMode } from '../../features/preferences/preferencesSlice';

const DarkModeToggle: React.FC = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const darkMode = useSelector((state: RootState) => state.preferences.preferences.darkMode);

  // Aplicar la clase 'dark' al inicializar y cuando cambia darkMode
  useEffect(() => {
    const htmlElement = document.documentElement;
    if (darkMode) {
      htmlElement.classList.add('dark');
      document.body.style.colorScheme = 'dark';
    } else {
      htmlElement.classList.remove('dark');
      document.body.style.colorScheme = 'light';
    }
  }, [darkMode]);

  // Inicializar al cargar el componente
  useEffect(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved === 'true') {
      dispatch(setDarkMode(true));
    }
  }, [dispatch]);

  const handleToggle = () => {
    const newMode = !darkMode;
    dispatch(setDarkMode(newMode));
    localStorage.setItem('darkMode', String(newMode));
  };

  return (
    <button
      onClick={handleToggle}
      aria-label={darkMode ? t('darkMode.light') : t('darkMode.dark')}
      className="p-2 hover:bg-white/20 rounded-full transition"
    >
      {darkMode ? (
        <Sun className="w-6 h-6 sm:w-7 sm:h-7 text-yellow-300" />
      ) : (
        <Moon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
      )}
    </button>
  );
};

export default DarkModeToggle;
