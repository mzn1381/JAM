import { Metadata } from "next";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import ScrollToTop from "@/components/ScrollToTop";
import { Inter } from "next/font/google";
import "node_modules/react-modal-video/css/modal-video.css";
import "../styles/index.css";

import localFont from "next/font/local";

const iranSans = localFont({
  src: [
    {
      path: "../public/fonts/IRANSansWeb_Light.woff2",
      weight: "300",
      style: "normal",
    },
    {
      path: "../public/fonts/IRANSansWeb.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/IRANSansWeb_Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/fonts/IRANSansWeb_Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-iran-sans",
});
const inter = Inter({ subsets: ["latin"] });

// Use NEXT_PUBLIC_SITE_URL when provided; otherwise leave metadataBase undefined so no hard-coded production URL remains in source
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ? process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "") : undefined;
const GA_MEASUREMENT_ID = "G-LVLEB8KDJ7";

export const metadata: Metadata = {
  // Generic site-wide metadata. Page-level metadata (app/page.tsx) will extend/override for the homepage.
  title: "پیشکار — دستیار هوشمند کسب‌وکار",
  description: "پیشکار؛ پلتفرمی برای ساخت دستیارهای هوشمند فارسی‌زبان و اتصال آنها به سرویس‌ها و فرایندهای کسب‌وکار شما.",
  keywords: [
    "پیشکار",
    "دستیار هوشمند",
    "هوش مصنوعی",
    "AI Assistant",
    "Agentic AI",
    "AIaaS",
    "دستیار کسب و کار",
  ],
  authors: [{ name: "پیشکار" }],
  creator: "پیشکار",
  publisher: "پیشکار",
  metadataBase: SITE_URL ? new URL(SITE_URL) : undefined,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning lang="fa" dir="rtl" style={{ scrollBehavior: "smooth" }}>
      {/*
        <head /> will contain the components returned by the nearest parent
        head.js. Find out more at https://beta.nextjs.org/docs/api-reference/file-conventions/head
      */}
      <head>
        <script
          async
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_MEASUREMENT_ID}');
            `,
          }}
        />
      </head>

      <body className={`bg-[#FCFCFC] dark:bg-black ${iranSans.className}`}>
        <Providers>
          <Header />
          {children}
          <Footer />
          <ScrollToTop />
        </Providers>
      </body>
    </html>
  );
}

import { Providers } from "./providers";
