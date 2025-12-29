import React from 'react';
import Header from '../components/Header/Header';
import Hero from '../components/Hero';
import FeaturedCards from '../components/FeaturedCards';
import Footer from '../components/Footer';
import '../styles/app.css';
import '../styles/hero.css';

const HomePage: React.FC = () => {
  return (
    <div
      className="homePage"
      style={{ backgroundColor: 'var(--background)', color: 'var(--text)' }}
    >
      <Header />
      <main className="homeMain">
        <Hero />
        <div className="home-transition" />
        <FeaturedCards />
      </main>
      <Footer />
    </div>
  );
};

export default HomePage;
