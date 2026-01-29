import { useEffect, useState } from "react";
import { MainLayout } from "@/components/MainLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Interaction, Category, ContentWithCategories } from "@/types/database";
import { fetchUserInteractions, fetchCategories, fetchContentWithCategories } from "@/lib/content";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";
import { TrendingUp, Eye, Heart, Star, Clock, Activity, Target, Sparkles, Brain } from "lucide-react";
import { useNavigate } from "react-router-dom";

const COLORS = ['hsl(var(--primary))', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

const Analytics = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [content, setContent] = useState<ContentWithCategories[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      navigate('/auth');
      return;
    }

    async function loadData() {
      try {
        const [interactionsData, categoriesData, contentData] = await Promise.all([
          fetchUserInteractions(user!.id),
          fetchCategories(),
          fetchContentWithCategories()
        ]);
        
        setInteractions(interactionsData);
        setCategories(categoriesData);
        setContent(contentData);
      } catch (error) {
        console.error('Error loading analytics:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user, authLoading, navigate]);

  // Calculate analytics data
  const interactionsByType = [
    { name: 'Views', value: interactions.filter(i => i.interaction_type === 'view').length, icon: Eye },
    { name: 'Likes', value: interactions.filter(i => i.interaction_type === 'like').length, icon: Heart },
    { name: 'Ratings', value: interactions.filter(i => i.interaction_type === 'rating').length, icon: Star },
    { name: 'Saves', value: interactions.filter(i => i.interaction_type === 'save').length, icon: Target },
  ];

  // Calculate category preferences based on interactions
  const categoryPreferences = categories.map(category => {
    const categoryContent = content.filter(c => 
      c.categories.some(cat => cat.id === category.id)
    );
    const categoryContentIds = new Set(categoryContent.map(c => c.id));
    const categoryInteractions = interactions.filter(i => 
      categoryContentIds.has(i.content_id)
    );
    return {
      name: category.name,
      interactions: categoryInteractions.length,
      likes: categoryInteractions.filter(i => i.interaction_type === 'like').length,
    };
  }).sort((a, b) => b.interactions - a.interactions);

  // Interactions over time (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date.toISOString().split('T')[0];
  });

  const interactionsOverTime = last7Days.map(date => {
    const dayInteractions = interactions.filter(i => 
      i.created_at.startsWith(date)
    );
    return {
      date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
      interactions: dayInteractions.length,
      views: dayInteractions.filter(i => i.interaction_type === 'view').length,
      likes: dayInteractions.filter(i => i.interaction_type === 'like').length,
    };
  });

  // Average rating
  const ratings = interactions.filter(i => i.rating !== null);
  const avgRating = ratings.length > 0 
    ? (ratings.reduce((sum, i) => sum + (i.rating || 0), 0) / ratings.length).toFixed(1)
    : '0';

  // Recommendation explanations
  const recommendationReasons = [
    { reason: "Based on your liked content", percentage: 45 },
    { reason: "Popular in your favorite categories", percentage: 30 },
    { reason: "Similar to recently viewed", percentage: 15 },
    { reason: "Trending in your interests", percentage: 10 },
  ];

  if (authLoading || loading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-80" />
            <Skeleton className="h-80" />
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!user) return null;

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Understand how recommendations are tailored for you</p>
        </div>

        {/* Stats overview */}
        <div className="grid gap-4 md:grid-cols-4">
          {interactionsByType.map((stat, index) => (
            <Card key={stat.name}>
              <CardContent className="flex items-center gap-4 p-4">
                <div 
                  className="rounded-lg p-3"
                  style={{ backgroundColor: `${COLORS[index]}20` }}
                >
                  <stat.icon className="h-6 w-6" style={{ color: COLORS[index] }} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.name}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Category preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Category Preferences
              </CardTitle>
              <CardDescription>Your most engaged categories</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryPreferences.slice(0, 6)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                  <YAxis dataKey="name" type="category" width={100} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="interactions" fill="hsl(var(--primary))" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Interaction distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Interaction Distribution
              </CardTitle>
              <CardDescription>How you engage with content</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={interactionsByType.filter(i => i.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {interactionsByType.map((entry, index) => (
                      <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Activity over time */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Activity Over Time
            </CardTitle>
            <CardDescription>Your engagement over the last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={interactionsOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="views" stroke="hsl(var(--primary))" strokeWidth={2} />
                <Line type="monotone" dataKey="likes" stroke="#ec4899" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recommendation insights */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                How We Recommend
              </CardTitle>
              <CardDescription>Understanding your personalized recommendations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recommendationReasons.map((item, index) => (
                <div key={item.reason} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{item.reason}</span>
                    <span className="font-medium">{item.percentage}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-secondary">
                    <div 
                      className="h-full rounded-full"
                      style={{ 
                        width: `${item.percentage}%`,
                        backgroundColor: COLORS[index % COLORS.length]
                      }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Your Stats
              </CardTitle>
              <CardDescription>Key metrics about your activity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Star className="h-5 w-5 text-yellow-500" />
                  <span>Average Rating Given</span>
                </div>
                <Badge variant="secondary" className="text-lg">
                  {avgRating} / 5
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Heart className="h-5 w-5 text-pink-500" />
                  <span>Like Rate</span>
                </div>
                <Badge variant="secondary" className="text-lg">
                  {interactions.length > 0 
                    ? Math.round((interactions.filter(i => i.interaction_type === 'like').length / interactions.filter(i => i.interaction_type === 'view').length) * 100) || 0
                    : 0}%
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Activity className="h-5 w-5 text-blue-500" />
                  <span>Total Interactions</span>
                </div>
                <Badge variant="secondary" className="text-lg">
                  {interactions.length}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Target className="h-5 w-5 text-green-500" />
                  <span>Categories Explored</span>
                </div>
                <Badge variant="secondary" className="text-lg">
                  {categoryPreferences.filter(c => c.interactions > 0).length} / {categories.length}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default Analytics;
