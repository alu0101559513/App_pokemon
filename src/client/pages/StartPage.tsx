import React, { useState, useEffect } from 'react';
import Header from '../components/Header/AuthHeader';
import Start from '../components/Start';
import Footer from '../components/Footer';
import SignInForm from '../components/SignInForm';
import SignUpForm from '../components/SignUpForm';
import '../styles/app.css';

const StartPage: React.FC = () => {
  const [modal, setModal] = useState<'signin' | 'signup' | null>(null);

  useEffect(() => {
    document.body.style.overflow = modal ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [modal]);

  return (
    <div className="min-h-screen bg-[radial-gradient(900px_500px_at_50%_-200px,rgba(48,120,211,0.06),transparent_60%)] dark:bg-[radial-gradient(900px_500px_at_50%_-200px,rgba(48,120,211,0.10),#0f172a_60%)]">
      <Header
        onSignIn={() => setModal('signin')}
        onSignUp={() => setModal('signup')}
      />

      <Start onStart={() => setModal('signup')} />

      <Footer />

      {modal && (
        <div className="auth-modal-overlay" onClick={() => setModal(null)}>
          <div className="auth-modal-card" onClick={(e) => e.stopPropagation()}>
            <button
              className="auth-modal-close"
              onClick={() => setModal(null)}
              aria-label="Cerrar"
            >
              ✕
            </button>
            {modal === 'signin' && (
              <SignInForm onSwitch={() => setModal('signup')} />
            )}

            {modal === 'signup' && (
              <SignUpForm onSwitch={() => setModal('signin')} />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StartPage;
