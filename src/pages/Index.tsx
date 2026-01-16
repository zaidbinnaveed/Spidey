import { useState, useRef } from "react";
import { motion } from "framer-motion";
import WebBackground from "@/components/WebBackground";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import CrawlForm, { CrawlOptions } from "@/components/CrawlForm";
import CrawlProgress from "@/components/CrawlProgress";
import CrawlResults, { CrawlResultData } from "@/components/CrawlResults";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [crawlStatus, setCrawlStatus] = useState<"idle" | "crawling" | "complete" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [currentUrl, setCurrentUrl] = useState("");
  const [results, setResults] = useState<CrawlResultData | null>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleCrawl = async (options: CrawlOptions) => {
    setIsLoading(true);
    setCrawlStatus("crawling");
    setProgress(0);
    setCurrentUrl(options.url);
    setResults(null);

    // Simulate crawling progress (will be replaced with real API call)
    const simulateCrawl = async () => {
      const mockPages = [
        options.url,
        `${options.url}/about`,
        `${options.url}/contact`,
        `${options.url}/products`,
        `${options.url}/blog`,
      ];

      for (let i = 0; i < mockPages.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 800));
        setCurrentUrl(mockPages[i]);
        setProgress(((i + 1) / mockPages.length) * 100);
      }

      // Mock results
      const mockResults: CrawlResultData = {
        url: options.url,
        timestamp: new Date().toISOString(),
        links: [
          `${options.url}/page1`,
          `${options.url}/page2`,
          `${options.url}/about`,
          `${options.url}/contact`,
          `${options.url}/blog`,
          `${options.url}/products`,
          `${options.url}/services`,
          `${options.url}/team`,
          "https://twitter.com/example",
          "https://github.com/example",
        ],
        headings: [
          { level: 1, text: "Welcome to Our Website" },
          { level: 2, text: "About Us" },
          { level: 2, text: "Our Services" },
          { level: 3, text: "Web Development" },
          { level: 3, text: "Mobile Apps" },
          { level: 2, text: "Contact Information" },
        ],
        paragraphs: options.dataTypes.paragraphs
          ? [
              "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
              "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
              "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
            ]
          : [],
        images: options.dataTypes.images
          ? [
              { src: "/placeholder.svg", alt: "Hero image" },
              { src: "/placeholder.svg", alt: "Team photo" },
              { src: "/placeholder.svg", alt: "Product showcase" },
              { src: "/placeholder.svg", alt: "Office building" },
            ]
          : [],
        metadata: {
          title: "Example Website - Home",
          description: "Welcome to our example website. We provide amazing services and products.",
          keywords: ["web development", "technology", "innovation", "services"],
        },
      };

      setCrawlStatus("complete");
      setTimeout(() => {
        setResults(mockResults);
        setCrawlStatus("idle");
        setIsLoading(false);
        toast({
          title: "Crawl Complete!",
          description: `Successfully extracted data from ${mockPages.length} pages.`,
        });
      }, 1500);
    };

    try {
      await simulateCrawl();
    } catch (error) {
      setCrawlStatus("error");
      setIsLoading(false);
      toast({
        title: "Crawl Failed",
        description: "Unable to crawl the specified URL. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleNewCrawl = () => {
    setResults(null);
    scrollToForm();
  };

  return (
    <div className="min-h-screen relative">
      <WebBackground />
      <Header />
      
      <main className="relative z-10">
        {!results && <HeroSection onScrollToForm={scrollToForm} />}
        
        <div
          ref={formRef}
          className={`container mx-auto px-4 py-12 ${results ? "pt-24" : ""}`}
        >
          {!results ? (
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="max-w-2xl mx-auto"
            >
              <CrawlForm onSubmit={handleCrawl} isLoading={isLoading} />
            </motion.div>
          ) : (
            <CrawlResults data={results} onNewCrawl={handleNewCrawl} />
          )}
        </div>
      </main>

      <CrawlProgress
        status={crawlStatus}
        progress={progress}
        currentUrl={currentUrl}
        pagesFound={Math.floor(progress / 20)}
      />
    </div>
  );
};

export default Index;
