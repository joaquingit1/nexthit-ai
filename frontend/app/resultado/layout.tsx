import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Resultado del Analisis",
};

export default function ResultadoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
