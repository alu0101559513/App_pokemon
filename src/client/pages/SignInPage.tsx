import React from 'react';
import SignInForm from '../components/SignInForm';

const SignInPage: React.FC = () => {
  return (
    <main className="min-h-screen flex items-center justify-center py-12 px-4">
      <SignInForm />
    </main>
  );
};

export default SignInPage;
