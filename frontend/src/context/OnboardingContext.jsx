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
      console.log('🔍 Checking if new user...');
      const response = await api.get('/api/user/profile');
      console.log('👤 User profile:', response.data);
      console.log('💰 Monthly Income:', response.data.finance?.monthlyIncome);
      console.log('📊 Fixed Expenses:', response.data.finance?.fixedExpenses?.length);
      console.log('📊 Variable Expenses:', response.data.finance?.variableExpenses?.length);

      if (response.data.finance?.monthlyIncome === 0 ||
          (response.data.finance?.fixedExpenses?.length === 0 &&
           response.data.finance?.variableExpenses?.length === 0)) {
        console.log('✅ New user detected! Showing onboarding...');
        setShowOnboarding(true);
      } else {
        console.log('❌ Existing user, skipping onboarding');
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

    console.log('🎯 OnboardingContext mounted');
    console.log('📦 Onboarding completed?', completed);
    console.log('🔑 User has token?', !!user.token);

    if (!completed && user.token) {
      console.log('➡️ Calling checkIfNewUser...');
      checkIfNewUser();
    } else {
      console.log('⏭️ Skipping check, setting completed');
      setIsCompleted(true);
    }
  }, [checkIfNewUser]);

  // ✅ Login/Register sonrası manuel kontrol için
  const recheckOnboarding = useCallback(async () => {
    console.log('🔄 recheckOnboarding called');
    const completed = localStorage.getItem('onboardingCompleted');
    console.log('📦 Onboarding completed in recheck?', completed);
    if (!completed) {
      console.log('➡️ Calling checkIfNewUser from recheck...');
      await checkIfNewUser();
    } else {
      console.log('⏭️ Onboarding already completed, skipping');
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