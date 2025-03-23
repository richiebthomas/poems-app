"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push("/home");
    }
  }, [user, router]);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:6rem_4rem] opacity-10" />
      
      <div className="relative z-10 flex flex-col items-center justify-center px-4 sm:px-0">
        <h1 className="text-5xl md:text-6xl font-bold text-slate-900 text-center mb-6">
          Share Your <br />
          <span className="bg-gradient-to-r from-rose-600 to-amber-600 bg-clip-text text-transparent">
            Heartfelt Poems
          </span>
        </h1>

        <p className="text-lg md:text-xl text-slate-600 text-center max-w-2xl mb-12">
          A space for poets and dreamers. Write, share, and discover beautiful poems that inspire, heal, and connect souls.
        </p>

        <Button
          onClick={() => router.push("/home")}
          size="lg"
          className="rounded-full px-8 py-6 text-lg font-semibold bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 transition-all text-white"
        >
          Start Sharing
        </Button>

        <footer className="mt-16 text-sm text-slate-500 font-medium flex items-center space-x-4">
          <span>Write</span>
          <span className="h-1 w-1 rounded-full bg-slate-400" />
          <span>Share</span>
          <span className="h-1 w-1 rounded-full bg-slate-400" />
          <span>Inspire</span>
        </footer>
      </div>

      {/* Animated Blobs */}
      <div className="absolute -top-64 -right-64 w-[800px] h-[800px] bg-gradient-to-r from-rose-100/40 to-amber-100/40 rounded-full blur-3xl opacity-50" />
      <div className="absolute -bottom-64 -left-64 w-[800px] h-[800px] bg-gradient-to-r from-rose-100/40 to-amber-100/40 rounded-full blur-3xl opacity-50" />
    </div>
  );
}