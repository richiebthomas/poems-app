"use client";
import "../globals.css";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ThumbsUp, Trash2, Bookmark, Send, BookmarkCheck, Heart, Loader2 } from "lucide-react";
import { toast, Toaster } from "sonner";
import { format } from "date-fns";

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
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  // Fetch all poems
  useEffect(() => {
    const fetchPoems = async () => {
      setLoading(true);
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
        toast.error("Failed to load poems. Please try again later.");
      } finally {
        setLoading(false);
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
      toast.success("Your poem has been posted.");
    } catch (error) {
      console.error("❌ Error posting poem:", error);
      toast.error("Failed to post your poem. Please try again.");
    } finally {
      setPosting(false);
    }
  };

  // Handle liking/unliking a poem
  const handleLikePoem = async (poemId: string, currentlyLiked: boolean) => {
    if (!user) {
      toast.info("Please sign in to like poems");
      return;
    }
    
    try {
      // Optimistic update
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
      
      if (!res.ok) {
        // Revert on error
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("❌ Error liking/unliking poem:", error);
      // Revert the optimistic update
      setPoems((prevPoems) =>
        prevPoems.map((poem) =>
          poem.id === poemId
            ? {
                ...poem,
                likes: currentlyLiked ? poem.likes : poem.likes - 1,
                liked: currentlyLiked,
              }
            : poem
        )
      );
      toast.error("Failed to update like status");
    }
  };

  // Handle saving/unsaving a poem
  const handleSavePoem = async (poemId: string, currentlySaved: boolean) => {
    if (!user) {
      toast.info("Please sign in to save poems");
      return;
    }
    
    try {
      // Optimistic update
      setPoems((prevPoems) =>
        prevPoems.map((poem) =>
          poem.id === poemId
            ? { ...poem, saved_by_user: !currentlySaved }
            : poem
        )
      );
      
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
      
      if (!res.ok) {
        // Revert on error
        throw new Error(data.error);
      }
      
      toast(currentlySaved ? "Removed from saved" : "Saved", {
        description: currentlySaved ? "Poem removed from your saved collection" : "Poem added to your saved collection",
      });
    } catch (error) {
      console.error("❌ Error saving poem:", error);
      // Revert the optimistic update
      setPoems((prevPoems) =>
        prevPoems.map((poem) =>
          poem.id === poemId
            ? { ...poem, saved_by_user: currentlySaved }
            : poem
        )
      );
      toast.error("Failed to save/unsave poem");
    }
  };

  // Handle deleting a poem (only by the owner)
  const handleDeletePoem = async (poemId: string, ownerId: string) => {
    if (!user || user.uid !== ownerId) {
      console.error("❌ Cannot delete poem: not the owner");
      toast.error("You can only delete your own poems");
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
      
      toast.success("Your poem has been deleted");
    } catch (error) {
      console.error("❌ Error deleting poem:", error);
      toast.error("Failed to delete poem");
    }
  };

  // Filter poems for "Saved" tab
  const savedPoemsList = poems.filter((poem) => poem.saved_by_user);

  // Format date helper
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy");
    } catch (e) {
      return ""; // Fallback if date is invalid
    }
  };

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="container py-8 max-w-3xl mx-auto">
      {/* Add Sonner Toaster component */}
      <Toaster position="top-center" richColors />
      
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Poetic Journey</h1>
          <p className="text-muted-foreground">Dive into the rhythm, your poetic journey awaits.</p>
        </div>

        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-center">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="all">
                <span className="flex items-center gap-2">
                  🧭 Explore
                </span>
              </TabsTrigger>
              <TabsTrigger value="saved">
                <span className="flex items-center gap-2">
                  <BookmarkCheck className="h-4 w-4" /> Saved
                </span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="all" className="space-y-6 mt-6">
            {user && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <span className="bg-primary/10 p-2 rounded-full">
                      ✍️
                    </span>
                    Share Your Poem
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Write your poem here..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="min-h-[120px] focus:ring-primary"
                    disabled={posting}
                  />
                </CardContent>
                <CardFooter className="flex justify-between">
                  <div className="text-xs text-muted-foreground">
                    {text.length > 0 ? `${text.length} characters` : "Express yourself through poetry"}
                  </div>
                  <Button onClick={handlePostPoem} disabled={posting || !text.trim()}>
                    {posting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Posting...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Post Poem
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            )}

            <div className="space-y-4">
              {loading ? (
                // Loading skeletons
                Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="flex items-center space-x-4">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-[150px]" />
                            <Skeleton className="h-4 w-[100px]" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-2/3" />
                        </div>
                        <div className="flex gap-2">
                          <Skeleton className="h-10 w-16 rounded-md" />
                          <Skeleton className="h-10 w-16 rounded-md" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : poems.length === 0 ? (
                <Card className="p-6 text-center">
                  <p className="text-muted-foreground">No poems to display. Be the first to share a poem!</p>
                </Card>
              ) : (
                <ScrollArea className="max-h-[800px] pr-4">
                  {poems.map((poem) => (
                    <PoemCard
                      key={poem.id}
                      poem={poem}
                      user={user}
                      formatDate={formatDate}
                      getInitials={getInitials}
                      onLike={handleLikePoem}
                      onSave={handleSavePoem}
                      onDelete={handleDeletePoem}
                    />
                  ))}
                </ScrollArea>
              )}
            </div>
          </TabsContent>

          <TabsContent value="saved" className="space-y-4 mt-6">
            {loading ? (
              // Loading skeletons
              Array.from({ length: 2 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-[150px]" />
                          <Skeleton className="h-4 w-[100px]" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-2/3" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : savedPoemsList.length === 0 ? (
              <Card className="p-6 text-center">
                <div className="py-12 flex flex-col items-center gap-4">
                  <Bookmark className="h-12 w-12 text-muted-foreground" />
                  <div className="text-xl font-semibold">No saved poems</div>
                  <p className="text-muted-foreground text-center max-w-md">
                    Bookmark your favorite poems to read them later.
                  </p>
                  <Button variant="outline" onClick={() => setActiveTab("all")}>
                    Explore Poems
                  </Button>
                </div>
              </Card>
            ) : (
              <ScrollArea className="max-h-[800px] pr-4">
                {savedPoemsList.map((poem) => (
                  <PoemCard
                    key={poem.id}
                    poem={poem}
                    user={user}
                    formatDate={formatDate}
                    getInitials={getInitials}
                    onLike={handleLikePoem}
                    onSave={handleSavePoem}
                    onDelete={handleDeletePoem}
                  />
                ))}
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>

        {!user && (
          <Card className="text-center p-6 mt-4">
            <p className="text-muted-foreground mb-4">Sign in to post your own poems or save your favorites</p>
            
          </Card>
        )}
      </div>
    </div>
  );
}

// Poem Card Component
function PoemCard({ 
  poem, 
  user, 
  formatDate, 
  getInitials, 
  onLike, 
  onSave, 
  onDelete 
}: { 
  poem: Poem; 
  user: any; 
  formatDate: (date: string) => string;
  getInitials: (name: string) => string;
  onLike: (id: string, liked: boolean) => void;
  onSave: (id: string, saved: boolean) => void;
  onDelete: (id: string, userId: string) => void;
}) {
  return (
    <Card className="mb-4 overflow-hidden hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback className="bg-primary/10 text-primary">
                {getInitials(poem.author)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{poem.author}</p>
              {poem.created_at && (
                <p className="text-xs text-muted-foreground">{formatDate(poem.created_at)}</p>
              )}
            </div>
          </div>
          {user && user.uid === poem.user_id && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => onDelete(poem.id, poem.user_id)}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <Link href={`/poem/${poem.id}`} className="block">
          <div className="py-2 prose-sm max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => <p className="whitespace-pre-wrap">{children}</p>,
              }}
            >
              {poem.text.replace(/\\n/g, "\n")}
            </ReactMarkdown>
          </div>
        </Link>
      </CardContent>
      <CardFooter className="pt-0 flex justify-between">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onLike(poem.id, poem.liked)}
            className={poem.liked ? "text-red-500" : ""}
          >
            {poem.liked ? (
              <Heart className="w-4 h-4 mr-1 fill-red-500 text-red-500" />
            ) : (
              <Heart className="w-4 h-4 mr-1" />
            )}
            {poem.likes > 0 && <span>{poem.likes}</span>}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSave(poem.id, poem.saved_by_user)}
            className={poem.saved_by_user ? "text-primary" : ""}
          >
            {poem.saved_by_user ? (
              <BookmarkCheck className="w-4 h-4 mr-1" />
            ) : (
              <Bookmark className="w-4 h-4 mr-1" />
            )}
            {poem.saved_by_user ? "Saved" : "Save"}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}