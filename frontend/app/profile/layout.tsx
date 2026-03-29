import type { Metadata } from "next";

import DashboardLayout from "@/components/DashboardLayout";

export const metadata: Metadata = {
  title: "Profile",
};

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
