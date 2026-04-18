import AppShell from "../shared/layout/AppShell.jsx";
import AppSidebar from "../shared/ui/organisms/AppSidebar.jsx";
import ShopSkinsSection from "../components/organisms/ShopSkinsSection.jsx";

export default function ShopPage() {
  return (
    <AppShell sidebar={<AppSidebar />} scrollable>
      <ShopSkinsSection />
    </AppShell>
  );
}
