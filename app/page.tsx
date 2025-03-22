"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface Poem {
  id: string;
  text: string;
  author: string;
  user_id: string;
  likes: number;
}

export default function HomePage() {
  const { user } = useAuth();
  const [poems, setPoems] = useState<Poem[]>([]);
  const [savedPoems, setSavedPoems] = useState<string[]>([]); // 🔹 Store saved poem IDs
  const [text, setText] = useState("");

  // Fetch all poems
  useEffect(() => {
    const fetchPoems = async () => {
      try {
        const res = await fetch("/api/poems");
        const data = await res.json();
        console.log("📜 Fetched Poems:", data);
        setPoems(data);
      } catch (error) {
        console.error("❌ Error fetching poems:", error);
      }
    };
    fetchPoems();
  }, []);

  // Fetch saved poems
  useEffect(() => {
    const fetchSavedPoems = async () => {
      if (!user) return;
      
      const token = await user.getIdToken();
      console.log("📜 Fetching Saved Poems with Token:", token);

      try {
        const res = await fetch(`/api/users/${user.uid}/saved-poems`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          const errorData = await res.json();
          console.error("❌ Failed to fetch saved poems:", errorData.error);
          return;
        }

        const data = await res.json();
        console.log("✅ Saved Poems:", data);
        setSavedPoems(data.map((poem: Poem) => poem.id)); // 🔹 Store only poem IDs
      } catch (error) {
        console.error("❌ Error fetching saved poems:", error);
      }
    };

    fetchSavedPoems();
  }, [user]);

  // Handle saving a poem
  const handleSavePoem = async (poemId: string) => {
    if (!user) {
      console.error("❌ No user is logged in.");
      return;
    }

    const token = await user.getIdToken();
    console.log("📜 Sending Token for Save:", token);

    const res = await fetch(`/api/poems/${poemId}/save`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ user_id: user.uid }),
    });

    const data = await res.json();
    console.log("🔍 Save API Response:", data);

    if (!res.ok) {
      console.error("❌ Failed to save poem:", data.error);
    } else {
      setSavedPoems([...savedPoems, poemId]); // 🔹 Add to saved list
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-center">📜 Poem Reels</h1>

      {/* Poem Submission Form */}
      {user && (
        <div className="mb-6 p-4 bg-white shadow-lg rounded-lg">
          <h2 className="text-lg font-semibold mb-2">✍️ Post a Poem</h2>
          <Textarea
            placeholder="Write your poem here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="mb-2"
            rows={4}
          />
          <Button onClick={() => console.log("🚀 Posting poem...")}>Post Poem</Button>
        </div>
      )}

      {/* Poems List */}
      <div className="space-y-4">
        {poems.map((poem) => (
          <Card key={poem.id} className="hover:shadow-lg transition">
            <CardContent className="p-4">
              <Link href={`/poem/${poem.id}`} className="block">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]} 
                  components={{
                    p: ({ children }) => <p className="whitespace-pre-wrap">{children}</p>
                  }}
                >
                  {poem.text.replace(/\\n/g, "\n")}
                </ReactMarkdown>
              </Link>
              <p className="text-sm text-gray-500 mt-2">By {poem.author}</p>

              {/* Like Button */}
              <Button variant="outline" onClick={() => console.log("❤️ Like poem", poem.id)}>
                ❤️ {poem.likes}
              </Button>

              {/* Save Button */}
              <Button
                variant={savedPoems.includes(poem.id) ? "default" : "outline"} // 🔹 Mark saved poems
                onClick={() => handleSavePoem(poem.id)}
                className="ml-2"
              >
                {savedPoems.includes(poem.id) ? "✅ Saved" : "💾 Save"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
