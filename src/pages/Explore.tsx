import { useEffect, useState } from "react";
import { MainLayout } from "@/components/MainLayout";
import { ContentCard } from "@/components/ContentCard";
import { ContentWithCategories, Category } from "@/types/database";
import { fetchContentWithCategories, fetchCategories, toggleLike, toggleSave } from "@/lib/content";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

const Explore = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [content, setContent] = useState<ContentWithCategories[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [contentFilter, setContentFilter] = useState<'all' | 'image' | 'video'>('all');

  useEffect(() => {
    async function loadData() {
      try {
        const [contentData, categoriesData] = await Promise.all([
          fetchContentWithCategories(),
          fetchCategories()
        ]);
        setContent(contentData);
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error loading content:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleLike = async (contentId: string) => {
    if (!user) {
      navigate('/auth');
      return;
    }
    try {
      const isNowLiked = await toggleLike(user.id, contentId);
      setLikedIds(prev => {
        const next = new Set(prev);
        if (isNowLiked) next.add(contentId);
        else next.delete(contentId);
        return next;
      });
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleSave = async (contentId: string) => {
    if (!user) {
      navigate('/auth');
      return;
    }
    try {
      const isNowSaved = await toggleSave(user.id, contentId);
      setSavedIds(prev => {
        const next = new Set(prev);
        if (isNowSaved) next.add(contentId);
        else next.delete(contentId);
        return next;
      });
    } catch (error) {
      console.error('Error toggling save:', error);
    }
  };

  // Filter content
  const filteredContent = content.filter(item => {
    // Search filter
    if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    // Category filter
    if (selectedCategory && !item.categories.some(cat => cat.id === selectedCategory)) {
      return false;
    }
    // Content type filter
    if (contentFilter !== 'all' && item.content_type !== contentFilter) {
      return false;
    }
    return true;
  });

  if (loading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="h-8 w-24" />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Explore</h1>
          <p className="text-muted-foreground">Discover amazing content across all categories</p>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'image', 'video'] as const).map((type) => (
              <Badge
                key={type}
                variant={contentFilter === type ? "default" : "secondary"}
                className="cursor-pointer capitalize"
                onClick={() => setContentFilter(type)}
              >
                {type === 'all' ? 'All' : type === 'image' ? 'Images' : 'Videos'}
              </Badge>
            ))}
          </div>
        </div>

        {/* Category chips */}
        <div className="flex flex-wrap gap-2">
          <Badge
            variant={selectedCategory === null ? "default" : "secondary"}
            className="cursor-pointer"
            onClick={() => setSelectedCategory(null)}
          >
            All Categories
          </Badge>
          {categories.map((category) => (
            <Badge
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "secondary"}
              className="cursor-pointer"
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.name}
            </Badge>
          ))}
        </div>

        {/* Results count */}
        <p className="text-sm text-muted-foreground">
          Showing {filteredContent.length} {filteredContent.length === 1 ? 'result' : 'results'}
        </p>

        {/* Content grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filteredContent.map((item) => (
            <ContentCard
              key={item.id}
              content={item}
              onLike={() => handleLike(item.id)}
              onSave={() => handleSave(item.id)}
              isLiked={likedIds.has(item.id)}
              isSaved={savedIds.has(item.id)}
            />
          ))}
        </div>

        {filteredContent.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Filter className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-medium">No content found</h3>
            <p className="text-muted-foreground">Try adjusting your filters or search query</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Explore;
