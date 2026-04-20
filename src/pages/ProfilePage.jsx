import AppSidebar from "../shared/ui/organisms/AppSidebar.jsx";
import { useAuth } from "../features/auth/useAuth.js";
import { withAssetBase } from "../shared/lib/assets.js";

const fallbackAvatar = withAssetBase("/images/default-avatar.png");

function formatDate(value) {
  if (!value) {
    return "Не указана";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Не указана";
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function cardStyle() {
  return {
    borderColor: "var(--status-card-border)",
    background: "var(--status-card-background)",
    boxShadow: "var(--status-card-shadow)",
  };
}

function innerCardStyle() {
  return {
    borderColor: "var(--color-border)",
    background: "var(--game-panel-bg-elevated)",
  };
}

export default function ProfilePage() {
  const { user, logout } = useAuth();

  return (
    <div className="app-page h-screen w-screen overflow-hidden">
      <div className="flex h-full w-full overflow-hidden">
        <AppSidebar />

        <main className="flex-1 overflow-y-auto px-[48px] py-[34px]">
          <div className="mx-auto flex max-w-[980px] flex-col gap-[24px]">
            <header>
              <p
                className="text-[14px] uppercase tracking-[0.28em]"
                style={{ color: "var(--color-accent)" }}
              >
                Аккаунт
              </p>
              <h1
                className="mt-[10px] text-[40px] font-semibold tracking-[-0.03em]"
                style={{ color: "var(--color-text)" }}
              >
                {user.username}
              </h1>
            </header>

            <section className="grid gap-[24px] lg:grid-cols-[320px_minmax(0,1fr)]">
              <div
                className="rounded-[30px] border p-[24px]"
                style={cardStyle()}
              >
                <img
                  src={user.avatar_url || fallbackAvatar}
                  alt={`Аватар ${user.username}`}
                  className="h-[120px] w-[120px] rounded-full object-cover"
                  style={{
                    border: "1px solid var(--sidebar-avatar-border)",
                    boxShadow: "0 16px 32px rgba(0,0,0,0.18)",
                  }}
                />

                <div className="mt-[18px]">
                  <h2
                    className="text-[26px] font-semibold"
                    style={{ color: "var(--color-text)" }}
                  >
                    {user.username}
                  </h2>
                  <p
                    className="mt-[6px] break-all text-[14px]"
                    style={{ color: "var(--color-accent)" }}
                  >
                    {user.email || "Почта не указана"}
                  </p>
                </div>

                <div
                  className="mt-[24px] rounded-[22px] border p-[16px]"
                  style={innerCardStyle()}
                >
                  <p
                    className="text-[12px] uppercase tracking-[0.24em]"
                    style={{ color: "var(--game-panel-label)" }}
                  >
                    Дата регистрации
                  </p>
                  <p
                    className="mt-[8px] text-[18px] font-medium"
                    style={{ color: "var(--color-text)" }}
                  >
                    {formatDate(user.created_at)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={logout}
                  className="mt-[20px] inline-flex h-[48px] w-full items-center justify-center rounded-[18px] border text-[15px] font-semibold transition hover:brightness-105"
                  style={{
                    borderColor: "var(--sidebar-secondary-button-border)",
                    background: "var(--sidebar-secondary-button-bg)",
                    color: "var(--sidebar-secondary-button-text)",
                  }}
                >
                  Выйти
                </button>
              </div>

              <div
                className="rounded-[30px] border p-[24px]"
                style={cardStyle()}
              >
                <div className="grid gap-[16px] md:grid-cols-2">
                  <div
                    className="rounded-[22px] border p-[18px]"
                    style={innerCardStyle()}
                  >
                    <p
                      className="text-[12px] uppercase tracking-[0.24em]"
                      style={{ color: "var(--game-panel-label)" }}
                    >
                      ID пользователя
                    </p>
                    <p
                      className="mt-[10px] break-all text-[15px] leading-[1.5]"
                      style={{ color: "var(--color-text)" }}
                    >
                      {user.id}
                    </p>
                  </div>

                  <div
                    className="rounded-[22px] border p-[18px] md:col-span-2"
                    style={innerCardStyle()}
                  >
                    <p
                      className="text-[12px] uppercase tracking-[0.24em]"
                      style={{ color: "var(--game-panel-label)" }}
                    >
                      Данные профиля
                    </p>
                    <ul
                      className="mt-[10px] flex flex-col gap-[8px] text-[15px] leading-[1.5]"
                      style={{ color: "var(--color-text)" }}
                    >
                      <li>
                        <span style={{ color: "var(--color-accent)" }}>
                          Имя пользователя:
                        </span>{" "}
                        {user.username}
                      </li>
                      <li>
                        <span style={{ color: "var(--color-accent)" }}>
                          Почта:
                        </span>{" "}
                        {user.email || "Не указана"}
                      </li>
                      <li>
                        <span style={{ color: "var(--color-accent)" }}>
                          Аватар:
                        </span>{" "}
                        {user.avatar_url || "Не задан"}
                      </li>
                      <li>
                        <span style={{ color: "var(--color-accent)" }}>
                          Дата создания:
                        </span>{" "}
                        {formatDate(user.created_at)}
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
