import React from 'react';
import Header from '../components/Header/Header';
import Hero from '../components/Hero';
import FeaturedCards from '../components/FeaturedCards';
import Footer from '../components/Footer';
import '../styles/app.css';

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-linear-to-b from-blue-100 to-white">
      <Header />
      <Hero />
      <FeaturedCards />
      <Footer />
    </div>
  );
};
export default HomePage;