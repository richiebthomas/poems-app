"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  ThumbsUp, 
  Trash2, 
  Bookmark, 
  Calendar, 
  MessageSquare, 
  Share, 
  ArrowLeft,
  Heart,
  HeartOff
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { formatDistanceToNow } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
  
    // Fetch Poem & Comments
    useEffect(() => {
      const fetchData = async () => {
        setIsLoading(true);
        try {
          const headers: HeadersInit = {};
          if (user) {
            const token = await user.getIdToken();
            headers["Authorization"] = `Bearer ${token}`;
          }
          
          // Fetch poem and comments in parallel
          const [poemRes, commentsRes] = await Promise.all([
            fetch(`/api/poems/${id}`, { headers }),
            fetch(`/api/poems/${id}/comments`)
          ]);
          
          if (!poemRes.ok) throw new Error("Failed to fetch poem");
          if (!commentsRes.ok) throw new Error("Failed to fetch comments");
          
          const poemData = await poemRes.json();
          const commentsData = await commentsRes.json();
          
          setPoem(poemData);
          setComments(commentsData);
        } catch (error) {
          console.error("❌ Error fetching data:", error);
        } finally {
          setIsLoading(false);
        }
      };
  
      if (id) {
        fetchData();
      }
    }, [id, user]);

  // Updated handleLike with error handling
  const handleLike = async () => {
    if (!user || !poem) return;
    
    try {
      // Optimistic update
      setPoem(prev => prev ? {
        ...prev,
        liked: !prev.liked,
        likes: prev.liked ? prev.likes - 1 : prev.likes + 1
      } : null);

      const token = await user.getIdToken();
      const method = poem.liked ? "DELETE" : "POST";
      const res = await fetch(`/api/poems/${id}/like`, {
        method,
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to like/unlike poem");
    } catch (error) {
      // Revert on error
      setPoem(prev => prev ? {
        ...prev,
        liked: poem.liked,
        likes: poem.likes
      } : null);
      toast.error("Failed to update like status");
    }
  };

  // Updated handleSave with error handling
  const handleSave = async () => {
    if (!user || !poem) return;
    
    try {
      // Optimistic update
      setPoem(prev => prev ? { 
        ...prev, 
        saved_by_user: !prev.saved_by_user 
      } : null);

      const token = await user.getIdToken();
      const method = poem.saved_by_user ? "DELETE" : "POST";
      const res = await fetch(`/api/poems/${id}/save`, {
        method,
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to save/unsave poem");
      
      toast.success(poem.saved_by_user 
        ? "Removed from saved" 
        : "Added to saved poems");
    } catch (error) {
      // Revert on error
      setPoem(prev => prev ? { 
        ...prev, 
        saved_by_user: poem.saved_by_user 
      } : null);
      toast.error("Failed to update save status");
    }
  };

  // Updated handleAddComment with better error handling
  const handleAddComment = async () => {
    if (!user || !newComment.trim()) return;
    
    try {
      setIsSubmitting(true);
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
      setComments(prev => [...prev, newCommentData]);
      setNewComment("");
      toast.success("Comment added successfully");
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Failed to add comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Updated handleDeleteComment with error handling
  const handleDeleteComment = async (commentId: string) => {
    if (!user) return;
    
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/comments/${commentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      

      if (!res.ok) throw new Error("Failed to delete comment");

      setComments(prev => prev.filter(c => c.id !== commentId));
      toast.success("Comment deleted successfully");
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error("Failed to delete comment");
    }
  };

  // Share poem
  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      // You could add a toast notification here
    } catch (error) {
      console.error("❌ Error sharing poem:", error);
    }
  };

  // Navigate back
  const handleBack = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <Button variant="ghost" onClick={handleBack} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-3/4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-32 mr-2" />
            <Skeleton className="h-10 w-32" />
          </CardFooter>
        </Card>
        
        <div>
          <h2 className="text-lg font-semibold mb-4">💬 Comments</h2>
          <Skeleton className="h-24 w-full mb-4" />
          <Skeleton className="h-16 w-full mb-2" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    );
  }

  if (!poem) return (
    <div className="max-w-2xl mx-auto p-6 text-center">
      <h2 className="text-xl font-semibold mb-4">Poem Not Found</h2>
      <p className="mb-4">The poem you're looking for doesn't exist or has been removed.</p>
      <Button onClick={() => router.push('/')}>Go Home</Button>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Button variant="ghost" onClick={handleBack} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>
      
      {/* Poem Display */}
      <Card className="mb-6 overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center space-x-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${poem.author}`} alt={poem.author} />
              <AvatarFallback>{poem.author[0]}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{poem.author}</p>
              <p className="text-xs text-muted-foreground flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                {formatDistanceToNow(new Date(poem.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pb-0 prose prose-sm max-w-none dark:prose-invert">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {poem.text.replace(/\\n/g, "\n")}
          </ReactMarkdown>
        </CardContent>
        
        <CardFooter className="flex flex-wrap items-center gap-2 pt-4">
          <Button 
            variant={poem.liked ? "default" : "outline"} 
            size="sm" 
            onClick={handleLike}
            className="flex items-center"
          >
            {poem.liked ? (
              <Heart className="h-4 w-4 mr-1 fill-current" />
            ) : (
              <Heart className="h-4 w-4 mr-1" />
            )}
            <span>{poem.likes}</span>
          </Button>

          <Button 
            variant={poem.saved_by_user ? "default" : "outline"} 
            size="sm" 
            onClick={handleSave}
          >
            <Bookmark className={`h-4 w-4 mr-1 ${poem.saved_by_user ? "fill-current" : ""}`} />
            {poem.saved_by_user ? "Saved" : "Save"}
          </Button>

          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share className="h-4 w-4 mr-1" />
            Share
          </Button>

          {user && user.uid === poem.user_id && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-1" /> Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your poem and remove it from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </CardFooter>
      </Card>

      {/* Comment Section */}
      <div className="mt-6">
        <div className="flex items-center mb-4">
          <MessageSquare className="h-5 w-5 mr-2" />
          <h2 className="text-lg font-semibold">Comments</h2>
          <Badge variant="outline" className="ml-2">{comments.length}</Badge>
        </div>
        
        {user ? (
          <div className="mb-6">
            <Textarea
              placeholder="Add your thoughts..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={3}
              className="mb-2"
            />
            <Button 
              onClick={handleAddComment} 
              disabled={!newComment.trim() || isSubmitting}
            >
              {isSubmitting ? "Posting..." : "Post Comment"}
            </Button>
          </div>
        ) : (
          <Card className="mb-6 bg-muted/50">
            <CardContent className="p-4 text-center">
              <p className="text-sm">Sign in to leave a comment</p>
            </CardContent>
          </Card>
        )}
        
        {comments.length > 0 ? (
          <div className="space-y-4">
            {comments.map((comment) => (
              <Card key={comment.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${comment.author}`} alt={comment.author} />
                        <AvatarFallback>{comment.author[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{comment.author}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    
                    {user && user.uid === comment.user_id && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete comment?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteComment(comment.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                  
                  <Separator className="my-2" />
                  
                  <p className="text-sm mt-2">{comment.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-muted/50">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">No comments yet. Be the first to share your thoughts!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}