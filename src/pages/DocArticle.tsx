import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { docsCategories, DocCategory, DocArticle as ArticleType } from "@/data/docsData";
import { CaretRight, List, ArrowLeft } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function DocArticle() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [currentArticle, setCurrentArticle] = useState<ArticleType | null>(null);

  useEffect(() => {
    // Find the article matching the slug
    let found = false;
    for (const cat of docsCategories) {
      const article = cat.articles.find(a => a.slug === slug);
      if (article) {
        setCurrentArticle(article);
        setActiveCategory(cat.id);
        found = true;
        break;
      }
    }
    if (!found && slug) {
      // If slug exists but not found, redirect to docs home or 404
      navigate("/docs");
    }
  }, [slug, navigate]);

  if (!currentArticle) return null;

  const SidebarContent = () => (
    <div className="py-6 pr-6">
      <div className="mb-6">
        <Link to="/docs" className="text-sm font-medium text-muted-foreground hover:text-primary flex items-center gap-2 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Hub
        </Link>
      </div>
      {docsCategories.map((cat) => (
        <div key={cat.id} className="mb-8">
          <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <cat.icon className="w-4 h-4 text-primary" weight="duotone" />
            {cat.title}
          </h4>
          <ul className="space-y-2 border-l border-border/50 ml-2 pl-4">
            {cat.articles.map((article) => (
              <li key={article.slug}>
                <Link
                  to={`/docs/${article.slug}`}
                  className={cn(
                    "text-sm block py-1 transition-colors hover:text-primary",
                    slug === article.slug 
                      ? "text-primary font-medium border-l-2 border-primary -ml-[18px] pl-4" 
                      : "text-muted-foreground"
                  )}
                >
                  {article.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-grow pt-24 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex gap-12">
        
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 flex-shrink-0 sticky top-24 h-[calc(100vh-120px)] overflow-y-auto">
          <ScrollArea className="h-full">
            <SidebarContent />
          </ScrollArea>
        </aside>

        {/* Mobile Navigation Trigger */}
        <div className="lg:hidden absolute top-24 right-4">
           <Sheet>
             <SheetTrigger asChild>
               <Button variant="outline" size="sm" className="gap-2">
                 <List className="w-4 h-4" /> Menu
               </Button>
             </SheetTrigger>
             <SheetContent side="left" className="w-[300px] sm:w-[400px]">
               <ScrollArea className="h-full pt-6">
                 <SidebarContent />
               </ScrollArea>
             </SheetContent>
           </Sheet>
        </div>

        {/* Article Content */}
        <article className="flex-1 min-w-0 max-w-3xl pt-2 lg:pt-6">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-6">
            <Link to="/docs" className="hover:text-foreground">Docs</Link>
            <CaretRight className="w-3 h-3" />
            <span>{docsCategories.find(c => c.id === activeCategory)?.title}</span>
            <CaretRight className="w-3 h-3" />
            <span className="text-foreground">{currentArticle.title}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-8">
            {currentArticle.title}
          </h1>

          {/* Ideally, use a Markdown renderer like 'react-markdown'.
            For this demo, we are using dangerouslySetInnerHTML to render the HTML strings from data.
          */}
          <div 
            className="prose prose-invert prose-emerald max-w-none 
              prose-headings:font-semibold prose-headings:tracking-tight
              prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-4
              prose-p:text-muted-foreground prose-p:leading-relaxed
              prose-li:text-muted-foreground
              prose-strong:text-foreground"
            dangerouslySetInnerHTML={{ __html: currentArticle.content }} 
          />

          <div className="mt-16 pt-8 border-t border-border flex justify-between items-center">
             <div className="text-sm text-muted-foreground">
               Last updated: Just now
             </div>
             <div className="flex gap-2">
               <Button variant="outline" size="sm" className="text-xs h-8">Was this helpful?</Button>
             </div>
          </div>
        </article>

      </main>

      <Footer />
    </div>
  );
}