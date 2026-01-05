import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { motion } from "framer-motion";
import { EnvelopeSimple, ChatCircleText, CreditCard, UserCircle } from "@phosphor-icons/react";

const contactMethods = [
  {
    icon: ChatCircleText,
    title: "Customer Support",
    description: "Facing issues with your dashboard or strategy builder? Our team is ready to help.",
    email: "support@tradeomen.com",
    color: "text-blue-400",
    bg: "bg-blue-400/10"
  },
  {
    icon: EnvelopeSimple,
    title: "General Inquiries",
    description: "For partnerships, press, or just to say hello. We'd love to hear from you.",
    email: "hello@tradeomen.com",
    color: "text-primary",
    bg: "bg-primary/10"
  },
  {
    icon: CreditCard,
    title: "Billing & Subscriptions",
    description: "Questions about your invoice, upgrading, or refund requests?",
    email: "billing@tradeomen.com",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10"
  },
  {
    icon: UserCircle,
    title: "Founder's Desk",
    description: "For urgent matters or direct feedback. We value transparency.",
    email: "saifshaikh@tradeomen.com",
    color: "text-purple-400",
    bg: "bg-purple-400/10"
  }
];

const Contact = () => {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-28 pb-12 lg:pt-40 lg:pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-secondary text-muted-foreground text-sm font-medium mb-6 border border-border">
              Contact Us
            </span>
            <h1 className="text-4xl lg:text-6xl font-light tracking-tight-premium leading-hero mb-6">
              How can we <br />
              <span className="text-gradient-primary font-medium">help you?</span>
            </h1>
            <p className="text-lg text-muted-foreground font-light max-w-2xl mx-auto">
              Choose the right channel below and we'll get back to you within 24 hours.
              For automated updates, look out for emails from <span className="font-medium text-foreground">no-reply@tradeomen.com</span>.
            </p>
          </motion.div>
        </div>

        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-6 px-4">
          {contactMethods.map((method, index) => (
            <motion.a
              key={method.title}
              href={`mailto:${method.email}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="glass-card p-8 rounded-2xl group hover:border-primary/50 transition-all duration-300 cursor-pointer flex items-start gap-6"
            >
              <div className={`w-12 h-12 rounded-xl ${method.bg} ${method.color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                <method.icon size={24} weight="fill" />
              </div>
              <div>
                <h3 className="text-xl font-medium mb-2 group-hover:text-primary transition-colors">
                  {method.title}
                </h3>
                <p className="text-muted-foreground font-light text-sm mb-4 leading-relaxed">
                  {method.description}
                </p>
                <span className="text-sm font-medium text-foreground border-b border-primary/30 pb-0.5">
                  {method.email}
                </span>
              </div>
            </motion.a>
          ))}
        </div>
      </div>

      <Footer />
    </main>
  );
};

export default Contact;