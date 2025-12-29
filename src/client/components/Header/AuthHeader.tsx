import React from 'react';
import { useTranslation } from 'react-i18next';
import LanguageSelector from './LanguageSelector';
import DarkModeToggle from './DarkModeToggle';
import '../../styles/header.css';

interface AuthHeaderProps {
  onSignIn: () => void;
  onSignUp: () => void;
}

const AuthHeader: React.FC<AuthHeaderProps> = ({ onSignIn, onSignUp }) => {
  const { t } = useTranslation();

  return (
    <header className="siteHeader">
      <div className="siteHeader__inner">
        <div className="siteHeader__left">
          <a href="/" className="brand">
            <span className="brand__text brand__text--gradient">
              {t('header.brand')}
            </span>
          </a>
        </div>

        <div />

        <div className="siteHeader__right">
          <nav className="topNav topNav--auth">
            <button onClick={onSignIn} className="topNav__link" type="button">
              {t('header.signIn')}
            </button>

            <button
              onClick={onSignUp}
              className="topNav__link topNav__link--btn"
              type="button"
            >
              {t('header.signUp')}
            </button>
          </nav>

          <LanguageSelector />
          <DarkModeToggle />
        </div>
      </div>
    </header>
  );
};

export default AuthHeader;
