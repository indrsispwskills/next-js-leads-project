export function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value || "");
}

export function requireMinLength(value, min) {
  return typeof value === "string" && value.trim().length >= min;
}

export function isValidObjectId(id) {
  return /^[a-f\d]{24}$/i.test(id || "");
}
