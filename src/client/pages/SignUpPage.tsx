import React from 'react';
import '../styles/app.css';
import SignUpForm from '../components/SignUpForm';

const SignUpPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-linear-to-b from-blue-100 to-white">
      <SignUpForm/>
    </div>
  );
};

export default SignUpPage;