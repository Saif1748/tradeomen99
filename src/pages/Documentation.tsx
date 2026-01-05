import { useState } from "react";
import { Link } from "react-router-dom"; // Updated import
import { motion } from "framer-motion";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { SEO } from "@/components/SEO";
import { MagnifyingGlass, ArrowRight, CaretRight } from "@phosphor-icons/react";
import { docsCategories } from "@/data/docsData";

export default function Documentation() {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter categories and articles based on search query
  const filteredCategories = docsCategories.filter((cat) => {
    const matchesTitle = cat.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDesc = cat.description.toLowerCase().includes(searchQuery.toLowerCase());
    // Check if any articles within the category match
    const matchesArticles = cat.articles.some(art => 
      art.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return matchesTitle || matchesDesc || matchesArticles;
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO 
        title="Documentation - TradeOmen" 
        description="Learn how to master your trading journal, import data, and use AI analytics." 
      />
      
      <Navbar />

      <main className="flex-grow pt-28 pb-20">
        
        {/* --- HERO SECTION --- */}
        <section className="relative px-4 sm:px-6 lg:px-8 mb-20">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative z-10"
            >
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6">
                How can we help?
              </h1>
              <p className="text-lg text-muted-foreground mb-10">
                Search for guides, API references, and troubleshooting tips.
              </p>

              {/* Search Bar */}
              <div className="relative max-w-xl mx-auto group">
                {/* Glow effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-primary/50 to-emerald-500/50 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-500" />
                
                <div className="relative flex items-center bg-card border border-white/10 rounded-xl px-4 py-4 shadow-2xl">
                  <MagnifyingGlass className="w-6 h-6 text-muted-foreground mr-3" />
                  <input 
                    type="text"
                    placeholder="Search 'Import CSV' or 'Win Rate'..."
                    className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground text-lg"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                     <button 
                       onClick={() => setSearchQuery("")}
                       className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded-md bg-secondary"
                     >
                       Clear
                     </button>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Background Decor */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/10 blur-[120px] rounded-full pointer-events-none -z-10" />
          </div>
        </section>

        {/* --- CONTENT GRID --- */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {filteredCategories.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground">No results found for "{searchQuery}"</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCategories.map((category, index) => {
                const Icon = category.icon;
                return (
                  <motion.div
                    key={category.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="group relative bg-card/40 hover:bg-card/60 border border-white/5 hover:border-primary/20 rounded-2xl p-6 transition-all duration-300 flex flex-col h-full"
                  >
                    {/* Hover Glow */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity duration-500" />
                    
                    <div className="relative z-10 flex-1 flex flex-col">
                      {/* Header */}
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-secondary/50 flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors duration-300">
                          <Icon weight="duotone" className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-semibold">{category.title}</h3>
                      </div>
                      
                      <p className="text-muted-foreground text-sm mb-6 line-clamp-2">
                        {category.description}
                      </p>

                      {/* Articles List */}
                      <ul className="space-y-3 flex-1">
                        {category.articles.slice(0, 3).map((article, i) => (
                          <li key={i}>
                            <Link 
                              to={`/docs/${article.slug}`}
                              className="flex items-center justify-between text-sm text-foreground/80 hover:text-primary cursor-pointer transition-colors group/item"
                            >
                              <span>{article.title}</span>
                              <CaretRight className="w-3 h-3 opacity-0 -translate-x-2 group-hover/item:opacity-100 group-hover/item:translate-x-0 transition-all" />
                            </Link>
                          </li>
                        ))}
                      </ul>
                      
                      {/* View All Link */}
                      <div className="mt-6 pt-4 border-t border-white/5 flex justify-end">
                        <Link 
                          to={`/docs/${category.articles[0]?.slug}`} 
                          className="text-xs font-medium text-muted-foreground group-hover:text-foreground flex items-center gap-1 transition-colors"
                        >
                          Browse Category <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>

        {/* --- BOTTOM CTA --- */}
        <section className="max-w-4xl mx-auto px-4 mt-24 text-center">
          <div className="bg-gradient-to-br from-secondary/50 to-background border border-white/5 rounded-2xl p-12 relative overflow-hidden">
             <div className="relative z-10">
               <h3 className="text-2xl font-semibold mb-2">Still need help?</h3>
               <p className="text-muted-foreground mb-6">Can't find the answer you're looking for? Our support team is here to help.</p>
               <Link to="/contact">
                 <button className="glow-button px-6 py-2.5 rounded-full text-white text-sm font-medium">
                   Contact Support
                 </button>
               </Link>
             </div>
             {/* Background glow */}
             <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[80px] rounded-full pointer-events-none" />
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}