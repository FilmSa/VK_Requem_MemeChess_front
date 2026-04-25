import { useMemo, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";

import AuthButton from "../components/auth/AuthButton.jsx";
import AuthCard from "../components/auth/AuthCard.jsx";
import AuthInput from "../components/auth/AuthInput.jsx";
import AuthToggleField from "../components/auth/AuthToggleField.jsx";
import { useAuth } from "../features/auth/useAuth.js";

import startGameIcon from "../../icons/startgame.svg";

const defaultValues = {
  login: "",
  password: "",
};

function validateLoginForm(form) {
  const nextErrors = {};

  if (!form.login.trim()) {
    nextErrors.login = "Введите логин или почту.";
  }

  if (!form.password.trim()) {
    nextErrors.password = "Введите пароль.";
  }

  return nextErrors;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, isInitializing } = useAuth();

  const [form, setForm] = useState(defaultValues);
  const [fieldErrors, setFieldErrors] = useState({});
  const [, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rememberSession, setRememberSession] = useState(true);

  const redirectTo = location.state?.from?.pathname || "/profile";
  const isDisabled = useMemo(
    () => isSubmitting || isInitializing,
    [isInitializing, isSubmitting]
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

    const nextFieldErrors = validateLoginForm(form);
    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      setSubmitError("");
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");
    setFieldErrors({});

    try {
      await login({
        login: form.login.trim(),
        password: form.password,
      }, { remember: rememberSession });
      navigate(redirectTo, { replace: true });
    } catch (error) {
      setSubmitError(error.message || "Не удалось выполнить вход.");
      setFieldErrors(error.fields || {});
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-screen w-screen px-4 py-[10px] sm:px-6">
      <div className="auth-screen__inner flex w-full max-w-[420px] flex-col">
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

            <AuthToggleField
              id="remember-session"
              label="Запомнить меня"
              checked={rememberSession}
              disabled={isDisabled}
              onChange={setRememberSession}
            />

            <div>
              <AuthButton type="submit" icon={startGameIcon} disabled={isDisabled}>
                {isSubmitting ? "Входим..." : "Войти"}
              </AuthButton>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-[10px] text-[16px]">
              <span style={{ color: "var(--color-text-muted)" }}>
                Еще нет аккаунта?
              </span>
              <Link
                to="/register"
                state={{ from: location.state?.from }}
                className="font-medium no-underline transition-colors"
                style={{ color: "var(--auth-link-primary)" }}
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
