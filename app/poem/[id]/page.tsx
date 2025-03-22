"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown, MessageCircle } from "lucide-react";
import { useAuth } from "../../../app/context/AuthContext"; // Import Auth Context

interface Poem {
  id: string;
  text: string;
  author: string;
  likes: number;
  dislikes: number;
  comments: { id: string; text: string; author: string }[];
}

export default function PoemPage() {
  const { id } = useParams();
  const [poem, setPoem] = useState<Poem | null>(null);
  const [comment, setComment] = useState("");
  const { user } = useAuth(); // Get logged-in user

  useEffect(() => {
    const fetchPoem = async () => {
      const res = await fetch(`/api/poems/${id}`);
      const data = await res.json();
      setPoem(data);
    };
    fetchPoem();
  }, [id]);

  const handleAddComment = async () => {
    if (!comment.trim()) return;
    if (!user) return alert("You must be logged in to comment.");

    const res = await fetch(`/api/poems/${id}/comment`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.token}` // Include auth token
      },
      body: JSON.stringify({ text: comment, author: user.name }),
    });

    if (res.ok) {
      const newComment = await res.json();
      setPoem((prev) =>
        prev ? { ...prev, comments: [...prev.comments, newComment] } : prev
      );
      setComment("");
    }
  };

  const handleLike = async () => {
    if (!user) return alert("You must be logged in to like.");
    
    await fetch(`/api/poems/${id}/like`, {
      method: "POST",
      headers: { Authorization: `Bearer ${user.token}` },
    });

    setPoem((prev) =>
      prev ? { ...prev, likes: prev.likes + 1 } : prev
    );
  };

  const handleDislike = async () => {
    if (!user) return alert("You must be logged in to dislike.");
    
    await fetch(`/api/poems/${id}/dislike`, {
      method: "POST",
      headers: { Authorization: `Bearer ${user.token}` },
    });

    setPoem((prev) =>
      prev ? { ...prev, dislikes: prev.dislikes + 1 } : prev
    );
  };

  if (!poem) return <p>Loading...</p>;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">{poem.text}</h1>
      <p className="text-gray-500 mb-4">By {poem.author}</p>

      {/* Like, Dislike, and Comment Buttons */}
      <div className="flex gap-4 my-4">
        <button onClick={handleLike} className="flex items-center gap-1 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">
          <ThumbsUp className="w-5 h-5 text-blue-500" />
          {poem.likes}
        </button>
        <button onClick={handleDislike} className="flex items-center gap-1 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">
          <ThumbsDown className="w-5 h-5 text-red-500" />
          {poem.dislikes}
        </button>
      </div>

      {/* Comments Section */}
      <h2 className="mt-6 text-lg font-semibold">💬 Comments</h2>
      <ul className="mt-2 space-y-2">
        {poem.comments.map((c) => (
          <li key={c.id} className="p-2 border rounded">
            <p className="text-sm">{c.text}</p>
            <p className="text-xs text-gray-500">By {c.author}</p>
          </li>
        ))}
      </ul>

      {/* Comment Input */}
      {user && (
        <div className="mt-4">
          <Input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add a comment..."
            className="w-full p-2 border rounded"
          />
          <Button onClick={handleAddComment} className="mt-2 w-full">
            Comment
          </Button>
        </div>
      )}
    </div>
  );
}
