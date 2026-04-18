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
      setSubmitError(error.message || "РќРµ СѓРґР°Р»РѕСЃСЊ РІС‹РїРѕР»РЅРёС‚СЊ РІС…РѕРґ.");
      setFieldErrors(error.fields || {});
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-screen w-screen px-4 py-[10px] sm:px-6">
      <div className="auth-screen__inner flex w-full max-w-[420px] flex-col">
        <AuthCard title="Р’С…РѕРґ">
          <form onSubmit={handleSubmit} className="flex flex-col gap-[20px]">
            <div className="flex flex-col gap-[10px]">
              <AuthInput
                id="login"
                name="login"
                label="Р›РѕРіРёРЅ РёР»Рё РїРѕС‡С‚Р°"
                type="text"
                placeholder="РРіСЂРѕРє_01"
                value={form.login}
                onChange={handleChange}
                icon="user"
                error={fieldErrors.login}
              />

              <AuthInput
                id="password"
                name="password"
                label="РџР°СЂРѕР»СЊ"
                type="password"
                placeholder="Р’РІРµРґРёС‚Рµ РїР°СЂРѕР»СЊ"
                value={form.password}
                onChange={handleChange}
                icon="lock"
                error={fieldErrors.password}
              />
            </div>

            {submitError ? (
              <div
                className="rounded-[14px] border px-[14px] py-[12px] text-[14px]"
                style={{
                  borderColor: "var(--auth-error-border)",
                  background: "var(--auth-error-background)",
                  color: "var(--auth-error-text)",
                }}
              >
                {submitError}
              </div>
            ) : null}

            <div>
              <AuthButton type="submit" icon={startGameIcon} disabled={isDisabled}>
                {isSubmitting ? "Р’С…РѕРґРёРј..." : "Р’РѕР№С‚Рё"}
              </AuthButton>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-[10px] text-[16px]">
              <span style={{ color: "var(--color-text-muted)" }}>
                Р•С‰Рµ РЅРµС‚ Р°РєРєР°СѓРЅС‚Р°?
              </span>
              <Link
                to="/register"
                state={{ from: location.state?.from }}
                className="font-medium no-underline transition-colors"
                style={{ color: "var(--auth-link-primary)" }}
              >
                Р—Р°СЂРµРіРёСЃС‚СЂРёСЂРѕРІР°С‚СЊСЃСЏ
              </Link>
            </div>
          </form>
        </AuthCard>
      </div>
    </div>
  );
}
