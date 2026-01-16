import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Link2, 
  Type, 
  Image as ImageIcon, 
  FileText, 
  Download, 
  ExternalLink,
  ChevronDown,
  Copy,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

export interface CrawlResultData {
  url: string;
  timestamp: string;
  links: string[];
  headings: { level: number; text: string }[];
  paragraphs: string[];
  images: { src: string; alt: string }[];
  metadata: { title: string; description: string; keywords: string[] };
}

interface CrawlResultsProps {
  data: CrawlResultData | null;
  onNewCrawl: () => void;
}

const CrawlResults = ({ data, onNewCrawl }: CrawlResultsProps) => {
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const { toast } = useToast();

  if (!data) return null;

  const handleCopy = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedItem(label);
    toast({ title: "Copied!", description: `${label} copied to clipboard` });
    setTimeout(() => setCopiedItem(null), 2000);
  };

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `spidey-crawl-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported!", description: "JSON file downloaded successfully" });
  };

  const statCards = [
    { label: "Links", count: data.links.length, icon: Link2, color: "text-blue-400" },
    { label: "Headings", count: data.headings.length, icon: Type, color: "text-green-400" },
    { label: "Images", count: data.images.length, icon: ImageIcon, color: "text-purple-400" },
    { label: "Paragraphs", count: data.paragraphs.length, icon: FileText, color: "text-yellow-400" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl tracking-wider text-foreground">Crawl Results</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Crawled: <span className="text-primary">{data.url}</span>
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleExportJSON}
            className="border-border hover:bg-muted hover:text-foreground"
          >
            <Download className="w-4 h-4 mr-2" />
            Export JSON
          </Button>
          <Button
            onClick={onNewCrawl}
            className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
          >
            New Crawl
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="gradient-card border-border/50">
              <CardContent className="p-4 flex items-center gap-3">
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
                <div>
                  <p className="text-2xl font-display tracking-wider">{stat.count}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Metadata Card */}
      {data.metadata.title && (
        <Card className="gradient-card border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-xl tracking-wider flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Page Metadata
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Title</span>
              <p className="text-foreground">{data.metadata.title}</p>
            </div>
            {data.metadata.description && (
              <div>
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Description</span>
                <p className="text-foreground text-sm">{data.metadata.description}</p>
              </div>
            )}
            {data.metadata.keywords.length > 0 && (
              <div>
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Keywords</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {data.metadata.keywords.map((keyword, i) => (
                    <Badge key={i} variant="secondary" className="bg-muted text-muted-foreground">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Results Tabs */}
      <Tabs defaultValue="links" className="w-full">
        <TabsList className="bg-muted/50 border border-border">
          <TabsTrigger value="links" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Links ({data.links.length})
          </TabsTrigger>
          <TabsTrigger value="headings" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Headings ({data.headings.length})
          </TabsTrigger>
          <TabsTrigger value="images" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Images ({data.images.length})
          </TabsTrigger>
          <TabsTrigger value="text" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Text ({data.paragraphs.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="links" className="mt-4">
          <Card className="gradient-card border-border/50">
            <ScrollArea className="h-[400px]">
              <div className="p-4 space-y-2">
                {data.links.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No links found</p>
                ) : (
                  data.links.map((link, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group"
                    >
                      <div className="flex items-center gap-3 overflow-hidden flex-1">
                        <Link2 className="w-4 h-4 text-primary flex-shrink-0" />
                        <span className="text-sm text-foreground truncate">{link}</span>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => handleCopy(link, `Link ${i + 1}`)}
                        >
                          {copiedItem === `Link ${i + 1}` ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          asChild
                        >
                          <a href={link} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </Button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </ScrollArea>
          </Card>
        </TabsContent>

        <TabsContent value="headings" className="mt-4">
          <Card className="gradient-card border-border/50">
            <ScrollArea className="h-[400px]">
              <div className="p-4 space-y-2">
                {data.headings.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No headings found</p>
                ) : (
                  data.headings.map((heading, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/30"
                    >
                      <Badge className="bg-primary/20 text-primary border-primary/30">
                        H{heading.level}
                      </Badge>
                      <span className="text-foreground">{heading.text}</span>
                    </motion.div>
                  ))
                )}
              </div>
            </ScrollArea>
          </Card>
        </TabsContent>

        <TabsContent value="images" className="mt-4">
          <Card className="gradient-card border-border/50">
            <ScrollArea className="h-[400px]">
              <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {data.images.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8 col-span-full">No images found</p>
                ) : (
                  data.images.map((img, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="relative group rounded-lg overflow-hidden bg-muted/30 aspect-square"
                    >
                      <img
                        src={img.src}
                        alt={img.alt || "Crawled image"}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/placeholder.svg";
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                        <p className="text-xs text-white truncate">{img.alt || "No alt text"}</p>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </ScrollArea>
          </Card>
        </TabsContent>

        <TabsContent value="text" className="mt-4">
          <Card className="gradient-card border-border/50">
            <ScrollArea className="h-[400px]">
              <div className="p-4 space-y-4">
                {data.paragraphs.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No text content found</p>
                ) : (
                  data.paragraphs.map((para, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className="p-4 rounded-lg bg-muted/30 border-l-2 border-primary"
                    >
                      <p className="text-sm text-foreground leading-relaxed">{para}</p>
                    </motion.div>
                  ))
                )}
              </div>
            </ScrollArea>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default CrawlResults;
