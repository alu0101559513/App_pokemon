import React from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { useFormInput, useLoadingError } from '../hooks';
import { useTranslation } from 'react-i18next';
import '../styles/auth-modal.css';

interface SignInFormProps {
  onSwitch?: () => void;
}

const SignInForm: React.FC<SignInFormProps> = ({ onSwitch }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { values: formData, handleChange } = useFormInput({
    username: '',
    password: '',
  });
  const { loading, error, startLoading, stopLoading, handleError, clearError } = useLoadingError();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    startLoading();

    try {
      const response = await authService.login(formData);
      authService.saveUser(response.user);
      if (response.token) authService.saveToken(response.token);
      navigate('/home');
    } catch (err) {
      handleError(err);
    } finally {
      stopLoading();
    }
  };

  return (
    <>
      <h2 className="text-4xl font-bold text-sky-700 mb-4 text-center">
        {t('signIn.title', 'Sign In')}
      </h2>

      <p className="text-gray-500 mb-10 text-center text-lg">
        {t('signIn.subtitle', 'Access your account to explore more.')}
      </p>

      <form
        className="w-full flex flex-col items-center gap-5"
        onSubmit={handleSubmit}
      >
        {error && (
          <div className="w-4/5 p-3 bg-red-50 border border-red-300 text-red-700 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        {/* Username */}
        <div className="w-4/5 flex flex-col">
          <label className="text-base font-semibold mb-2 ml-1">
            {t('signIn.usernameLabel', 'Username')}
          </label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={(e) => {
              handleChange(e);
              clearError();
            }}
            placeholder={t('signIn.usernamePlaceholder', 'Enter your username')}
            className="px-4 py-2.5 border rounded-lg"
          />
        </div>

        {/* Password */}
        <div className="w-4/5 flex flex-col">
          <label className="text-base font-semibold mb-2 ml-1">
            {t('signIn.passwordLabel', 'Password')}
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={(e) => {
              handleChange(e);
              clearError();
            }}
            placeholder={t('signIn.passwordPlaceholder', 'Enter your password')}
            className="px-4 py-2.5 border rounded-lg"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-4/5 mt-6 bg-linear-to-r from-sky-600 to-blue-600 text-white font-semibold py-3 rounded-lg disabled:opacity-50"
        >
          {loading
            ? t('signIn.loadingButton', 'Loading...')
            : t('signIn.signInButton', 'Sign In')}
        </button>
      </form>

      {onSwitch && (
        <button
          type="button"
          onClick={onSwitch}
          className="mt-8 text-sm font-semibold text-sky-600 hover:underline text-center w-full"
        >
          {t('signUp.haveAccount', 'Already have an account?')}{' '}
          {t('signUp.signIn', 'Sign In')}
        </button>
      )}
    </>
  );
};

export default SignInForm;
