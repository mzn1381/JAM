import AboutSectionOne from "@/components/About/AboutSectionOne";
import AboutSectionTwo from "@/components/About/AboutSectionTwo";
import Blog from "@/components/Blog";
import Brands from "@/components/Brands";
import B2BDemoSection from "@/components/B2BDemoSection";
import ScrollUp from "@/components/Common/ScrollUp";
import Contact from "@/components/Contact";
import Features from "@/components/Features";
import Hero from "@/components/Hero";
import Pricing from "@/components/Pricing";
import Testimonials from "@/components/Testimonials";
import Video from "@/components/Video";
import { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "";
const canonical = SITE_URL ? `${SITE_URL.replace(/\/$/, "")}/` : undefined;

export const metadata: Metadata = {
  title: "پیشکار — دستیار هوشمند کسب‌وکار",
  description:
    "پیشکار پلتفرمی برای ساخت دستیارهای هوشمند فارسی‌زبان (Agentic AI) برای کسب‌وکارها و سرویس‌ها — اتوماسیون گفتگو، اجرای وظایف و یکپارچه‌سازی با سرویس‌های موجود.",
  keywords: ["پیشکار", "دستیار هوشمند", "هوش مصنوعی", "Agentic AI", "AIaaS", "دستیار کسب‌وکار"],
  authors: [{ name: "پیشکار" }],
  creator: "پیشکار",
  publisher: "پیشکار",
  alternates: {
    canonical: canonical,
  },
  openGraph: {
    title: "پیشکار — دستیار هوشمند کسب‌وکار",
    description:
      "پیشکار پلتفرمی برای ساخت دستیارهای هوشمند فارسی‌زبان که فرایندها را خودکار می‌کند و به سرویس‌های سازمانی متصل می‌شود.",
    siteName: "پیشکار",
    type: "website",
    url: canonical ?? undefined,
    locale: "fa_IR",
    images: ["/images/favicon.png", "/images/logo/logo.svg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "پیشکار — دستیار هوشمند کسب‌وکار",
    description:
      "پیشکار پلتفرمی برای ساخت دستیارهای هوشمند فارسی‌زبان که فرایندها را خودکار می‌کند و به سرویس‌های سازمانی متصل می‌شود.",
    images: ["/images/favicon.png"],
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: "پیشکار",
        url: SITE_URL || "",
        logo: SITE_URL ? `${SITE_URL.replace(/\/$/, "")}/images/logo/logo.svg` : "/images/logo/logo.svg",
        sameAs: ["https://www.linkedin.com/company/mypishkar/"],
      },
      {
        "@type": "WebSite",
        url: SITE_URL || "",
        name: "پیشکار",
        description:
          "پلتفرمی برای ساخت و ارائه دستیارهای هوشمند فارسی‌زبان برای کسب‌وکارها؛ اتوماسیون گفتگو و اجرای وظایف متصل به سرویس‌های سازمانی.",
      },
      {
        "@type": "SoftwareApplication",
        name: "پیشکار",
        description:
          "دستیار هوشمند و Agentic AI برای کسب‌وکارها — اجرای وظایف، پاسخ به کاربران و یکپارچه‌سازی با سرویس‌های موجود.",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        url: SITE_URL || "",
      },
    ],
  };

  return (
    <>
      {/* Structured data JSON-LD (server-side output) */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <ScrollUp />
      <Hero />
      <B2BDemoSection />
      <Video />
      <Features />
      {/* <Brands /> */}
      <AboutSectionOne />
      <AboutSectionTwo />
      <Testimonials />
      <Pricing />
      {/* <Blog /> */}
      <Contact />
    </>
  );
}
