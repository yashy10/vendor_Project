import type { Metadata } from "next";
import { Fredoka, Nunito } from "next/font/google";
import "./globals.css";

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Santa Cruz Fair",
  description: "Pay your favorite fair vendors in seconds.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${fredoka.variable} ${nunito.variable} h-full antialiased`}
    >
      <body className="text-ink font-sans min-h-dvh">
        <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pt-8 pb-10">
          {children}
        </div>
      </body>
    </html>
  );
}
