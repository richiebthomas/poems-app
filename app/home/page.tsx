"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThumbsUp, Trash2, Bookmark } from "lucide-react";

interface Poem {
  id: string;
  text: string;
  author: string;
  user_id: string;
  likes: number;
  liked: boolean;
  saved_by_user: boolean;
  created_at: string;
}

export default function HomePage() {
  const { user } = useAuth();
  const [poems, setPoems] = useState<Poem[]>([]);
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "saved">("all");

  // Fetch all poems (GET API returns liked and saved_by_user flags)
  useEffect(() => {
    const fetchPoems = async () => {
      try {
        const headers: HeadersInit = {};
        if (user) {
          const token = await user.getIdToken();
          headers["Authorization"] = `Bearer ${token}`;
        }
        const res = await fetch("/api/poems", { headers });
        const data = await res.json();
        console.log("📜 Fetched Poems:", data);
        setPoems(data);
      } catch (error) {
        console.error("❌ Error fetching poems:", error);
      }
    };
    fetchPoems();
  }, [user]);

  // Handle posting a new poem
  const handlePostPoem = async () => {
    if (!text.trim() || !user) return;

    setPosting(true);
    try {
      const token = await user.getIdToken();
      const requestBody = {
        text: text.trim().replace(/\n/g, "\\n"),
        author: user.displayName || "Anonymous",
        user_id: user.uid,
      };

      console.log("📤 Sending Poem Request:", requestBody);

      const res = await fetch("/api/poems", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      const data = await res.json();
      console.log("🔍 Post Poem Response:", data);
      if (!res.ok) throw new Error(data.error);
      setPoems((prev) => [data, ...prev]);
      setText("");
    } catch (error) {
      console.error("❌ Error posting poem:", error);
    } finally {
      setPosting(false);
    }
  };

  // Handle liking/unliking a poem
  const handleLikePoem = async (poemId: string, currentlyLiked: boolean) => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/poems/${poemId}/like`, {
        method: currentlyLiked ? "DELETE" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ user_id: user.uid }),
      });
      const data = await res.json();
      console.log("🔍 Like API Response:", data);
      if (!res.ok) throw new Error(data.error);
      // Update state: toggle liked flag and update like count
      setPoems((prevPoems) =>
        prevPoems.map((poem) =>
          poem.id === poemId
            ? {
                ...poem,
                likes: currentlyLiked ? poem.likes - 1 : poem.likes + 1,
                liked: !currentlyLiked,
              }
            : poem
        )
      );
    } catch (error) {
      console.error("❌ Error liking/unliking poem:", error);
    }
  };

  // Handle saving/unsaving a poem
  const handleSavePoem = async (poemId: string, currentlySaved: boolean) => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/poems/${poemId}/save`, {
        method: currentlySaved ? "DELETE" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ user_id: user.uid }),
      });
      const data = await res.json();
      console.log("🔍 Save API Response:", data);
      if (!res.ok) throw new Error(data.error);
      // Update saved status
      setPoems((prevPoems) =>
        prevPoems.map((poem) =>
          poem.id === poemId
            ? { ...poem, saved_by_user: !currentlySaved }
            : poem
        )
      );
    } catch (error) {
      console.error("❌ Error saving poem:", error);
    }
  };

  // Handle deleting a poem (only by the owner)
  const handleDeletePoem = async (poemId: string, ownerId: string) => {
    if (!user || user.uid !== ownerId) {
      console.error("❌ Cannot delete poem: not the owner");
      return;
    }
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/poems/${poemId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      console.log("🔍 Delete API Response:", data);
      if (!res.ok) throw new Error(data.error);
      // Remove deleted poem from state
      setPoems((prev) => prev.filter((poem) => poem.id !== poemId));
    } catch (error) {
      console.error("❌ Error deleting poem:", error);
    }
  };

  // Filter poems for "Saved" tab
  const savedPoemsList = poems.filter((poem) => poem.saved_by_user);

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-center">📜 Poem Reels</h1>

      {/* Tab Navigation */}
      <div className="flex justify-center gap-4 mb-4">
        <Button variant={activeTab === "all" ? "default" : "outline"} onClick={() => setActiveTab("all")}>
        🧭Explore
        </Button>
        <Button variant={activeTab === "saved" ? "default" : "outline"} onClick={() => setActiveTab("saved")}>
        📌Saved Poems
        </Button>
      </div>

      {/* Poem Submission Form (only for logged-in users) */}
      {user && activeTab === "all" && (
        <div className="mb-6 p-4 bg-white shadow-lg rounded-lg">
          <h2 className="text-lg font-semibold mb-2">✍️ Post a Poem</h2>
          <Textarea
            placeholder="Write your poem here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="mb-2"
            rows={4}
          />
          <Button onClick={handlePostPoem} disabled={posting || !text.trim()}>
            {posting ? "Posting..." : "Post Poem"}
          </Button>
        </div>
      )}

      {/* Poems List */}
      <div className="space-y-4">
        {(activeTab === "all" ? poems : savedPoemsList).map((poem) => (
          <Card key={poem.id} className="hover:shadow-lg transition">
            <CardContent className="p-4">
              <Link href={`/poem/${poem.id}`} className="block">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({ children }) => <p className="whitespace-pre-wrap">{children}</p>,
                  }}
                >
                  {poem.text.replace(/\\n/g, "\n")}
                </ReactMarkdown>
              </Link>
              <p className="text-sm text-gray-500 mt-2">By {poem.author}</p>

              <div className="flex items-center space-x-2 mt-2">
                {/* Like Button */}
                <Button variant="outline" onClick={() => handleLikePoem(poem.id, poem.liked)}>
                {poem.liked ? "❤️" : "♡"} {poem.likes}
                </Button>

                {/* Save Button */}
                <Button
                  variant={poem.saved_by_user ? "default" : "outline"}
                  onClick={() => handleSavePoem(poem.id, poem.saved_by_user)}
                >
                  {poem.saved_by_user ? "📌" : "📌"}
                </Button>

                {/* Delete Button (only if the current user is the owner) */}
                {user && user.uid === poem.user_id && (
                  <Button
                    variant="outline"
                    onClick={() => handleDeletePoem(poem.id, poem.user_id)}
                    className="ml-2"
                  >
                    <Trash2 className="w-4 h-4 mr-1" /> Delete
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
