"use client";

import React from "react";
import { SessionInfo } from "psf-core-next/components/session-info/session-info";

export const HomePageContent = (): React.ReactElement => {
  return (
    <main className="min-h-screen w-full flex items-start justify-center p-6">
        welcome
      <SessionInfo />
    </main>
  );
};
