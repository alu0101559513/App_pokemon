import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/authService";
import { useTranslation } from "react-i18next";
import "../styles/form.css";

const SignInForm: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await authService.login(formData);

      authService.saveUser(response.user);
      if (response.token) authService.saveToken(response.token);

      navigate("/home");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-background pt-24 pb-12">
      <div className="relative z-10 w-[520px] bg-white rounded-3xl shadow-2xl px-12 pt-16 pb-12 border border-sky-100 flex flex-col items-center">

        <h2 className="text-4xl font-bold text-sky-700 mb-6 text-center">
          {t("signIn.titulo")}
        </h2>

        <p className="text-gray-500 mb-12 text-center text-lg">
          {t("signIn.subtitulo")}
        </p>

        <form className="w-full flex flex-col items-center gap-5" onSubmit={handleSubmit}>
          {error && (
            <div className="w-4/5 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm text-center">
              {error}
            </div>
          )}

          {/* Username */}
          <div className="w-4/5 flex flex-col">
            <label className="text-base font-semibold text-gray-900 mb-2 ml-1">
              {t("signIn.usernameLabel")}
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              placeholder={t("signIn.usernamePlaceholder")}
              className="px-4 py-2.5 border border-sky-200 rounded-lg text-gray-800 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-400 transition"
            />
          </div>

          {/* Password */}
          <div className="w-4/5 flex flex-col">
            <label className="text-base font-semibold text-gray-900 mb-2 ml-1">
              {t("signIn.passwordLabel")}
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder={t("signIn.passwordPlaceholder")}
              className="px-4 py-2.5 border border-sky-200 rounded-lg text-gray-800 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-400 transition"
            />
          </div>

          {/* Botón */}
          <button
            type="submit"
            disabled={loading}
            className="w-4/5 mt-6 bg-linear-to-r from-sky-600 to-blue-600 text-white font-semibold py-3 rounded-lg shadow-md hover:from-sky-700 hover:to-blue-700 transition text-base cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? t("signIn.botonCargando") : t("signIn.botonEntrar")}
          </button>
        </form>

        {/* Enlace inferior */}
        <p className="text-gray-500 text-sm mt-10 text-center">
          {t("signIn.noCuenta")}{" "}
          <a href="/signup" className="text-sky-600 font-semibold hover:underline">
            {t("signIn.registrate")}
          </a>
        </p>
      </div>
    </div>
  );
};

export default SignInForm;
