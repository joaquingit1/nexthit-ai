import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Analizar Video",
};

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
