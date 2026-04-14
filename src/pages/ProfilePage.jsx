import Sidebar from "../components/organisms/Sidebar.jsx";
import { useAuth } from "../features/auth/useAuth.js";

const fallbackAvatar = "/images/default-avatar.png";

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

export default function ProfilePage() {
  const { user, logout } = useAuth();

  return (
    <div className="h-screen w-screen overflow-hidden bg-[linear-gradient(312deg,#0b0f2b_0%,#2b1a58_13.94%,#3b1f6a_29.33%,#1a1446_50.47%,#341d5b_68.17%,#1f1852_88.46%,#0b0f2b_100%)] text-white">
      <div className="flex h-full w-full overflow-hidden">
        <Sidebar />

        <main className="flex-1 overflow-y-auto px-[48px] py-[34px]">
          <div className="mx-auto flex max-w-[980px] flex-col gap-[24px]">
            <header>
              <p className="text-[14px] uppercase tracking-[0.28em] text-[#82ebff]">
                Аккаунт
              </p>
              <h1 className="mt-[10px] text-[40px] font-semibold tracking-[-0.03em] text-white">
                {user.username}
              </h1>
              <p className="mt-[8px] max-w-[560px] text-[16px] leading-[1.55] text-[#c6d6f5]">
                Профиль загружается из реальной авторизации backend и
                остаётся доступным после обновления страницы.
              </p>
            </header>

            <section className="grid gap-[24px] lg:grid-cols-[320px_minmax(0,1fr)]">
              <div className="rounded-[30px] border border-white/10 bg-[#17142d]/92 p-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.32)]">
                <img
                  src={user.avatar_url || fallbackAvatar}
                  alt={`Аватар ${user.username}`}
                  className="h-[120px] w-[120px] rounded-full border border-white/15 object-cover shadow-[0_16px_32px_rgba(0,0,0,0.32)]"
                />

                <div className="mt-[18px]">
                  <h2 className="text-[26px] font-semibold text-white">
                    {user.username}
                  </h2>
                  <p className="mt-[6px] break-all text-[14px] text-[#98ebff]">
                    {user.email || "Почта не указана"}
                  </p>
                </div>

                <div className="mt-[24px] rounded-[22px] border border-white/8 bg-[#0d1332]/90 p-[16px]">
                  <p className="text-[12px] uppercase tracking-[0.24em] text-[#9cc8ff]">
                    Дата регистрации
                  </p>
                  <p className="mt-[8px] text-[18px] font-medium text-white">
                    {formatDate(user.created_at)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={logout}
                  className="mt-[20px] inline-flex h-[48px] w-full items-center justify-center rounded-[18px] border border-white/12 bg-[#251b4d] text-[15px] font-semibold text-white transition hover:border-[#6beeff]/40 hover:bg-[#2c2160]"
                >
                  Выйти
                </button>
              </div>

              <div className="rounded-[30px] border border-white/10 bg-[#17142d]/92 p-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.32)]">
                <div className="grid gap-[16px] md:grid-cols-2">
                  <div className="rounded-[22px] border border-white/8 bg-[#0d1332]/90 p-[18px]">
                    <p className="text-[12px] uppercase tracking-[0.24em] text-[#9cc8ff]">
                      ID пользователя
                    </p>
                    <p className="mt-[10px] break-all text-[15px] leading-[1.5] text-white">
                      {user.id}
                    </p>
                  </div>

                  <div className="rounded-[22px] border border-white/8 bg-[#0d1332]/90 p-[18px]">
                    <p className="text-[12px] uppercase tracking-[0.24em] text-[#9cc8ff]">
                      Состояние сессии
                    </p>
                    <p className="mt-[10px] text-[15px] leading-[1.5] text-white">
                      Авторизация работает через Bearer JWT и восстанавливается
                      из сохранённого токена на фронтенде.
                    </p>
                  </div>

                  <div className="rounded-[22px] border border-white/8 bg-[#0d1332]/90 p-[18px] md:col-span-2">
                    <p className="text-[12px] uppercase tracking-[0.24em] text-[#9cc8ff]">
                      Данные профиля с backend
                    </p>
                    <ul className="mt-[10px] flex flex-col gap-[8px] text-[15px] leading-[1.5] text-white">
                      <li>
                        <span className="text-[#82ebff]">Имя пользователя:</span>{" "}
                        {user.username}
                      </li>
                      <li>
                        <span className="text-[#82ebff]">Почта:</span>{" "}
                        {user.email || "Не указана"}
                      </li>
                      <li>
                        <span className="text-[#82ebff]">Аватар:</span>{" "}
                        {user.avatar_url || "Не задан"}
                      </li>
                      <li>
                        <span className="text-[#82ebff]">Дата создания:</span>{" "}
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
