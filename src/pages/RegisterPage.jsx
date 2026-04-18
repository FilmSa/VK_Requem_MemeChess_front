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
    errors.nickname = "РРјСЏ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ РґРѕР»Р¶РЅРѕ СЃРѕРґРµСЂР¶Р°С‚СЊ РјРёРЅРёРјСѓРј 3 СЃРёРјРІРѕР»Р°.";
  }

  if (!form.email.includes("@")) {
    errors.email = "Р’РІРµРґРёС‚Рµ РєРѕСЂСЂРµРєС‚РЅСѓСЋ РїРѕС‡С‚Сѓ.";
  }

  if (form.password.length < 8) {
    errors.password = "РџР°СЂРѕР»СЊ РґРѕР»Р¶РµРЅ СЃРѕРґРµСЂР¶Р°С‚СЊ РЅРµ РјРµРЅРµРµ 8 СЃРёРјРІРѕР»РѕРІ.";
  }

  if (form.confirmPassword !== form.password) {
    errors.confirmPassword = "РџР°СЂРѕР»Рё РЅРµ СЃРѕРІРїР°РґР°СЋС‚.";
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
      setSubmitError(error.message || "РќРµ СѓРґР°Р»РѕСЃСЊ СЃРѕР·РґР°С‚СЊ Р°РєРєР°СѓРЅС‚.");
      setServerErrors(error.fields || {});
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-screen w-screen px-4 py-10 sm:px-6">
      <div className="auth-screen__inner flex w-full max-w-[420px] flex-col">
        <AuthCard title="Р РµРіРёСЃС‚СЂР°С†РёСЏ">
          <form onSubmit={handleSubmit} className="flex flex-col gap-[20px]">
            <div className="flex flex-col gap-[20px]">
              <AuthInput
                id="nickname"
                name="nickname"
                label="РРјСЏ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ"
                type="text"
                placeholder="РРіСЂРѕРє_01"
                value={form.nickname}
                onChange={handleChange}
                icon="user"
                error={serverErrors.username || clientErrors.nickname}
              />

              <AuthInput
                id="email"
                name="email"
                label="Р­Р»РµРєС‚СЂРѕРЅРЅР°СЏ РїРѕС‡С‚Р°"
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
                label="РџР°СЂРѕР»СЊ"
                type="password"
                placeholder="РќРµ РјРµРЅРµРµ 8 СЃРёРјРІРѕР»РѕРІ"
                value={form.password}
                onChange={handleChange}
                icon="lock"
                error={serverErrors.password || clientErrors.password}
              />

              <AuthInput
                id="confirmPassword"
                name="confirmPassword"
                label="РџРѕРґС‚РІРµСЂРґРёС‚Рµ РїР°СЂРѕР»СЊ"
                type="password"
                placeholder="РџРѕРІС‚РѕСЂРёС‚Рµ РїР°СЂРѕР»СЊ"
                value={form.confirmPassword}
                onChange={handleChange}
                icon="lock"
                error={clientErrors.confirmPassword}
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
              <AuthButton type="submit" icon={friendGameIcon} disabled={isDisabled}>
                {isSubmitting ? "РЎРѕР·РґР°РµРј Р°РєРєР°СѓРЅС‚..." : "РЎРѕР·РґР°С‚СЊ Р°РєРєР°СѓРЅС‚"}
              </AuthButton>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-[10px] text-[16px]">
              <span style={{ color: "var(--color-text-muted)" }}>
                РЈР¶Рµ РµСЃС‚СЊ Р°РєРєР°СѓРЅС‚?
              </span>
              <Link
                to="/login"
                state={{ from: location.state?.from }}
                className="font-medium no-underline transition-colors"
                style={{ color: "var(--auth-link-secondary)" }}
              >
                Р’РѕР№С‚Рё
              </Link>
            </div>
          </form>
        </AuthCard>
      </div>
    </div>
  );
}
