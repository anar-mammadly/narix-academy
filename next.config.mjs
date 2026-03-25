/** @type {import('next').NextConfig} */
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const nextConfig = {
  turbopack: {
    // Prevent Next from auto-selecting a wrong monorepo root when multiple lockfiles exist.
    root: __dirname,
  },
};

export default nextConfig;
