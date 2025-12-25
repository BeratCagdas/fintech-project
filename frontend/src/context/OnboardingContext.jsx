// frontend/src/context/OnboardingContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api'; // ✅ Import ekle

const OnboardingContext = createContext();

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  return context;
};

export const OnboardingProvider = ({ children }) => {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const checkIfNewUser = useCallback(async () => {
    try {
      const response = await api.get('/api/user/profile');

      if (response.data.finance?.monthlyIncome === 0 ||
          (response.data.finance?.fixedExpenses?.length === 0 &&
           response.data.finance?.variableExpenses?.length === 0)) {
        setShowOnboarding(true);
      } else {
        setIsCompleted(true);
      }
    } catch (err) {
      console.error('❌ User check error:', err);
      setIsCompleted(true);
    }
  }, []);

  useEffect(() => {
    const completed = localStorage.getItem('onboardingCompleted');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!completed && user.token) {
      checkIfNewUser();
    } else {
      setIsCompleted(true);
    }
  }, [checkIfNewUser]);

  // ✅ Login/Register sonrası manuel kontrol için
  const recheckOnboarding = useCallback(async () => {
    const completed = localStorage.getItem('onboardingCompleted');
    if (!completed) {
      await checkIfNewUser();
    }
  }, [checkIfNewUser]);

  const startOnboarding = () => {
    setShowOnboarding(true);
    setCurrentStep(0);
  };

  const nextStep = () => {
    setCurrentStep(prev => prev + 1);
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  };

  const skipOnboarding = () => {
    setShowOnboarding(false);
    setIsCompleted(true);
    localStorage.setItem('onboardingCompleted', 'true');
  };

  const completeOnboarding = () => {
    setShowOnboarding(false);
    setIsCompleted(true);
    localStorage.setItem('onboardingCompleted', 'true');
    localStorage.setItem('onboardingCompletedAt', new Date().toISOString());
  };

  const resetOnboarding = () => {
    localStorage.removeItem('onboardingCompleted');
    localStorage.removeItem('onboardingCompletedAt');
    setIsCompleted(false);
    setCurrentStep(0);
  };

  return (
    <OnboardingContext.Provider
      value={{
        showOnboarding,
        currentStep,
        isCompleted,
        startOnboarding,
        nextStep,
        prevStep,
        skipOnboarding,
        completeOnboarding,
        resetOnboarding,
        recheckOnboarding
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};