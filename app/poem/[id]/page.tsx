"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { ThumbsUp, Trash2, Bookmark } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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

interface Comment {
  id: string;
  text: string;
  user_id: string;
  author: string;
  created_at: string;
}

export default function PoemPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [poem, setPoem] = useState<Poem | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");

  // Fetch Poem & Comments
  useEffect(() => {
    const fetchPoem = async () => {
      try {
        const headers: HeadersInit = {};
        if (user) {
          const token = await user.getIdToken();
          headers["Authorization"] = `Bearer ${token}`;
        }
        const res = await fetch(`/api/poems/${id}`, { headers });
        const data = await res.json();
        setPoem(data);
      } catch (error) {
        console.error("❌ Error fetching poem:", error);
      }
    };

    const fetchComments = async () => {
      try {
        const res = await fetch(`/api/poems/${id}/comments`);
        const data = await res.json();
        setComments(data);
      } catch (error) {
        console.error("❌ Error fetching comments:", error);
      }
    };

    fetchPoem();
    fetchComments();
  }, [id, user]);

  // Handle Like/Unlike
  const handleLike = async () => {
    if (!user || !poem) return;
    try {
      const token = await user.getIdToken();
      const method = poem.liked ? "DELETE" : "POST";
      const res = await fetch(`/api/poems/${id}/like`, {
        method,
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to like/unlike poem");

      setPoem((prev) =>
        prev ? { ...prev, liked: !prev.liked, likes: prev.liked ? prev.likes - 1 : prev.likes + 1 } : prev
      );
    } catch (error) {
      console.error("❌ Error liking poem:", error);
    }
  };

  // Handle Save/Unsave
  const handleSave = async () => {
    if (!user || !poem) return;
    try {
      const token = await user.getIdToken();
      const method = poem.saved_by_user ? "DELETE" : "POST";
      const res = await fetch(`/api/poems/${id}/save`, {
        method,
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to save/unsave poem");

      setPoem((prev) => (prev ? { ...prev, saved_by_user: !prev.saved_by_user } : prev));
    } catch (error) {
      console.error("❌ Error saving poem:", error);
    }
  };

  // Handle Delete Poem
  const handleDelete = async () => {
    if (!user || !poem || user.uid !== poem.user_id) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/poems/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to delete poem");

      router.push("/");
    } catch (error) {
      console.error("❌ Error deleting poem:", error);
    }
  };

  // Handle Adding Comment
  const handleAddComment = async () => {
    if (!user || !newComment.trim()) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/poems/${id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: newComment.trim() }),
      });

      if (!res.ok) throw new Error("Failed to add comment");

      const newCommentData = await res.json();
      setComments((prev) => [...prev, newCommentData]);
      setNewComment("");
    } catch (error) {
      console.error("❌ Error adding comment:", error);
    }
  };

  // Handle Deleting Comment
  const handleDeleteComment = async (commentId: string) => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/poems/${id}/comments/${commentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to delete comment");

      setComments((prev) => prev.filter((comment) => comment.id !== commentId));
    } catch (error) {
      console.error("❌ Error deleting comment:", error);
    }
  };

  if (!poem) return <p className="text-center mt-10">Loading poem...</p>;

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Poem Display */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{poem.text.replace(/\\n/g, "\n")}</ReactMarkdown>
          <p className="text-sm text-gray-500 mt-2">By {poem.author}</p>

          <div className="flex items-center space-x-2 mt-2">
            {/* Like Button */}
            <Button variant="outline" onClick={handleLike}>
              <ThumbsUp className="w-4 h-4 mr-1" />
              {poem.liked ? "Unlike" : "Like"} ({poem.likes})
            </Button>

            {/* Save Button */}
            <Button variant={poem.saved_by_user ? "default" : "outline"} onClick={handleSave}>
              <Bookmark className="w-4 h-4 mr-1" />
              {poem.saved_by_user ? "Unsave" : "Save"}
            </Button>

            {/* Delete Button (only if user is the owner) */}
            {user && user.uid === poem.user_id && (
              <Button variant="destructive" onClick={handleDelete}>
                <Trash2 className="w-4 h-4 mr-1" /> Delete
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Comment Section */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-2">💬 Comments</h2>
        {user && (
          <div className="mb-4">
            <Textarea
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={3}
            />
            <Button className="mt-2" onClick={handleAddComment}>
              Post Comment
            </Button>
          </div>
        )}
        <div className="space-y-4">
          {comments.map((comment) => (
            <Card key={comment.id}>
              <CardContent className="p-4">
                <p>{comment.text}</p>
                <p className="text-sm text-gray-500">By {comment.author}</p>
                {user && user.uid === comment.user_id && (
                  <Button variant="destructive" onClick={() => handleDeleteComment(comment.id)}>
                    <Trash2 className="w-4 h-4 mr-1" /> Delete
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
