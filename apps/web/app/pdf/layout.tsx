import { AppHeader } from "@/components/layouts/app-header";
import { ReactNode } from "react";

export default function PdfLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/30">
      <AppHeader />
      <main className="container mx-auto py-8 px-4">{children}</main>
    </div>
  );
}
