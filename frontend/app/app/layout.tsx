import type { Metadata } from "next";

import DashboardLayout from "@/components/DashboardLayout";

export const metadata: Metadata = {
  title: "Analizar Video",
};

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
