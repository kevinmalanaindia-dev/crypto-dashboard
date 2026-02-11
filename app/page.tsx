// app/page.tsx
import ClientPage from "./client-page";

export default async function Page() {
  // Force client-side fetch to avoid build-time network blocks
  return <ClientPage initialAssets={[]} />;
}
