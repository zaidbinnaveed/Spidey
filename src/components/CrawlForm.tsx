import { useState } from "react";
import { motion } from "framer-motion";
import { Globe, Search, Link2, Type, Image, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export interface CrawlOptions {
  url: string;
  depth: number;
  dataTypes: {
    links: boolean;
    headings: boolean;
    paragraphs: boolean;
    images: boolean;
    metadata: boolean;
  };
}

interface CrawlFormProps {
  onSubmit: (options: CrawlOptions) => void;
  isLoading?: boolean;
}

const CrawlForm = ({ onSubmit, isLoading = false }: CrawlFormProps) => {
  const [url, setUrl] = useState("");
  const [depth, setDepth] = useState([1]);
  const [dataTypes, setDataTypes] = useState({
    links: true,
    headings: true,
    paragraphs: false,
    images: true,
    metadata: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    
    onSubmit({
      url: url.startsWith("http") ? url : `https://${url}`,
      depth: depth[0],
      dataTypes,
    });
  };

  const toggleDataType = (type: keyof typeof dataTypes) => {
    setDataTypes((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  const dataTypeOptions = [
    { key: "links" as const, label: "Hyperlinks", icon: Link2 },
    { key: "headings" as const, label: "Headings", icon: Type },
    { key: "paragraphs" as const, label: "Paragraphs", icon: FileText },
    { key: "images" as const, label: "Images", icon: Image },
    { key: "metadata" as const, label: "Metadata", icon: Globe },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.6 }}
    >
      <Card className="gradient-card border-border/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="font-display text-2xl tracking-wider text-foreground flex items-center gap-2">
            <Search className="w-6 h-6 text-primary" />
            Start Crawling
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Enter a URL and configure your crawl settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* URL Input */}
            <div className="space-y-2">
              <Label htmlFor="url" className="text-foreground">Target URL</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="url"
                  type="text"
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="pl-11 bg-input border-border focus:border-primary focus:ring-primary/20 text-foreground placeholder:text-muted-foreground"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Crawl Depth */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="text-foreground">Crawl Depth</Label>
                <span className="text-sm font-medium text-primary">Level {depth[0]}</span>
              </div>
              <Slider
                value={depth}
                onValueChange={setDepth}
                min={1}
                max={5}
                step={1}
                className="[&_[role=slider]]:bg-primary [&_[role=slider]]:border-primary [&_.bg-primary]:bg-gradient-to-r [&_.bg-primary]:from-primary [&_.bg-primary]:to-accent"
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Higher depth = more pages crawled (1-5 levels)
              </p>
            </div>

            {/* Data Types */}
            <div className="space-y-3">
              <Label className="text-foreground">Data to Extract</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {dataTypeOptions.map(({ key, label, icon: Icon }) => (
                  <motion.div
                    key={key}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <label
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        dataTypes[key]
                          ? "bg-primary/10 border-primary/50 text-foreground"
                          : "bg-muted/30 border-border hover:border-border/80 text-muted-foreground"
                      }`}
                    >
                      <Checkbox
                        checked={dataTypes[key]}
                        onCheckedChange={() => toggleDataType(key)}
                        disabled={isLoading}
                        className="border-primary data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{label}</span>
                    </label>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
              <Button
                type="submit"
                className="w-full h-12 font-display text-lg tracking-wider bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground glow-red transition-all"
                disabled={isLoading || !url.trim()}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Crawling...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5 mr-2" />
                    Launch Spider
                  </>
                )}
              </Button>
            </motion.div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default CrawlForm;
