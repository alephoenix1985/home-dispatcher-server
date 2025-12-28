import type { NextConfig } from "next";
import CoreConfig from "./core/next/helpers/core-next.helper.js";

const nextConfig: NextConfig = CoreConfig({
    reactStrictMode: false,
});

export default nextConfig;
