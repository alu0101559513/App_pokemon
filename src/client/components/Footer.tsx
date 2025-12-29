import React from 'react';
import { useTranslation } from 'react-i18next';
import { Instagram, Youtube } from 'lucide-react';

const Footer: React.FC = () => {
  const { t } = useTranslation();

  return (
    <footer className="footer-bg text-center text-[12px] pt-5 pb-4 leading-tight m-0">
      <div className="mx-auto px-4">
        <div className="footer-grid">
          <div>
            <div>
              <h3 className="footer-title footer-title-center">
                {t('footer.redes', 'Redes Sociales')}
              </h3>

              <div className="footer-links footer-links-center">
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-link footer-link-center"
                >
                  <Instagram className="w-5 h-5" />
                  <span>{t('footer.instagram', 'Instagram')}</span>
                </a>

                <a
                  href="https://tiktok.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-link footer-link-center"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02c.08 1.53.63 3.09 1.75 4.17c1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97c-.57-.26-1.1-.59-1.62-.93c-.01 2.92.01 5.84-.02 8.75c-.08 1.4-.54 2.79-1.35 3.94c-1.31 1.92-3.58 3.17-5.91 3.21c-2.43.05-4.85-.38-6.75-1.77c-2.05-1.5-3.08-3.96-3.16-6.46c-.09-2.65.43-5.27 1.92-7.12c1.86-2.26 4.7-3.54 7.61-3.54c.31 0 .65.01 .96.02v4.03c-.31-.01-.62-.02-.93-.02c-1.52 0-2.98.57-4.09 1.65c-1.11 1.08-1.7 2.58-1.65 4.17c.04 1.48.59 2.92 1.61 4.03c1.02 1.11 2.38 1.69 3.84 1.73c.04 0 .08.01 .12.01c1.48 0 2.9-.59 3.91-1.69c1.02-1.1 1.58-2.56 1.58-4.08c-.01-2.93-.01-5.84-.01-8.77z" />
                  </svg>
                  <span>{t('footer.tiktok', 'TikTok')}</span>
                </a>

                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-link footer-link-center"
                >
                  <Youtube className="w-5 h-5" />
                  <span>{t('footer.youtube', 'YouTube')}</span>
                </a>
              </div>
            </div>
          </div>

          <div>
            <h3 className="footer-title">{t('footer.contacto', 'Contacto')}</h3>

            <div className="footer-links">
              <p className="text-sm mb-1">{t('footer.email')}:</p>
              <a
                href="https://mail.google.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-link-email"
              >
                cardsami@gmail.com
              </a>
            </div>
          </div>
          <div className="text-center place-self-center">
            <p className="footer-link-simple">
              {t('footer.derechos', 'Todos los derechos reservados.')}
            </p>
          </div>

          <div>
            <h3 className="footer-title">
              {t('footer.aspectosLegales', 'Aspectos Legales')}
            </h3>
            <div className="footer-links">
              <a href="/privacidad" className="footer-link-simple">
                {t('footer.privacidad', 'Política de Privacidad')}
              </a>
              <a href="/terminos" className="footer-link-simple">
                {t('footer.terminos', 'Términos y Condiciones')}
              </a>
              <a href="/aviso-legal" className="footer-link-simple">
                {t('footer.avisoLegal', 'Aviso Legal')}
              </a>
            </div>
          </div>

          <div>
            <h3 className="footer-title">
              {t('footer.accesibilidad', 'Accesibilidad')}
            </h3>
            <div className="footer-links">
              <a href="/accesibilidad" className="footer-link-simple">
                {t('footer.declaracionAcc', 'Declaración de Accesibilidad')}
              </a>
              <a href="/herramientas" className="footer-link-simple">
                {t('footer.herramientasAcc', 'Herramientas de Accesibilidad')}
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
