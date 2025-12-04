import React from "react";
import { Settings } from "lucide-react";
import { useTranslation } from "react-i18next";
import NotificationBell from "./NotificationBell";
import LanguageSelector from "./LanguageSelector";
import DarkModeToggle from "./DarkModeToggle";

const AuthHeader: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <header className="bg-gradient-to-r from-sky-600 to-blue-500 shadow-lg fixed top-0 left-0 w-full z-40 dark:from-gray-800 dark:to-gray-900 dark:border-b dark:border-gray-700 transition-colors duration-300">
      <div className="flex items-center justify-between w-full px-8 py-4">
        
        {/*LOGO */}
        <div className="flex items-center gap-4">
          <img
            src="/logo.png"
            alt="AMI Logo"
            className="w-28 h-28 object-contain drop-shadow-lg"
          />
          <h1 className="text-white font-bold text-2xl tracking-wide dark:text-gray-100">
            CARDS AMI
          </h1>
        </div>

        {/* BOTONES + CONTROLES */}
        <div className="flex items-center gap-6">
          {/* Bloque de botones */}
          <div className="flex items-center gap-4">
            <a href="/login" className="CollectionButton text-sm">
              {t('header.iniciarSesion')}
            </a>
            <a href="/signup" className="CollectionButton text-sm">
              {t('header.crearCuenta')}
            </a>
          </div>

          {/* Nuevos controles: Idioma, Modo Oscuro */}
          <div className="flex items-center gap-2">
            <LanguageSelector />
            <DarkModeToggle />
          </div>
        </div>
      </div>
    </header>
  );
};

export default AuthHeader;
