"use client";

import withAuth from "@/hocs/withAuth";
import { HomePageContent } from "./_components/HomePageContent";

function HomePage() {
  return <HomePageContent />;
}

export default withAuth(HomePage);
