import React from 'react';
import Header from '../components/Header/AuthHeader';
import Start from '../components/Start';
import Footer from '../components/Footer';
import '../styles/app.css';

const StartPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-linear-to-b from-blue-100 to-white">
      <Header />
      <Start />
      <Footer />
    </div>
  );
};

export default StartPage;