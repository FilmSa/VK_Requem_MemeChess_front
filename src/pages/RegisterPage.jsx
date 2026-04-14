import { useMemo, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";

import AuthButton from "../components/auth/AuthButton.jsx";
import AuthCard from "../components/auth/AuthCard.jsx";
import AuthInput from "../components/auth/AuthInput.jsx";
import { useAuth } from "../features/auth/useAuth.js";

import friendGameIcon from "../../icons/friendgame.svg";

const defaultValues = {
  nickname: "",
  email: "",
  password: "",
  confirmPassword: "",
};

function validateForm(form) {
  const errors = {};

  if (form.nickname.trim().length < 3) {
    errors.nickname = "Имя пользователя должно содержать минимум 3 символа.";
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

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({ ...current, [name]: value }));
    setSubmitError("");
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
    setSubmitError("");
    setServerErrors({});

    try {
      await register({
        username: form.nickname.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      navigate(redirectTo, { replace: true });
    } catch (error) {
      setSubmitError(error.message || "Не удалось создать аккаунт.");
      setServerErrors(error.fields || {});
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen w-screen items-center justify-center overflow-hidden bg-[linear-gradient(312deg,#0b0f2b_0%,#2b1a58_13.94%,#3b1f6a_29.33%,#1a1446_50.47%,#341d5b_68.17%,#1f1852_88.46%,#0b0f2b_100%)] px-4 py-10 sm:px-6">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(114,86,190,0.14)_1px,transparent_1px),linear-gradient(90deg,rgba(114,86,190,0.14)_1px,transparent_1px)] bg-[size:32px_32px]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_62%_78%,rgba(47,200,227,0.18),transparent_30%),radial-gradient(circle_at_50%_20%,rgba(255,0,200,0.16),transparent_24%)]" />

      <div className="relative z-10 flex w-full max-w-[420px] flex-col">
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
              <div className="rounded-[14px] border border-[#ff6b6b]/40 bg-[#351828] px-[14px] py-[12px] text-[14px] text-[#ffd0d0]">
                {submitError}
              </div>
            ) : null}

            <div>
              <AuthButton
                type="submit"
                icon={friendGameIcon}
                disabled={isDisabled}
              >
                {isSubmitting ? "Создаём аккаунт..." : "Создать аккаунт"}
              </AuthButton>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-[10px] text-[16px]">
              <span className="text-[#c0c5d8]">Уже есть аккаунт?</span>
              <Link
                to="/login"
                state={{ from: location.state?.from }}
                className="font-medium text-[#ff78e5] no-underline transition-colors hover:text-[#ffb0f0]"
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
