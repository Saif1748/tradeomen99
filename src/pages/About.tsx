import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { SEO } from "@/components/SEO";
import { BrowserFrame } from "@/components/landing/BrowserFrame";
import { Target, Lightbulb, Users } from "@phosphor-icons/react";

export default function About() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO title="About Us - TradeOmen" description="We are building the operating system for profitable traders." />
      <Navbar />
      
      <main className="flex-grow pt-32 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="text-center mb-20">
            <h1 className="text-4xl md:text-5xl font-light tracking-tight mb-8">
              We built the tool <br />
              <span className="text-gradient-primary font-medium">we wished we had.</span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Trading is 90% psychology and 10% execution. Yet, most tools focus only on the charts. 
              We're building TradeOmen to fix the other 90%.
            </p>
          </div>

          {/* Mission Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-24">
            {[
              { icon: Target, title: "Precision", desc: "Data shouldn't be messy. We believe in pixel-perfect accuracy for your P&L." },
              { icon: Lightbulb, title: "Insight", desc: "A journal is useless if you don't read it. We use AI to surface patterns you miss." },
              { icon: Users, title: "Solvency", desc: "Our goal isn't just to help you trade—it's to help you survive and thrive." }
            ].map((item, i) => (
              <div key={i} className="p-6 rounded-2xl bg-card/40 border border-white/5 text-center">
                <div className="w-12 h-12 mx-auto rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <item.icon size={24} weight="duotone" />
                </div>
                <h3 className="font-medium mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* The "Story" Section */}
          <div className="prose prose-invert prose-lg max-w-none">
            <h2 className="text-3xl font-light mb-6">The Problem with Spreadsheets</h2>
            <p className="text-muted-foreground">
              Like many of you, we started tracking trades in Excel. It was tedious. 
              We spent more time fixing formulas than analyzing our behavior. 
              We missed entries. We ignored emotions.
            </p>
            <p className="text-muted-foreground">
              We realized that to become profitable, we needed more than a ledger. 
              We needed a mirror—something that would reflect our habits back to us, objectively and instantly.
            </p>
            
            <div className="my-12">
               <BrowserFrame className="aspect-[21/9] bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                 <span className="text-lg font-medium tracking-widest text-white/50 uppercase">Our Mission</span>
               </BrowserFrame>
            </div>

            <h2 className="text-3xl font-light mb-6">Enter AI</h2>
            <p className="text-muted-foreground">
              With the rise of LLMs, we saw an opportunity. What if your journal could talk back? 
              What if it could warn you when you're tilting? TradeOmen is the realization of that vision. 
              We are currently in public beta, and we invite you to help shape the future of trading analytics.
            </p>
          </div>

        </div>
      </main>
      <Footer />
    </div>
  );
}