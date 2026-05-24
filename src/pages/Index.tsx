import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowUpRight,
  Pause,
  Play,
  Plus,
  Search,
  Square,
  Wifi,
} from "lucide-react";
import WebBackground from "@/components/WebBackground";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { spideyApi, SpideyStats, StreamEvent } from "@/lib/spideyApi";

const Index = () => {
  const { toast } = useToast();
  const [connected, setConnected] = useState(false);
  const [stats, setStats] = useState<SpideyStats | null>(null);
  const [seedUrl, setSeedUrl] = useState("");
  const [maxDepth, setMaxDepth] = useState(2);
  const [maxPages, setMaxPages] = useState(500);

  const [topKeywords, setTopKeywords] = useState<{ term: string; weight: number }[]>([]);

  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ url: string; score: number; snippet: string }[]>([]);

  const [pages, setPages] = useState<any[]>([]);
  const refreshTimer = useRef<number | null>(null);

  const status = stats?.status ?? "idle";
  const progressPct = useMemo(() => {
    if (!stats?.max_pages) return 0;
    return Math.min(100, Math.round((stats.indexed_pages / stats.max_pages) * 100));
  }, [stats]);

  const refreshPanels = async () => {
    try {
      const [kw, p] = await Promise.all([spideyApi.topKeywords(25), spideyApi.pages(0, 50)]);
      setTopKeywords(kw.items);
      setPages(p.items);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    let stopStream: null | (() => void) = null;

    (async () => {
      try {
        const h = await spideyApi.health();
        setStats(h.stats);
      } catch {
        // backend may not be up yet
      }

      stopStream = spideyApi.stream(
        (evt: StreamEvent) => {
          setConnected(true);
          if (evt.stats) setStats(evt.stats);

          // Throttle heavier refresh (keywords/pages) when pages arrive.
          if (evt.type === "page" || evt.type === "status") {
            if (refreshTimer.current) window.clearTimeout(refreshTimer.current);
            refreshTimer.current = window.setTimeout(() => refreshPanels(), 600);
          }
        },
        () => setConnected(false),
      );
    })();

    return () => {
      if (refreshTimer.current) window.clearTimeout(refreshTimer.current);
      stopStream?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onStart = async () => {
    try {
      const seeds = [seedUrl.trim()].filter(Boolean);
      await spideyApi.start(seeds, maxDepth, maxPages);
      toast({ title: "Crawler Started", description: "Spidey is swinging through the web." });
    } catch (e: any) {
      toast({ title: "Start failed", description: e?.message ?? "Backend error", variant: "destructive" });
    }
  };

  const onPauseResume = async () => {
    try {
      if (status === "paused") await spideyApi.resume();
      else await spideyApi.pause();
    } catch (e: any) {
      toast({ title: "Command failed", description: e?.message ?? "Backend error", variant: "destructive" });
    }
  };

  const onStop = async () => {
    try {
      await spideyApi.stop();
      toast({ title: "Crawler Stopped", description: "Frontier drained and workers disengaged." });
    } catch (e: any) {
      toast({ title: "Stop failed", description: e?.message ?? "Backend error", variant: "destructive" });
    }
  };

  const onAddSeed = async () => {
    const url = seedUrl.trim();
    if (!url) return;
    try {
      const r = await spideyApi.addSeed(url, 0);
      toast({
        title: r.ok ? "Seed added" : "Seed rejected",
        description: r.ok ? "Added to frontier." : "Duplicate / invalid / out of scope (host restriction).",
        variant: r.ok ? "default" : "destructive",
      });
    } catch (e: any) {
      toast({ title: "Add seed failed", description: e?.message ?? "Backend error", variant: "destructive" });
    }
  };

  const onSearch = async () => {
    const q = query.trim();
    if (!q) return;
    try {
      const r = await spideyApi.search(q, 25);
      setSearchResults(r.items);
    } catch (e: any) {
      toast({ title: "Search failed", description: e?.message ?? "Backend error", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen relative">
      <WebBackground />
      <Header />

      <main className="relative z-10 container mx-auto px-4 pt-24 pb-10">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-muted-foreground">
                  <Wifi className={`w-4 h-4 ${connected ? "text-green-500" : "text-muted-foreground"}`} />
                  {connected ? "Realtime Link Active" : "Waiting for Backend"}
                </span>
                <Badge className="bg-primary/15 text-primary border-primary/30">{status.toUpperCase()}</Badge>
              </div>
              <h1 className="font-display text-5xl md:text-6xl tracking-[0.15em] italic skew-x-[-10deg] mt-2">
                SPIDEY
              </h1>
              <p className="text-muted-foreground max-w-2xl">
                Parallel Web Search Crawler dashboard. Monitor threads, frontier depth, indexing throughput, and query the
                live inverted index.
              </p>
            </div>

            <Card className="gradient-card border-border/50 w-full lg:w-[520px] backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="font-display tracking-widest flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  Control Console
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-foreground">Seed URL</Label>
                    <Input
                      value={seedUrl}
                      onChange={(e) => setSeedUrl(e.target.value)}
                      placeholder="https://example.com"
                      className="bg-input border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground">Limits</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        value={String(maxDepth)}
                        onChange={(e) => setMaxDepth(Number(e.target.value || 0))}
                        type="number"
                        min={0}
                        className="bg-input border-border"
                        placeholder="Depth"
                      />
                      <Input
                        value={String(maxPages)}
                        onChange={(e) => setMaxPages(Number(e.target.value || 0))}
                        type="number"
                        min={1}
                        className="bg-input border-border"
                        placeholder="Pages"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button onClick={onStart} className="bg-gradient-to-r from-primary to-accent glow-red">
                    <Play className="w-4 h-4 mr-2" />
                    Start
                  </Button>
                  <Button variant="outline" onClick={onPauseResume} className="border-border">
                    {status === "paused" ? (
                      <>
                        <Play className="w-4 h-4 mr-2" /> Resume
                      </>
                    ) : (
                      <>
                        <Pause className="w-4 h-4 mr-2" /> Pause
                      </>
                    )}
                  </Button>
                  <Button variant="destructive" onClick={onStop}>
                    <Square className="w-4 h-4 mr-2" />
                    Stop
                  </Button>
                  <Button variant="secondary" onClick={onAddSeed}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Seed
                  </Button>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Indexing progress</span>
                    <span>
                      {stats?.indexed_pages ?? 0}/{stats?.max_pages ?? 0} pages
                    </span>
                  </div>
                  <Progress
                    value={progressPct}
                    className="h-3 bg-muted [&>div]:bg-gradient-to-r [&>div]:from-primary [&>div]:to-accent"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <Card className="gradient-card border-border/50">
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground uppercase tracking-[0.25em]">Active Threads</div>
                <div className="font-display text-4xl tracking-wider mt-2">
                  {stats?.active_workers ?? 0}
                  <span className="text-muted-foreground text-lg">/{stats?.max_workers ?? 0}</span>
                </div>
              </CardContent>
            </Card>
            <Card className="gradient-card border-border/50">
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground uppercase tracking-[0.25em]">Frontier Queue</div>
                <div className="font-display text-4xl tracking-wider mt-2">{stats?.queue_size ?? 0}</div>
              </CardContent>
            </Card>
            <Card className="gradient-card border-border/50">
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground uppercase tracking-[0.25em]">Visited URLs</div>
                <div className="font-display text-4xl tracking-wider mt-2">{stats?.visited_count ?? 0}</div>
              </CardContent>
            </Card>
            <Card className="gradient-card border-border/50">
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground uppercase tracking-[0.25em]">Indexed Pages</div>
                <div className="font-display text-4xl tracking-wider mt-2">{stats?.indexed_pages ?? 0}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <Card className="gradient-card border-border/50 xl:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="font-display tracking-widest flex items-center gap-2">
                  <Search className="w-5 h-5 text-primary" />
                  Search Indexed Web
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search keywords (TF ranking)"
                    className="bg-input border-border"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") onSearch();
                    }}
                  />
                  <Button onClick={onSearch} className="bg-gradient-to-r from-primary to-accent">
                    Search
                  </Button>
                </div>

                <ScrollArea className="h-[360px] pr-4">
                  <div className="space-y-3">
                    {searchResults.length === 0 ? (
                      <div className="text-sm text-muted-foreground py-8 text-center">
                        No results yet. Start crawling, then search.
                      </div>
                    ) : (
                      searchResults.map((r) => (
                        <div
                          key={r.url}
                          className="p-4 rounded-xl bg-muted/25 border border-border/50 hover:bg-muted/35 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-sm text-primary truncate">{r.url}</div>
                              <div className="text-xs text-muted-foreground mt-2 leading-relaxed">{r.snippet}</div>
                            </div>
                            <a
                              href={r.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-muted-foreground hover:text-foreground flex items-center gap-1"
                            >
                              <ArrowUpRight className="w-4 h-4" />
                            </a>
                          </div>
                          <div className="mt-3">
                            <Badge className="bg-primary/15 text-primary border-primary/30">TF {r.score.toFixed(4)}</Badge>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card className="gradient-card border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="font-display tracking-widest">Top Keywords</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[440px] pr-4">
                  <div className="space-y-2">
                    {topKeywords.length === 0 ? (
                      <div className="text-sm text-muted-foreground py-10 text-center">
                        Keywords will appear as indexing progresses.
                      </div>
                    ) : (
                      topKeywords.map((t) => (
                        <div
                          key={t.term}
                          className="flex items-center justify-between p-2 rounded-lg bg-muted/25 border border-border/40"
                        >
                          <span className="text-sm text-foreground">{t.term}</span>
                          <Badge className="bg-primary/15 text-primary border-primary/30">{t.weight.toFixed(2)}</Badge>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          <Card className="gradient-card border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="font-display tracking-widest">Indexed Pages Monitor</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="pages">
                <TabsList className="bg-muted/40 border border-border">
                  <TabsTrigger value="pages" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    Pages ({stats?.indexed_pages ?? 0})
                  </TabsTrigger>
                  <TabsTrigger value="errors" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    Last Error
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="pages" className="mt-4">
                  <ScrollArea className="h-[320px] pr-4">
                    <div className="space-y-2">
                      {pages.length === 0 ? (
                        <div className="text-sm text-muted-foreground py-10 text-center">No pages indexed yet.</div>
                      ) : (
                        pages.map((p) => (
                          <div
                            key={p.url}
                            className="p-3 rounded-xl bg-muted/25 border border-border/40 flex items-center justify-between gap-4"
                          >
                            <div className="min-w-0">
                              <div className="text-sm text-foreground truncate">{p.title || p.url}</div>
                              <div className="text-xs text-muted-foreground truncate mt-1">{p.url}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className="bg-muted text-muted-foreground border-border">d={p.depth}</Badge>
                              <Badge className={p.error ? "bg-destructive/15 text-destructive border-destructive/30" : "bg-primary/15 text-primary border-primary/30"}>
                                {p.error ? "FAIL" : "OK"}
                              </Badge>
                              <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                                <ArrowUpRight className="w-4 h-4" />
                              </a>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="errors" className="mt-4">
                  <div className="p-4 rounded-xl bg-muted/25 border border-border/40">
                    <div className="text-xs text-muted-foreground uppercase tracking-[0.25em]">Last URL</div>
                    <div className="text-sm text-foreground mt-1 break-words">{stats?.last_url || "—"}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-[0.25em] mt-4">Last Error</div>
                    <div className="text-sm text-destructive mt-1 break-words">{stats?.last_error || "—"}</div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
};

export default Index;
