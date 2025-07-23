"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { 
  FileText, 
  Loader2,
  Eye
} from "lucide-react";

interface Template {
  id: string;
  name: string;
  category: string;
  description: string;
  subject: string;
  content: string;
  placeholders: string[];
  isBuiltIn: boolean;
  usageCount: number;
}

interface TemplateCategory {
  value: string;
  name: string;
  description: string;
  icon: string;
}

interface TemplateSelectorProps {
  onTemplateApply: (subject: string, content: string, templateName: string) => void;
}

// Map of icon names to Lucide icons (unused but kept for future category icon display)
// const categoryIcons = {
//   'wrench': FileText,
//   'dollar-sign': DollarSign,
//   'scale': Scale,
//   'volume-x': VolumeX,
//   'shield': Shield,
//   'message-circle': MessageCircle,
//   'clock': Clock,
//   'trending-up': TrendingUp,
// };

export default function TemplateSelector({ onTemplateApply }: TemplateSelectorProps) {
  const [categories, setCategories] = useState<TemplateCategory[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [previewContent, setPreviewContent] = useState<{ subject: string; content: string } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Fetch categories and templates
  useEffect(() => {
    async function fetchData() {
      try {
        const [categoriesRes, templatesRes] = await Promise.all([
          fetch('/api/communication-templates/categories'),
          fetch('/api/communication-templates')
        ]);

        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json();
          setCategories(categoriesData);
        }

        if (templatesRes.ok) {
          const templatesData = await templatesRes.json();
          setTemplates(templatesData);
        }
      } catch (error) {
        console.error('Error fetching template data:', error);
        toast.error('Failed to load templates');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Filter templates by category
  const filteredTemplates = selectedCategory === "all" 
    ? templates 
    : templates.filter(t => t.category === selectedCategory);

  // Generate preview for a template
  const generatePreview = async (template: Template) => {
    setPreviewTemplate(template);
    setPreviewLoading(true);
    
    try {
      const response = await fetch(`/api/communication-templates/${template.id}/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ placeholderValues: {} }) // Use default values
      });

      if (response.ok) {
        const data = await response.json();
        setPreviewContent(data.preview);
      } else {
        toast.error('Failed to generate preview');
      }
    } catch (error) {
      console.error('Error generating preview:', error);
      toast.error('Failed to generate preview');
    } finally {
      setPreviewLoading(false);
    }
  };

  // Apply template to form
  const applyTemplate = () => {
    if (previewContent && previewTemplate) {
      onTemplateApply(previewContent.subject, previewContent.content, previewTemplate.name);
      setPreviewTemplate(null);
      setPreviewContent(null);
      toast.success(`Applied template: ${previewTemplate.name}`);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading templates...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Use Professional Template
          </CardTitle>
          <CardDescription>
            Choose from professionally written communication templates to ensure your message is clear and effective.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All</TabsTrigger>
              {categories.slice(0, 3).map((category) => (
                <TabsTrigger key={category.value} value={category.value}>
                  {category.name}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              <div className="grid gap-3 max-h-64 overflow-y-auto">
                {templates.map((template) => (
                  <TemplateCard 
                    key={template.id} 
                    template={template} 
                    onPreview={() => generatePreview(template)}
                  />
                ))}
              </div>
            </TabsContent>

            {categories.map((category) => (
              <TabsContent key={category.value} value={category.value} className="space-y-4">
                <div className="grid gap-3 max-h-64 overflow-y-auto">
                  {filteredTemplates.map((template) => (
                    <TemplateCard 
                      key={template.id} 
                      template={template} 
                      onPreview={() => generatePreview(template)}
                    />
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => {
        setPreviewTemplate(null);
        setPreviewContent(null);
      }}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Preview: {previewTemplate?.name}
            </DialogTitle>
            <DialogDescription>
              This preview shows how the template will appear with your information filled in.
              You can edit the content after applying it to your form.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1">
            {previewLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span>Generating preview...</span>
              </div>
            ) : previewContent ? (
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Subject:</h4>
                  <div className="p-3 bg-muted rounded-md">
                    {previewContent.subject}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Content:</h4>
                  <div className="p-3 bg-muted rounded-md whitespace-pre-wrap text-sm">
                    {previewContent.content}
                  </div>
                </div>
              </div>
            ) : null}
          </ScrollArea>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setPreviewTemplate(null)}>
              Cancel                              
            </Button>
            <Button onClick={applyTemplate} disabled={!previewContent}>
              Apply Template
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface TemplateCardProps {
  template: Template;
  onPreview: () => void;
}

function TemplateCard({ template, onPreview }: TemplateCardProps) {
  return (
    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm">{template.name}</span>
          {template.isBuiltIn && (
            <Badge variant="secondary" className="text-xs">Built-in</Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground line-clamp-1">
          {template.description}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="outline" className="text-xs">
            {template.category.toLowerCase().replace('_', ' ')}
          </Badge>
          <span className="text-xs text-muted-foreground">
            Used {template.usageCount} times
          </span>
        </div>
      </div>
      <Button size="sm" variant="outline" onClick={onPreview}>
        <Eye className="h-4 w-4 mr-1" />
        Preview
      </Button>
    </div>
  );
}