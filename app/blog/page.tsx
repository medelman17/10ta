import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Calendar, User, ArrowRight, Clock } from "lucide-react";
import Link from "next/link";

// Mock blog posts - in a real app, this would come from a CMS or database
const blogPosts = [
  {
    id: "1",
    title: "Understanding Your Rights as a Tenant in New York",
    excerpt: "A comprehensive guide to tenant rights, rent stabilization, and what to do when landlords don't respond to maintenance requests.",
    content: "Learn about the essential protections available to tenants in New York State...",
    author: "Sarah Martinez, Tenant Rights Advocate",
    publishedAt: "2025-01-20",
    readTime: "8 min read",
    category: "Tenant Rights",
    tags: ["tenant-rights", "legal", "maintenance", "rent-stabilization"]
  },
  {
    id: "2",
    title: "How to Document Building Issues Effectively",
    excerpt: "Best practices for photographing, describing, and tracking building problems to strengthen your case for repairs.",
    content: "Proper documentation is key to getting building issues resolved...",
    author: "Mike Chen, Building Safety Expert",
    publishedAt: "2025-01-18",
    readTime: "6 min read",
    category: "Documentation",
    tags: ["documentation", "photography", "evidence", "maintenance"]
  },
  {
    id: "3",
    title: "Building Community: The Power of Tenant Associations",
    excerpt: "How organizing with your neighbors can lead to faster resolutions, better communication, and stronger tenant protections.",
    content: "Individual voices can be ignored, but collective action gets results...",
    author: "Lisa Rodriguez, Community Organizer",
    publishedAt: "2025-01-15",
    readTime: "10 min read",
    category: "Community",
    tags: ["community", "organizing", "collective-action", "tenant-associations"]
  },
  {
    id: "4",
    title: "10ta Platform Update: New Heat Map Features",
    excerpt: "We've added interactive building heat maps to help visualize issue patterns and identify building-wide problems.",
    content: "The latest update to our platform includes powerful new visualization tools...",
    author: "10ta Development Team",
    publishedAt: "2025-01-12",
    readTime: "4 min read",
    category: "Platform Updates",
    tags: ["platform", "features", "heat-maps", "analytics"]
  },
  {
    id: "5",
    title: "Communicating with Property Management: Templates and Tips",
    excerpt: "Professional communication templates and strategies for effective dialogue with landlords and property managers.",
    content: "Clear, professional communication is essential for resolving tenant issues...",
    author: "Jennifer Wang, Legal Assistant",
    publishedAt: "2025-01-10",
    readTime: "7 min read",
    category: "Communication",
    tags: ["communication", "templates", "property-management", "letters"]
  },
  {
    id: "6",
    title: "Winter Safety: Preventing Heat and Hot Water Issues",
    excerpt: "Essential information about heat and hot water regulations, plus what to do when these vital services fail.",
    content: "During the heating season, landlords are required to maintain specific temperatures...",
    author: "Robert Kim, Tenant Rights Attorney",
    publishedAt: "2025-01-08",
    readTime: "9 min read",
    category: "Seasonal",
    tags: ["heating", "hot-water", "winter", "safety", "legal"]
  }
];

const categories = [
  "All Posts",
  "Tenant Rights",
  "Documentation", 
  "Community",
  "Platform Updates",
  "Communication",
  "Seasonal"
];

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Bar */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="h-6 w-6" />
              <Link href="/" className="font-semibold text-lg">10 Ocean Tenant Association</Link>
            </div>
            <div className="flex items-center gap-4">
              <Button asChild variant="ghost">
                <Link href="/about">About</Link>
              </Button>
              <Button asChild variant="ghost">
                <Link href="/contact">Contact</Link>
              </Button>
              <Button asChild variant="ghost">
                <Link href="/blog">Blog</Link>
              </Button>
              <Button asChild variant="ghost">
                <Link href="/library">Resources</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/sign-in">Sign In</Link>
              </Button>
              <Button asChild>
                <Link href="/sign-up">Join</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold mb-4">Tenant Association Blog</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Resources, updates, and insights to help tenants understand their rights and build stronger communities.
          </p>
        </div>

        {/* Featured Post */}
        <Card className="mb-12 border-2 border-primary/20">
          <CardContent className="p-8">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <Badge className="mb-3">Featured</Badge>
                <h2 className="text-2xl font-bold mb-3">{blogPosts[0].title}</h2>
                <p className="text-muted-foreground mb-4 text-lg">{blogPosts[0].excerpt}</p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    <span>{blogPosts[0].author}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(blogPosts[0].publishedAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{blogPosts[0].readTime}</span>
                  </div>
                </div>
                <Button>
                  Read Full Article
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Category Filter */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={category === "All Posts" ? "default" : "outline"}
                size="sm"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Blog Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {blogPosts.slice(1).map((post) => (
            <Card key={post.id} className="border rounded-lg hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline">{post.category}</Badge>
                  <span className="text-xs text-muted-foreground">{post.readTime}</span>
                </div>
                <CardTitle className="text-lg line-clamp-2">{post.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                  {post.excerpt}
                </p>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    <div className="flex items-center gap-1 mb-1">
                      <User className="h-3 w-3" />
                      <span>{post.author.split(',')[0]}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(post.publishedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    Read More
                    <ArrowRight className="ml-2 h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Newsletter Signup */}
        <Card className="border rounded-lg bg-muted/50">
          <CardContent className="p-8">
            <div className="max-w-2xl mx-auto text-center space-y-4">
              <h2 className="text-2xl font-semibold">Stay Informed</h2>
              <p className="text-muted-foreground">
                Subscribe to our newsletter for the latest tenant rights updates, platform features, and community news.
              </p>
              <div className="flex gap-2 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Enter your email address"
                  className="flex-1 px-3 py-2 border border-input rounded-md bg-background"
                />
                <Button>Subscribe</Button>
              </div>
              <p className="text-xs text-muted-foreground">
                We respect your privacy. Unsubscribe at any time.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Archive & Tags */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Popular Topics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {["tenant-rights", "documentation", "maintenance", "legal", "community", "heating", "communication", "organizing"].map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    #{tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Archive</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>January 2025</span>
                  <span className="text-muted-foreground">6 posts</span>
                </div>
                <div className="flex justify-between">
                  <span>December 2024</span>
                  <span className="text-muted-foreground">4 posts</span>
                </div>
                <div className="flex justify-between">
                  <span>November 2024</span>
                  <span className="text-muted-foreground">5 posts</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}