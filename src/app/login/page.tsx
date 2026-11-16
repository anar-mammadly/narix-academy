import type { Metadata } from "next";
import { getAppearance } from "@/lib/site-settings";
import LoginClient from "./LoginClient";

export const metadata: Metadata = { title: "Daxil ol" };
// reads the appearance settings, so it cannot be prerendered once at build time
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const { loginArt, loginImageUrl } = await getAppearance();
  return <LoginClient art={loginArt} imageUrl={loginImageUrl} />;
}
