import { useMemo, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";

import AuthButton from "../components/auth/AuthButton.jsx";
import AuthCard from "../components/auth/AuthCard.jsx";
import AuthInput from "../components/auth/AuthInput.jsx";
import { useAuth } from "../features/auth/useAuth.js";

import startGameIcon from "../../icons/startgame.svg";

const defaultValues = {
  login: "",
  password: "",
};

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, isInitializing } = useAuth();

  const [form, setForm] = useState(defaultValues);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectTo = location.state?.from?.pathname || "/profile";
  const isDisabled = useMemo(
    () =>
      isSubmitting ||
      isInitializing ||
      !form.login.trim() ||
      !form.password.trim(),
    [form.login, form.password, isInitializing, isSubmitting]
  );

  if (!isInitializing && isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({ ...current, [name]: value }));
    setSubmitError("");
    setFieldErrors((current) => {
      if (!current[name]) {
        return current;
      }

      const nextErrors = { ...current };
      delete nextErrors[name];
      return nextErrors;
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setIsSubmitting(true);
    setSubmitError("");
    setFieldErrors({});

    try {
      await login({
        login: form.login.trim(),
        password: form.password,
      });
      navigate(redirectTo, { replace: true });
    } catch (error) {
      setSubmitError(error.message || "Не удалось выполнить вход.");
      setFieldErrors(error.fields || {});
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen w-screen items-center justify-center overflow-hidden bg-[linear-gradient(312deg,#0b0f2b_0%,#2b1a58_13.94%,#3b1f6a_29.33%,#1a1446_50.47%,#341d5b_68.17%,#1f1852_88.46%,#0b0f2b_100%)] px-4 py-[10px] sm:px-6">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(114,86,190,0.14)_1px,transparent_1px),linear-gradient(90deg,rgba(114,86,190,0.14)_1px,transparent_1px)] bg-[size:32px_32px]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_62%_78%,rgba(47,200,227,0.25),transparent_30%),radial-gradient(circle_at_50%_20%,rgba(255,0,200,0.18),transparent_24%)]" />

      <div className="relative z-10 flex w-full max-w-[420px] flex-col">
        <AuthCard title="Вход">
          <form onSubmit={handleSubmit} className="flex flex-col gap-[20px]">
            <div className="flex flex-col gap-[10px]">
              <AuthInput
                id="login"
                name="login"
                label="Логин или почта"
                type="text"
                placeholder="Игрок_01"
                value={form.login}
                onChange={handleChange}
                icon="user"
                error={fieldErrors.login}
              />

              <AuthInput
                id="password"
                name="password"
                label="Пароль"
                type="password"
                placeholder="Введите пароль"
                value={form.password}
                onChange={handleChange}
                icon="lock"
                error={fieldErrors.password}
              />
            </div>

            {submitError ? (
              <div className="rounded-[14px] border border-[#ff6b6b]/40 bg-[#351828] px-[14px] py-[12px] text-[14px] text-[#ffd0d0]">
                {submitError}
              </div>
            ) : null}

            <div>
              <AuthButton type="submit" icon={startGameIcon} disabled={isDisabled}>
                {isSubmitting ? "Входим..." : "Войти"}
              </AuthButton>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-[10px] text-[16px]">
              <span className="text-[#c0c5d8]">Ещё нет аккаунта?</span>
              <Link
                to="/register"
                state={{ from: location.state?.from }}
                className="font-medium text-[#2fc8e3] no-underline transition-colors hover:text-[#7be9ff]"
              >
                Зарегистрироваться
              </Link>
            </div>
          </form>
        </AuthCard>
      </div>
    </div>
  );
}
