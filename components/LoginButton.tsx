// app/components/LoginButton.tsx
"use client";

import { useAuth } from "@/app/context/AuthContext";
import { signInWithGoogle, logout } from "@/lib/firebase";
import { Button } from "@/components/ui/button";

export default function LoginButton() {
  const { user } = useAuth();

  return user ? (
    <div className="flex items-center gap-4">
      <p>{user.displayName}</p>
      <Button onClick={logout}>Logout</Button>
    </div>
  ) : (
    <Button onClick={signInWithGoogle}>Sign in with Google</Button>
  );
}
