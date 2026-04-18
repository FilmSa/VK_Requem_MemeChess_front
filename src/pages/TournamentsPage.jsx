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
            Экран переведен на общий shell-слой. Теперь сюда можно добавлять
            турнирную сетку, фильтры и карточки событий отдельно от navigation-
            логики и глобального layout.
          </p>
        </Card>
      </div>
    </AppShell>
  );
}
