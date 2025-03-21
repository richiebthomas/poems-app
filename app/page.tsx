"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface Poem {
  id: string;
  text: string;
  author: string;
  created_at: string;
}

export default function HomePage() {
  const [poems, setPoems] = useState<Poem[]>([]);
  const [author, setAuthor] = useState("");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPoems = async () => {
      try {
        const res = await fetch("/api/poems");
        if (!res.ok) throw new Error("Failed to fetch poems");
        
        const data = await res.json();
        setPoems(data);
      } catch (err) {
        console.error("Error fetching poems:", err);
        setError("Failed to load poems.");
      }
    };
    fetchPoems();
  }, []);

  const handlePostPoem = async () => {
    if (!author.trim() || !text.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/poems", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ author, text }),
      });

      if (!res.ok) throw new Error("Failed to post poem");

      const newPoem = await res.json();
      setPoems([newPoem, ...poems]); // Add the new poem at the top
      setAuthor("");
      setText("");
    } catch (err) {
      console.error("Error posting poem:", err);
      setError("Could not post your poem.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-center">📜 Poem Reels</h1>

      {/* Poem Submission Form */}
      <div className="mb-6 p-4 bg-white shadow-lg rounded-lg">
        <h2 className="text-lg font-semibold mb-2">✍️ Post a Poem</h2>
        
        <Input
          type="text"
          placeholder="Your name..."
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          className="mb-2"
        />
        
        <Textarea
          placeholder="Write your poem here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="mb-2"
          rows={4}
        />

        <Button onClick={handlePostPoem} disabled={loading} className="w-full">
          {loading ? "Posting..." : "Post Poem"}
        </Button>
        
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      </div>

      {/* Poems List */}
      {poems.length === 0 ? (
        <p className="text-gray-500 text-center">No poems found. Be the first to post one!</p>
      ) : (
        <div className="space-y-4">
          {poems.map((poem) => (
            <Card key={poem.id} className="hover:shadow-lg transition">
              <CardContent className="p-4">
                <Link href={`/poem/${poem.id}`} className="block">
                  <p className="text-lg font-medium line-clamp-2">{poem.text}</p>
                </Link>
                <p className="text-sm text-gray-500 mt-2">By {poem.author}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
