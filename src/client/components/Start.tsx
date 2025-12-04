import React from "react";
import { useTranslation } from "react-i18next";

const Start: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-sky-50 flex flex-col items-center text-gray-900 px-6 py-16 dark:bg-gray-900 dark:text-gray-100">
      <div className="flex-1 flex flex-col items-center justify-center gap-16 max-w-6xl w-full">
        {/* Logo y Slogan */}
        <div className="flex flex-col items-center gap-8">
          <img
            src="/logo.png"
            alt="Cards AMI Logo"
            className="w-56 drop-shadow-lg"
          />
          <h1 className="text-5xl font-extrabold text-sky-700 text-center dark:text-sky-400">
            {t("start.titulo")}
          </h1>
          <p className="text-lg text-gray-600 text-center max-w-2xl dark:text-gray-400">
            {t("start.subtitulo")}
          </p>
        </div>

        {/* Secciones de características */}
        <div className="grid sm:grid-cols-1 md:grid-cols-3 gap-8 w-full px-6">
          {/* Colecciona */}
          <div className="bg-white rounded-2xl shadow-md p-8 border border-sky-100 text-center hover:shadow-lg transition dark:bg-gray-800 dark:border-gray-700">
            <h3 className="text-xl font-bold text-sky-700 mb-3 dark:text-sky-400">
              {t("start.colecciona")}
            </h3>
            <p className="text-gray-600 text-base dark:text-gray-400">
              {t("start.coleccionaDesc")}
            </p>
          </div>

          {/* Intercambia */}
          <div className="bg-white rounded-2xl shadow-md p-8 border border-sky-100 text-center hover:shadow-lg transition dark:bg-gray-800 dark:border-gray-700">
            <h3 className="text-xl font-bold text-sky-700 mb-3 dark:text-sky-400">
              {t("start.intercambia")}
            </h3>
            <p className="text-gray-600 text-base dark:text-gray-400">
              {t("start.intercambiaDesc")}
            </p>
          </div>

          {/* Explora */}
          <div className="bg-white rounded-2xl shadow-md p-8 border border-sky-100 text-center hover:shadow-lg transition dark:bg-gray-800 dark:border-gray-700">
            <h3 className="text-xl font-bold text-sky-700 mb-3 dark:text-sky-400">
              {t("start.explora")}
            </h3>
            <p className="text-gray-600 text-base dark:text-gray-400">
              {t("start.exploraDesc")}
            </p>
          </div>
        </div>

        {/* Botón principal */}
        <a
          href="/signup"
          className="inline-block bg-gradient-to-r from-sky-600 to-blue-600 text-white font-semibold py-4 px-12 rounded-lg shadow-md hover:from-sky-700 hover:to-blue-700 transition text-lg"
        >
          {t("start.empezar")}
        </a>
      </div>
    </div>
  );
};

export default Start;