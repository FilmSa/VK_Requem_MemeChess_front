import { useMemo, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";

import AuthButton from "../components/auth/AuthButton.jsx";
import AuthCard from "../components/auth/AuthCard.jsx";
import AuthInput from "../components/auth/AuthInput.jsx";
import { useAuth } from "../features/auth/useAuth.js";
import { useNotifications } from "../features/notifications/useNotifications.js";

import friendGameIcon from "../../icons/friendgame.svg";

const defaultValues = {
  nickname: "",
  email: "",
  password: "",
  confirmPassword: "",
};

const registerErrorNotificationId = "auth-register-error";

function validateForm(form) {
  const errors = {};

  if (form.nickname.trim().length < 3) {
    errors.nickname =
      "Имя пользователя должно содержать минимум 3 символа.";
  }

  if (!form.email.includes("@")) {
    errors.email = "Введите корректную почту.";
  }

  if (form.password.length < 8) {
    errors.password = "Пароль должен содержать не менее 8 символов.";
  }

  if (form.confirmPassword !== form.password) {
    errors.confirmPassword = "Пароли не совпадают.";
  }

  return errors;
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { register, isAuthenticated, isInitializing } = useAuth();
  const { showNotification, dismissNotification } = useNotifications();

  const [form, setForm] = useState(defaultValues);
  const [serverErrors, setServerErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const clientErrors = useMemo(() => validateForm(form), [form]);
  const redirectTo = location.state?.from?.pathname || "/profile";
  const isFormFilled =
    form.nickname.trim() &&
    form.email.trim() &&
    form.password.trim() &&
    form.confirmPassword.trim();

  const isDisabled =
    isSubmitting ||
    isInitializing ||
    !isFormFilled ||
    Object.keys(clientErrors).length > 0;

  if (!isInitializing && isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  function clearSubmitError() {
    setSubmitError("");
    dismissNotification(registerErrorNotificationId);
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({ ...current, [name]: value }));
    clearSubmitError();
    setServerErrors((current) => {
      const backendFieldName = name === "nickname" ? "username" : name;
      if (!current[backendFieldName]) {
        return current;
      }

      const nextErrors = { ...current };
      delete nextErrors[backendFieldName];
      return nextErrors;
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (Object.keys(clientErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    clearSubmitError();
    setServerErrors({});

    try {
      await register({
        username: form.nickname.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      dismissNotification(registerErrorNotificationId);
      navigate(redirectTo, { replace: true });
    } catch (error) {
      const message = error.message || "Не удалось создать аккаунт.";

      setSubmitError(message);
      setServerErrors(error.fields || {});
      showNotification({
        id: registerErrorNotificationId,
        title: "Ошибка регистрации",
        message,
        tone: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-screen w-screen px-4 py-10 sm:px-6">
      <div className="auth-screen__inner flex w-full max-w-[420px] flex-col">
        <AuthCard title="Регистрация">
          <form onSubmit={handleSubmit} className="flex flex-col gap-[20px]">
            <div className="flex flex-col gap-[20px]">
              <AuthInput
                id="nickname"
                name="nickname"
                label="Имя пользователя"
                type="text"
                placeholder="Игрок_01"
                value={form.nickname}
                onChange={handleChange}
                icon="user"
                error={serverErrors.username || clientErrors.nickname}
              />

              <AuthInput
                id="email"
                name="email"
                label="Электронная почта"
                type="email"
                placeholder="user@example.com"
                value={form.email}
                onChange={handleChange}
                icon="mail"
                error={serverErrors.email || clientErrors.email}
              />

              <AuthInput
                id="password"
                name="password"
                label="Пароль"
                type="password"
                placeholder="Не менее 8 символов"
                value={form.password}
                onChange={handleChange}
                icon="lock"
                error={serverErrors.password || clientErrors.password}
              />

              <AuthInput
                id="confirmPassword"
                name="confirmPassword"
                label="Подтвердите пароль"
                type="password"
                placeholder="Повторите пароль"
                value={form.confirmPassword}
                onChange={handleChange}
                icon="lock"
                error={clientErrors.confirmPassword}
              />
            </div>

            {submitError ? (
              <div
                role="alert"
                className="rounded-[14px] border px-[14px] py-[12px] text-[14px] leading-[1.45]"
                style={{
                  borderColor: "rgba(255, 124, 147, 0.45)",
                  background: "rgba(255, 124, 147, 0.08)",
                  color: "var(--color-text)",
                }}
              >
                {submitError}
              </div>
            ) : null}

            <div>
              <AuthButton
                type="submit"
                icon={friendGameIcon}
                disabled={isDisabled}
              >
                {isSubmitting ? "Создаем аккаунт..." : "Создать аккаунт"}
              </AuthButton>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-[10px] text-[16px]">
              <span style={{ color: "var(--color-text-muted)" }}>
                Уже есть аккаунт?
              </span>
              <Link
                to="/login"
                state={{ from: location.state?.from }}
                className="font-medium no-underline transition-colors"
                style={{ color: "var(--auth-link-secondary)" }}
              >
                Войти
              </Link>
            </div>
          </form>
        </AuthCard>
      </div>
    </div>
  );
}
