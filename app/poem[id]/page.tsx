"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function PoemPage() {
  const { id } = useParams() as { id: string };
  const [poem, setPoem] = useState<{ text: string; author: string; likes: number } | null>(null);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState<{ text: string }[]>([]);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchPoem = async () => {
      try {
        const res = await fetch(`/api/poems/${id}`);
        if (!res.ok) throw new Error("Poem not found");
        
        const data = await res.json();
        setPoem(data);
        setComments(data.comments || []);
      } catch (err) {
        setError("Error fetching poem. It may not exist.");
      } finally {
        setLoading(false);
      }
    };

    fetchPoem();
  }, [id]);

  const handleAddComment = async () => {
    if (!comment.trim()) return;

    try {
      const res = await fetch(`/api/poems/${id}/comment`, {
        method: "POST",
        body: JSON.stringify({ text: comment }),
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) throw new Error("Failed to add comment");

      setComments([...comments, { text: comment }]);
      setComment("");
    } catch (err) {
      console.error("Error adding comment:", err);
    }
  };

  const handleLike = async () => {
    if (!poem) return;
    
    setLiked(true);
    setPoem({ ...poem, likes: poem.likes + 1 });

    try {
      await fetch(`/api/poems/${id}/like`, { method: "POST" });
    } catch (err) {
      console.error("Error liking poem:", err);
    }
  };

  const handleSave = async () => {
    setSaved(true);

    try {
      await fetch(`/api/poems/${id}/save`, { method: "POST" });
    } catch (err) {
      console.error("Error saving poem:", err);
    }
  };

  if (loading) return <p className="text-center text-gray-500">Loading...</p>;
  if (error) return <p className="text-center text-red-500">{error}</p>;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold">{poem?.text}</h1>
      <p className="text-gray-500">By {poem?.author}</p>

      <div className="flex gap-4 my-4">
        <button
          onClick={handleLike}
          disabled={liked}
          className={`px-4 py-2 rounded ${liked ? "bg-red-500 text-white" : "bg-gray-200"}`}
        >
          ❤️ {liked ? `Liked (${poem?.likes})` : `Like (${poem?.likes})`}
        </button>
        <button
          onClick={handleSave}
          disabled={saved}
          className={`px-4 py-2 rounded ${saved ? "bg-blue-500 text-white" : "bg-gray-200"}`}
        >
          📌 {saved ? "Saved" : "Save"}
        </button>
      </div>

      <h2 className="mt-6 text-lg font-semibold">Comments</h2>
      {comments.length > 0 ? (
        <ul className="mt-2 space-y-2">
          {comments.map((c, index) => (
            <li key={index} className="p-2 border-b border-gray-300">{c.text}</li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500">No comments yet.</p>
      )}

      <div className="mt-4 flex gap-2">
        <input
          type="text"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Add a comment..."
          className="w-full p-2 border rounded"
        />
        <button onClick={handleAddComment} className="px-4 py-2 bg-green-500 text-white rounded">
          Comment
        </button>
      </div>
    </div>
  );
}
