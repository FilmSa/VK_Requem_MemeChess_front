import AppShell from "../shared/layout/AppShell.jsx";
import AppSidebar from "../shared/ui/organisms/AppSidebar.jsx";
import Card from "../shared/ui/atoms/Card.jsx";

export default function TournamentsPage() {
  return (
    <AppShell sidebar={<AppSidebar />}>
      <div className="page-placeholder">
        <Card className="page-placeholder__card">
          <h1 className="page-placeholder__title">Турниры</h1>
          <p className="page-placeholder__text">
            Турниры пока на стадии разработки
          </p>
        </Card>
      </div>
    </AppShell>
  );
}
