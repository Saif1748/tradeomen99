import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

const Privacy = () => {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-32 pb-20 px-4 max-w-3xl mx-auto">
        <h1 className="text-3xl md:text-5xl font-light mb-8">Privacy Policy</h1>
        <div className="prose prose-zinc dark:prose-invert max-w-none font-light">
          <p className="text-lg text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString()}</p>
          
          <h3>1. Introduction</h3>
          <p>
            Welcome to TradeOmen. We respect your privacy and are committed to protecting your personal data. 
            This privacy policy will inform you as to how we look after your personal data when you visit our website 
            and tell you about your privacy rights.
          </p>

          <h3>2. Data We Collect</h3>
          <p>
            We collect trading data (entry/exit prices, symbols, timestamps) that you explicitly upload or sync to our platform.
            We also collect account information such as your email ({' '}
            <span className="text-foreground">support@tradeomen.com</span> is our contact for data concerns) and usage data.
          </p>

          <h3>3. How We Use Your Data</h3>
          <p>
            Your trading data is used solely to generate analytics and insights for your personal dashboard. 
            We do not sell your individual trading data to third parties.
          </p>

          <h3>4. Contact Us</h3>
          <p>
            If you have any questions about this privacy policy or our privacy practices, please contact us at: 
            <a href="mailto:support@tradeomen.com" className="text-primary hover:underline ml-1">support@tradeomen.com</a>
          </p>
        </div>
      </div>
      <Footer />
    </main>
  );
};

export default Privacy;