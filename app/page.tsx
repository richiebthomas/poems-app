"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  const { user } = useAuth();
  const router = useRouter();

  // If the user is logged in, redirect to the home page.
  useEffect(() => {
    if (user) {
      router.push("/home");
    }
  }, [user, router]);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-500 to-pink-500 text-white">
      <h1 className="text-6xl font-extrabold mb-6 text-center animate-fade-in">
        Welcome to Vibe Quotes
      </h1>
      <p className="text-2xl mb-10 text-center max-w-lg">
        Share your vibe with the world. Discover, create, and enjoy amazing quotes that inspire and connect.
      </p>
      <Button
        onClick={() => router.push("/home")}
        className="px-8 py-4 bg-white text-indigo-600 font-bold rounded-full shadow-xl transition-transform transform hover:scale-105 hover:bg-gray-100 animate-bounce"
      >
        Explore Now
      </Button>
      <footer className="mt-12 text-sm opacity-75">
        Connect. Inspire. Share.
      </footer>
    </div>
  );
}