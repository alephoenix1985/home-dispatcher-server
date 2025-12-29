"use client";
import React, { createContext, useContext, useState, ReactNode } from "react";

type LoadingContextType = {
  progress: number;
  startLoading: () => void;
  finishLoading: () => void;
  increaseProgress: (amount: number) => void;
  setProgress: (value: number) => void;
};

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error("useLoading must be used within a LoadingProvider");
  }
  return context;
};

export const LoadingProvider = ({ children }: { children: ReactNode }) => {
  const [progress, setProgressState] = useState(0);
  const [loading, setLoading] = useState(false);

  const startLoading = () => {
    setLoading(true);
    setProgressState(0);
  };

  const finishLoading = () => {
    setLoading(false);
    setProgressState(100);
  };

  const increaseProgress = (amount: number) => {
    setProgressState((prev) => Math.min(prev + amount, 100));
  };

  const setProgress = (value: number) => {
    setProgressState(Math.max(0, Math.min(value, 100)));
  };

  return (
    <LoadingContext.Provider value={{ progress, startLoading, finishLoading, increaseProgress, setProgress }}>
      {children}
    </LoadingContext.Provider>
  );
};
