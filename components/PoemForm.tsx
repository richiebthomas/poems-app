"use client";

import { useState } from "react";
import { useAuth } from "@/app/context/AuthContext";

export default function PoemForm() {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return alert("You must be logged in to post!");

    setLoading(true);
    const response = await fetch("/api/poems", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        author: user.displayName || "Anonymous",
      }),
    });

    if (response.ok) {
      setText("");
      alert("Poem posted!");
    } else {
      alert("Failed to post poem.");
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border rounded">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full p-2 border rounded"
        placeholder="Write your poem..."
      />
      <button
        type="submit"
        disabled={loading}
        className="bg-blue-500 text-white p-2 mt-2 w-full rounded"
      >
        {loading ? "Posting..." : "Post Poem"}
      </button>
    </form>
  );
}
