import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { SEO } from "@/components/SEO";
import { Envelope, ChatCircleText, Buildings } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

export default function Contact() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO title="Contact Us - TradeOmen" description="Get in touch with the TradeOmen team." />
      <Navbar />
      
      <main className="flex-grow pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16">
            
            {/* Info */}
            <div>
              <h1 className="text-4xl font-light tracking-tight mb-6">Get in touch</h1>
              <p className="text-lg text-muted-foreground mb-12">
                Have a feature request? Found a bug? Or just want to talk trading strategy? 
                We read every message.
              </p>

              <div className="space-y-8">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <ChatCircleText className="w-6 h-6 text-primary" weight="duotone" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">Support</h3>
                    <p className="text-sm text-muted-foreground mb-1">For help with your account or imports.</p>
                    <a href="mailto:support@tradeomen.com" className="text-primary hover:underline">support@tradeomen.com</a>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-secondary/50 flex items-center justify-center shrink-0">
                    <Buildings className="w-6 h-6 text-foreground" weight="duotone" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">Partnerships</h3>
                    <p className="text-sm text-muted-foreground mb-1">For brokers and prop firms.</p>
                    <a href="mailto:partners@tradeomen.com" className="text-foreground hover:underline">partners@tradeomen.com</a>
                  </div>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="bg-card/30 border border-white/5 p-8 rounded-2xl">
              <form className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">First name</label>
                    <input type="text" className="w-full bg-background border border-border rounded-lg px-4 py-2.5 focus:border-primary outline-none" placeholder="Jane" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Last name</label>
                    <input type="text" className="w-full bg-background border border-border rounded-lg px-4 py-2.5 focus:border-primary outline-none" placeholder="Doe" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <input type="email" className="w-full bg-background border border-border rounded-lg px-4 py-2.5 focus:border-primary outline-none" placeholder="jane@example.com" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Message</label>
                  <textarea className="w-full h-32 bg-background border border-border rounded-lg px-4 py-2.5 focus:border-primary outline-none resize-none" placeholder="How can we help?" />
                </div>

                <Button className="w-full glow-button">Send Message</Button>
              </form>
            </div>

          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}