export function t(key, fallback, vars) {
  const i18n = game?.i18n;
  let s = "";

  if (i18n?.has?.(key)) {
    s = i18n.localize(key) ?? "";
  } else if (i18n?.localize) {
    const loc = i18n.localize(key) ?? "";
    s = loc && loc !== key && !/^\[.+\]$/.test(loc) ? loc : "";
  }

  if (!s) s = fallback ?? key;
  if (vars && s) s = interpolateVars(s, vars);
  return s;
}

function interpolateVars(s, vars) {
  for (const [k, v] of Object.entries(vars)) {
    s = s.replace(new RegExp(`\\{${escapeRegExp(k)}\\}`, "g"), String(v));
  }
  return s;
}

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function tf(key, data) {
  try {
    const v = game.i18n.format(key, data ?? {});
    return v && v !== key ? v : key;
  } catch {
    return key;
  }
}

export function thas(key) {
  try {
    return game.i18n.has(key);
  } catch {
    return false;
  }
}