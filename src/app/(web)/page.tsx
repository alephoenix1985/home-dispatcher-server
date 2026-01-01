"use client";

import { withAuth } from "psf-core-next/hocs/withAuth";
import { HomePageContent } from "./_components/HomePageContent";

function HomePage() {
  return <HomePageContent />;
}

export default withAuth(HomePage);
