import { ApiError, apiFetch } from "../../shared/api/client.js";

const authBasePath = "/api/v1/auth";

function normalizeUser(user) {
  if (!user) {
    return null;
  }

  return {
    ...user,
    avatar_url: user.avatar_url || "",
    created_at: user.created_at || "",
  };
}

function normalizeAuthResponse(response) {
  return {
    token: response.token,
    user: normalizeUser(response.user),
  };
}

function buildError(error, fallbackMessage) {
  if (!(error instanceof ApiError)) {
    return new Error(fallbackMessage);
  }

  const rawMessage = String(error.message || "").toLowerCase();

  if (rawMessage.includes("invalid credentials")) {
    return new ApiError("Неверный логин, почта или пароль.", {
      status: error.status,
      fields: {
        login: "Проверьте логин или почту.",
        password: "Проверьте пароль.",
      },
      payload: error.payload,
    });
  }

  if (rawMessage.includes("password must be at least 8")) {
    return new ApiError("Пароль должен содержать не менее 8 символов.", {
      status: error.status,
      fields: {
        password: "Минимальная длина пароля — 8 символов.",
      },
      payload: error.payload,
    });
  }

  if (rawMessage.includes("username must be 3-32")) {
    return new ApiError(
      "Имя пользователя должно содержать от 3 до 32 символов: буквы, цифры или подчёркивание.",
      {
        status: error.status,
        fields: {
          username:
            "От 3 до 32 символов: буквы, цифры или подчёркивание.",
        },
        payload: error.payload,
      }
    );
  }

  if (rawMessage.includes("username or email already taken")) {
    return new ApiError("Пользователь с таким именем или почтой уже существует.", {
      status: error.status,
      fields: {
        username: "Имя пользователя уже занято.",
        email: "Почта уже используется.",
      },
      payload: error.payload,
    });
  }

  if (
    rawMessage.includes("missing bearer token") ||
    rawMessage.includes("invalid token") ||
    rawMessage.includes("token revoked")
  ) {
    return new ApiError("Сессия истекла. Войдите снова.", {
      status: error.status,
      payload: error.payload,
    });
  }

  return new ApiError(fallbackMessage, {
    status: error.status,
    fields: error.fields,
    payload: error.payload,
  });
}

export async function register(payload) {
  try {
    const response = await apiFetch(`${authBasePath}/register`, {
      method: "POST",
      body: payload,
    });

    return normalizeAuthResponse(response);
  } catch (error) {
    throw buildError(error, "Не удалось создать аккаунт.");
  }
}

export async function login(payload) {
  try {
    const response = await apiFetch(`${authBasePath}/login`, {
      method: "POST",
      body: payload,
    });

    return normalizeAuthResponse(response);
  } catch (error) {
    throw buildError(error, "Не удалось выполнить вход.");
  }
}

export async function getCurrentUser(token) {
  try {
    const user = await apiFetch(`${authBasePath}/me`, {
      method: "GET",
      token,
    });

    return { user: normalizeUser(user) };
  } catch (error) {
    throw buildError(error, "Не удалось загрузить профиль.");
  }
}

export async function logout(token) {
  try {
    return await apiFetch(`${authBasePath}/logout`, {
      method: "POST",
      token,
    });
  } catch (error) {
    throw buildError(error, "Не удалось завершить сеанс.");
  }
}
