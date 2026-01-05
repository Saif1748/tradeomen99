import { 
  RocketLaunch, 
  FileCsv, 
  Robot, 
  ChartLineUp, 
  BookOpen, 
  ShieldCheck,
  IconProps
} from "@phosphor-icons/react";
import { ForwardRefExoticComponent, RefAttributes } from "react";

export interface DocArticle {
  title: string;
  slug: string;
  content: string; // In a real app, this could be Markdown or HTML
}

export interface DocCategory {
  id: string;
  title: string;
  icon: ForwardRefExoticComponent<IconProps & RefAttributes<SVGSVGElement>>;
  description: string;
  articles: DocArticle[];
}

export const docsCategories: DocCategory[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: RocketLaunch,
    description: "Account setup, connecting your first broker, and platform basics.",
    articles: [
      {
        title: "Quick Start Guide",
        slug: "quick-start-guide",
        content: `
          <h3>Welcome to TradeOmen</h3>
          <p>TradeOmen is designed to be the ultimate operating system for your trading business. This guide will help you set up your workspace and log your first trade in under 5 minutes.</p>
          
          <br />
          <h4>1. Setting up your account</h4>
          <p>When you first log in, you will be prompted to select your base currency and time zone. It is critical to set these correctly as they affect how your P&L and trade times are reported.</p>
          
          <br />
          <h4>2. Defining your Strategy</h4>
          <p>TradeOmen organizes trades by "Strategy". Before logging a trade, go to the <strong>Strategies</strong> tab and create your first one (e.g., "Trend Following" or "Scalping").</p>
          
          <br />
          <h4>3. Importing Data</h4>
          <p>You have two options to get data into TradeOmen:</p>
          <ul>
            <li><strong>Smart Import:</strong> Upload a CSV from your broker.</li>
            <li><strong>Manual Entry:</strong> Use the "New Trade" button on the dashboard.</li>
          </ul>
        `
      },
      { title: "Supported Brokers", slug: "supported-brokers", content: "<p>Content coming soon...</p>" },
      { title: "Managing Your Subscription", slug: "managing-subscription", content: "<p>Content coming soon...</p>" }
    ]
  },
  {
    id: "importing",
    title: "Smart Import",
    icon: FileCsv,
    description: "How to use the AI CSV importer for Binance, ByBit, and others.",
    articles: [
      { title: "Drag & Drop Import", slug: "drag-drop-import", content: "<p>Content coming soon...</p>" },
      { title: "Fixing CSV Errors", slug: "fixing-csv-errors", content: "<p>Content coming soon...</p>" },
      { title: "API Sync vs CSV", slug: "api-sync-vs-csv", content: "<p>Content coming soon...</p>" }
    ]
  },
  {
    id: "ai-coach",
    title: "AI & Insights",
    icon: Robot,
    description: "Mastering the AI Chat. How to ask the right questions to find your edge.",
    articles: [
      { title: "Example AI Prompts", slug: "example-ai-prompts", content: "<p>Content coming soon...</p>" },
      { title: "Understanding AI Risk Analysis", slug: "ai-risk-analysis", content: "<p>Content coming soon...</p>" },
      { title: "Psychology Scoring", slug: "psychology-scoring", content: "<p>Content coming soon...</p>" }
    ]
  },
  {
    id: "analytics",
    title: "Analytics & Reports",
    icon: ChartLineUp,
    description: "Deep dive into Win Rate, R-Multiple, and Expectancy calculations.",
    articles: [
      { title: "Reading the Dashboard", slug: "reading-dashboard", content: "<p>Content coming soon...</p>" },
      { title: "Filter Logic", slug: "filter-logic", content: "<p>Content coming soon...</p>" },
      { title: "Exporting Reports", slug: "exporting-reports", content: "<p>Content coming soon...</p>" }
    ]
  },
  {
    id: "journaling",
    title: "Trade Journaling",
    icon: BookOpen,
    description: "Best practices for logging manual trades, tagging, and adding notes.",
    articles: [
      { title: "Adding Screenshots", slug: "adding-screenshots", content: "<p>Content coming soon...</p>" },
      { title: "Using Tags Effectively", slug: "using-tags", content: "<p>Content coming soon...</p>" },
      { title: "Daily Review Routine", slug: "daily-review", content: "<p>Content coming soon...</p>" }
    ]
  },
  {
    id: "security",
    title: "Security & Privacy",
    icon: ShieldCheck,
    description: "How we protect your trading data and personal information.",
    articles: [
      { title: "Data Encryption", slug: "data-encryption", content: "<p>Content coming soon...</p>" },
      { title: "Privacy Policy", slug: "privacy-policy", content: "<p>Content coming soon...</p>" },
      { title: "Two-Factor Authentication", slug: "2fa", content: "<p>Content coming soon...</p>" }
    ]
  }
];