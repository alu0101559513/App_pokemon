import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/authService";
import { useTranslation } from "react-i18next";
import "../styles/form.css";

const SignUpForm: React.FC = () => {
  const { t } = useTranslation();

  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError(null); // Limpia el error cuando el usuario empieza a escribir
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await authService.register(formData);
      // Registro exitoso - redirige a login
      navigate("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-background">
      {/* Formulario*/}
      <div className="relative z-10 w-full max-w-lg bg-white rounded-3xl shadow-2xl p-12 border border-sky-100 flex flex-col items-center dark:bg-gray-800 dark:border-gray-700">
        <h2 className="text-4xl font-bold text-sky-700 mb-3 text-center dark:text-sky-400">
          {t("signUp.titulo")}
        </h2>

        <p className="text-gray-500 mb-10 text-center text-lg dark:text-gray-400">
          {t("signUp.subtitulo")}
        </p>

        <form className="w-full flex flex-col items-center gap-5" onSubmit={handleSubmit}>
          
          {/* Username */}
          <div className="w-4/5 flex flex-col">
            <label className="text-base font-semibold text-gray-900 mb-2 ml-1 dark:text-gray-100">
              {t("signUp.usernameLabel")}
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              placeholder={t("signUp.usernamePlaceholder")}
              className="px-4 py-2.5 border border-sky-200 rounded-lg text-gray-800
                        focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-400 transition
                        dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
            />
          </div>

          {/* Email */}
          <div className="w-4/5 flex flex-col">
            <label className="text-base font-semibold text-gray-900 mb-2 ml-1 dark:text-gray-100">
              {t("signUp.emailLabel")}
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder={t("signUp.emailPlaceholder")}
              className="px-4 py-2.5 border border-sky-200 rounded-lg text-gray-800
                        focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-400 transition
                        dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
            />
          </div>

          {/* Password */}
          <div className="w-4/5 flex flex-col">
            <label className="text-base font-semibold text-gray-900 mb-2 ml-1">
              {t("signUp.passwordLabel")}
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder={t("signUp.passwordPlaceholder")}
              className="px-4 py-2.5 border border-sky-200 rounded-lg text-gray-800
                        focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-400 transition"
            />
          </div>

          {/* Confirm Password */}
          <div className="w-4/5 flex flex-col">
            <label className="text-base font-semibold text-gray-900 mb-2 ml-1">
              {t("signUp.confirmPasswordLabel")}
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              placeholder={t("signUp.confirmPasswordPlaceholder")}
              className="px-4 py-2.5 border border-sky-200 rounded-lg text-gray-800
                        focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-400 transition"
            />
          </div>

          {/* Botón */}
          <button
            type="submit"
            disabled={loading}
            className="w-4/5 mt-6 bg-linear-to-r from-sky-600 to-blue-600 text-white
                      font-semibold py-3 rounded-lg shadow-md hover:from-sky-700 hover:to-blue-700
                      transition text-base cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? t("signUp.botonCargando") : t("signUp.botonCrear")}
          </button>

        </form>

        {/* Enlace inferior */}
        <p className="text-gray-500 text-sm mt-10 text-center">
          {t("signUp.yaTengoCuenta")}{" "}
          <a href="/login" className="text-sky-600 font-semibold hover:underline">
            {t("signUp.iniciarSesion")}
          </a>
        </p>

      </div>
    </div>
  );
};

export default SignUpForm;
