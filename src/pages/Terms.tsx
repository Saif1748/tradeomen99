import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

const Terms = () => {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-32 pb-20 px-4 max-w-3xl mx-auto">
        <h1 className="text-3xl md:text-5xl font-light mb-8">Terms of Service</h1>
        <div className="prose prose-zinc dark:prose-invert max-w-none font-light">
          <p className="text-lg text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString()}</p>
          
          <h3>1. Agreement to Terms</h3>
          <p>
            By accessing our website at TradeOmen, you agree to be bound by these terms of service and to comply with all applicable laws and regulations.
          </p>

          <h3>2. Use License</h3>
          <p>
            Permission is granted to temporarily download one copy of the materials (information or software) on TradeOmen's website for personal, non-commercial transitory viewing only.
          </p>

          <h3>3. Disclaimer</h3>
          <p>
            The materials on TradeOmen's website are provided on an 'as is' basis. TradeOmen makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
          </p>
          
          <p>
            <strong>Trading involves risk.</strong> Past performance is not indicative of future results. TradeOmen is an analytics tool, not a financial advisor.
          </p>

          <h3>4. Governing Law</h3>
          <p>
            These terms and conditions are governed by and construed in accordance with the laws of the jurisdiction in which TradeOmen operates.
          </p>
        </div>
      </div>
      <Footer />
    </main>
  );
};

export default Terms;