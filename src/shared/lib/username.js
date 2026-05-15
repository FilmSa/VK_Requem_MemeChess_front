export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 12;

const usernamePattern = /^[A-Za-z]+$/;

export function normalizeUsernameValue(value) {
  return String(value ?? "")
    .replace(/[^A-Za-z]/g, "")
    .slice(0, USERNAME_MAX_LENGTH);
}

export function validateUsername(value) {
  const normalizedValue = String(value ?? "").trim();

  if (normalizedValue.length < USERNAME_MIN_LENGTH) {
    return `Никнейм должен содержать минимум ${USERNAME_MIN_LENGTH} латинские буквы.`;
  }

  if (normalizedValue.length > USERNAME_MAX_LENGTH) {
    return `Никнейм должен содержать не более ${USERNAME_MAX_LENGTH} латинских букв.`;
  }

  if (!usernamePattern.test(normalizedValue)) {
    return "Никнейм может содержать только латинские буквы.";
  }

  return "";
}
