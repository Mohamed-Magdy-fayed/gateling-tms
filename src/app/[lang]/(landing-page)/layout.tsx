import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { HydrateClient } from "@/trpc/server";

export default async function LandingPageLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <HydrateClient>
      <Header />
      <main>{children}</main>
      <Footer />
    </HydrateClient>
  );
}
