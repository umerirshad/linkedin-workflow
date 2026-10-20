import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LinkedIn Workflow",
  description: "A focused, human-in-the-loop LinkedIn workflow workspace.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
