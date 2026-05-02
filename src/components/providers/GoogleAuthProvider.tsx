"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";

const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

export { clientId as googleClientId };

export default function GoogleAuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Always render the provider so any descendant that calls useGoogleOAuth()
  // or renders <GoogleLogin> has the context available.
  return <GoogleOAuthProvider clientId={clientId}>{children}</GoogleOAuthProvider>;
}
