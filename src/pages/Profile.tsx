import { useEffect, useState } from "react";
import { MainLayout } from "@/components/MainLayout";
import { ContentCard } from "@/components/ContentCard";
import { useAuth } from "@/contexts/AuthContext";
import { ContentWithCategories, Interaction, Category } from "@/types/database";
import { fetchUserInteractions, fetchUserSavedContent, fetchContentById, fetchCategories } from "@/lib/content";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, Bookmark, Eye, Star, Clock, User, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [savedContent, setSavedContent] = useState<ContentWithCategories[]>([]);
  const [likedContent, setLikedContent] = useState<ContentWithCategories[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      navigate('/auth');
      return;
    }

    async function loadData() {
      try {
        const [interactionsData, savedData, categoriesData] = await Promise.all([
          fetchUserInteractions(user!.id),
          fetchUserSavedContent(user!.id),
          fetchCategories()
        ]);
        
        setInteractions(interactionsData);
        setSavedContent(savedData);
        setCategories(categoriesData);
        
        // Get liked content
        const likeInteractions = interactionsData.filter(i => i.interaction_type === 'like');
        const likedContentData: ContentWithCategories[] = [];
        for (const interaction of likeInteractions.slice(0, 20)) {
          const content = await fetchContentById(interaction.content_id);
          if (content) likedContentData.push(content);
        }
        setLikedContent(likedContentData);
      } catch (error) {
        console.error('Error loading profile data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user, authLoading, navigate]);

  // Calculate stats
  const viewCount = interactions.filter(i => i.interaction_type === 'view').length;
  const likeCount = interactions.filter(i => i.interaction_type === 'like').length;
  const saveCount = savedContent.length;
  const ratingCount = interactions.filter(i => i.interaction_type === 'rating').length;

  // Get favorite categories based on interactions
  const categoryInteractions = new Map<string, number>();
  interactions.forEach(interaction => {
    // This is simplified - in a real app, we'd join with content categories
  });

  if (authLoading || loading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-20 w-20 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!user) return null;

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Profile header */}
        <div className="flex items-start gap-6">
          <Avatar className="h-20 w-20">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-primary text-2xl text-primary-foreground">
              {profile?.username?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {profile?.username || user.email?.split('@')[0]}
            </h1>
            <p className="text-muted-foreground">{user.email}</p>
            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Joined {new Date(profile?.created_at || user.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="rounded-lg bg-primary/10 p-3">
                <Eye className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{viewCount}</p>
                <p className="text-sm text-muted-foreground">Views</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="rounded-lg bg-pink-500/10 p-3">
                <Heart className="h-6 w-6 text-pink-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{likeCount}</p>
                <p className="text-sm text-muted-foreground">Likes</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="rounded-lg bg-blue-500/10 p-3">
                <Bookmark className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{saveCount}</p>
                <p className="text-sm text-muted-foreground">Saved</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="rounded-lg bg-yellow-500/10 p-3">
                <Star className="h-6 w-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{ratingCount}</p>
                <p className="text-sm text-muted-foreground">Ratings</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content tabs */}
        <Tabs defaultValue="saved">
          <TabsList>
            <TabsTrigger value="saved" className="gap-2">
              <Bookmark className="h-4 w-4" />
              Saved ({savedContent.length})
            </TabsTrigger>
            <TabsTrigger value="liked" className="gap-2">
              <Heart className="h-4 w-4" />
              Liked ({likedContent.length})
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <Clock className="h-4 w-4" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="saved" className="mt-6">
            {savedContent.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {savedContent.map((item) => (
                  <ContentCard key={item.id} content={item} isSaved />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Bookmark className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="text-lg font-medium">No saved content yet</h3>
                <p className="text-muted-foreground">Content you save will appear here</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="liked" className="mt-6">
            {likedContent.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {likedContent.map((item) => (
                  <ContentCard key={item.id} content={item} isLiked />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Heart className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="text-lg font-medium">No liked content yet</h3>
                <p className="text-muted-foreground">Content you like will appear here</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            {interactions.length > 0 ? (
              <div className="space-y-4">
                {interactions.slice(0, 20).map((interaction) => (
                  <Card key={interaction.id}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-4">
                        <Badge variant="secondary">
                          {interaction.interaction_type}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(interaction.created_at).toLocaleString()}
                        </span>
                      </div>
                      {interaction.rating && (
                        <div className="flex items-center gap-1">
                          {Array.from({ length: interaction.rating }).map((_, i) => (
                            <Star key={i} className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Clock className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="text-lg font-medium">No history yet</h3>
                <p className="text-muted-foreground">Your viewing history will appear here</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Profile;
