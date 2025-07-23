import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, Users, Shield, BarChart, MessageCircle, FileText } from "lucide-react";
import Link from "next/link";

export default function AboutPage() {
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
          <h1 className="text-4xl font-bold mb-4">About 10ta</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Empowering tenants through technology, transparency, and collective action at 10 Ocean Avenue.
          </p>
        </div>

        {/* Mission Statement */}
        <Card className="mb-12">
          <CardContent className="p-8">
            <div className="max-w-4xl mx-auto text-center space-y-6">
              <h2 className="text-2xl font-semibold">Our Mission</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                10ta is a tenant association platform designed to level the playing field between tenants and property management. 
                We believe that every tenant deserves safe, well-maintained housing and responsive management. Our platform provides 
                the tools needed to document issues professionally, communicate effectively, and organize collectively for positive change.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Platform Features */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-center mb-8">How We Help Tenants</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold">Professional Documentation</h3>
                    <p className="text-sm text-muted-foreground">
                      Create detailed reports with photos, timestamps, and AI-powered categorization to build strong cases for repairs and improvements.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <MessageCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold">Effective Communication</h3>
                    <p className="text-sm text-muted-foreground">
                      Use professional templates and track all communications with landlords to ensure your voice is heard and documented.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <BarChart className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold">Data-Driven Insights</h3>
                    <p className="text-sm text-muted-foreground">
                      Visualize building-wide patterns with heat maps and analytics to identify systemic issues and strengthen advocacy efforts.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Users className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold">Community Building</h3>
                    <p className="text-sm text-muted-foreground">
                      Connect with neighbors, organize meetings, and create petitions to advocate for building improvements collectively.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Shield className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold">Privacy Protection</h3>
                    <p className="text-sm text-muted-foreground">
                      Control what information you share with granular privacy settings and opt-in policies for all community features.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Building2 className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold">Building Intelligence</h3>
                    <p className="text-sm text-muted-foreground">
                      Access a comprehensive knowledge base of tenant rights, legal resources, and building-specific information.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Values */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-center mb-8">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6 text-center">
                <h3 className="font-semibold mb-3">Transparency</h3>
                <p className="text-sm text-muted-foreground">
                  All data and processes are open and visible to tenants, with clear documentation of how information is used and shared.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <h3 className="font-semibold mb-3">Empowerment</h3>
                <p className="text-sm text-muted-foreground">
                  We provide tools and knowledge that give tenants confidence to advocate for themselves and their community.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <h3 className="font-semibold mb-3">Collaboration</h3>
                <p className="text-sm text-muted-foreground">
                  Strong communities are built through cooperation, mutual support, and collective action toward common goals.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Technology Stack */}
        <Card className="mb-12">
          <CardContent className="p-8">
            <div className="max-w-4xl mx-auto text-center space-y-6">
              <h2 className="text-2xl font-semibold">Built for the Future</h2>
              <p className="text-muted-foreground">
                10ta is built using modern web technologies including Next.js, TypeScript, and AI-powered analysis tools. 
                Our platform is designed to be secure, scalable, and accessible to all tenants regardless of technical experience.
              </p>
              <div className="flex flex-wrap justify-center gap-3 pt-4">
                <span className="px-3 py-1 bg-muted rounded-full text-sm">Next.js 15</span>
                <span className="px-3 py-1 bg-muted rounded-full text-sm">TypeScript</span>
                <span className="px-3 py-1 bg-muted rounded-full text-sm">AI-Powered Analysis</span>
                <span className="px-3 py-1 bg-muted rounded-full text-sm">Secure Cloud Storage</span>
                <span className="px-3 py-1 bg-muted rounded-full text-sm">Real-time Updates</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <Card className="border rounded-lg bg-muted/50">
          <CardContent className="p-8">
            <div className="max-w-3xl mx-auto text-center space-y-4">
              <h2 className="text-2xl font-semibold">Ready to Get Started?</h2>
              <p className="text-muted-foreground">
                Join the 10 Ocean Tenant Association and take control of your housing experience.
              </p>
              <div className="flex gap-4 justify-center pt-4">
                <Button asChild size="lg">
                  <Link href="/sign-up">Join the Association</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/contact">Contact Us</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}