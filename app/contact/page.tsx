import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Building2, Mail, MessageCircle, Phone, MapPin, Clock } from "lucide-react";
import Link from "next/link";

export default function ContactPage() {
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
          <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Get in touch with the 10 Ocean Tenant Association board or request access to the platform.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Contact Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Send us a Message
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="firstName" className="text-sm font-medium">
                    First Name
                  </label>
                  <Input id="firstName" placeholder="John" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="lastName" className="text-sm font-medium">
                    Last Name
                  </label>
                  <Input id="lastName" placeholder="Doe" />
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </label>
                <Input id="email" type="email" placeholder="john.doe@email.com" />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="unit" className="text-sm font-medium">
                  Unit Number (if applicable)
                </label>
                <Input id="unit" placeholder="e.g., 4B" />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="subject" className="text-sm font-medium">
                  Subject
                </label>
                <Input id="subject" placeholder="What can we help you with?" />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-medium">
                  Message
                </label>
                <Textarea 
                  id="message" 
                  placeholder="Please describe your inquiry or concern in detail..."
                  rows={5}
                />
              </div>
              
              <Button className="w-full">
                Send Message
              </Button>
              
              <p className="text-sm text-muted-foreground text-center">
                We typically respond within 24-48 hours during business days.
              </p>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <div className="space-y-6">
            {/* Association Board */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Association Board
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">General Inquiries</p>
                    <p className="text-sm text-muted-foreground">board@10oceantenants.org</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <MessageCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Platform Support</p>
                    <p className="text-sm text-muted-foreground">support@10oceantenants.org</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Response Time</p>
                    <p className="text-sm text-muted-foreground">24-48 hours (business days)</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Building Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Building Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Address</p>
                    <p className="text-sm text-muted-foreground">10 Ocean Avenue<br />Brooklyn, NY 11235</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Total Units</p>
                    <p className="text-sm text-muted-foreground">80 units (Floors 1-10, Units A-H)</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Emergency Contacts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Emergency & Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Building Emergency</p>
                    <p className="text-sm text-muted-foreground">(555) 911-HELP</p>
                    <p className="text-xs text-muted-foreground">24/7 for urgent building issues</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Property Management</p>
                    <p className="text-sm text-muted-foreground">Ocean View Property Management</p>
                    <p className="text-sm text-muted-foreground">(555) 123-PROP</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Platform Access */}
            <Card className="border-blue-200 bg-blue-50/50">
              <CardHeader>
                <CardTitle className="text-blue-900">Need Platform Access?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-blue-800 mb-4">
                  To access the 10ta platform, you need to be verified as a tenant of 10 Ocean Avenue. 
                  Current tenants can request access through the association board.
                </p>
                <div className="flex gap-2">
                  <Button asChild size="sm">
                    <Link href="/sign-up">Request Access</Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link href="/library">View Public Resources</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-semibold text-center mb-8">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">How do I join the tenant association?</h3>
                <p className="text-sm text-muted-foreground">
                  All tenants of 10 Ocean Avenue are automatically eligible to join. Simply request access 
                  through our sign-up form and provide your unit information for verification.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">Is the platform free to use?</h3>
                <p className="text-sm text-muted-foreground">
                  Yes, the 10ta platform is completely free for all verified tenants of 10 Ocean Avenue. 
                  It&apos;s funded and maintained by the tenant association.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">How is my privacy protected?</h3>
                <p className="text-sm text-muted-foreground">
                  We have strict privacy controls. You control what information you share and with whom. 
                  Personal contact information is only shared with your explicit consent.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">Can I report issues anonymously?</h3>
                <p className="text-sm text-muted-foreground">
                  Yes, you can choose to report building issues anonymously while still contributing 
                  to building-wide analytics and heat maps.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}