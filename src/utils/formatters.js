let idCounter = 0;

export function uid(prefix = "id") {
  idCounter += 1;
  return `${prefix}-${Date.now()}-${idCounter}`;
}

export function cloneData(value) {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  if (value === null || value === undefined) {
    return value;
  }

  const valueType = typeof value;
  if (valueType === "string" || valueType === "number" || valueType === "boolean" || valueType === "bigint") {
    return value;
  }

  if (valueType === "function" || valueType === "symbol") {
    throw new TypeError(`cloneData fallback cannot clone ${valueType} values without structuredClone.`);
  }

  const serialized = JSON.stringify(value, (_key, nestedValue) => {
    const nestedType = typeof nestedValue;
    if (nestedType === "function" || nestedType === "symbol" || nestedType === "bigint") {
      throw new TypeError(`cloneData fallback cannot clone nested ${nestedType} values without structuredClone.`);
    }
    return nestedValue;
  });

  if (serialized === undefined) {
    return value;
  }

  return JSON.parse(serialized);
}

export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function formatDate(value) {
  if (!value) {
    return "--";
  }

  return new Date(value).toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(value) {
  if (!value) {
    return "--";
  }

  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatTime(value) {
  if (!value) {
    return "--";
  }

  return new Date(value).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatRelativeSync(value) {
  if (!value) {
    return "Not synced yet";
  }

  const diffMs = Date.now() - value;
  const diffSeconds = Math.max(0, Math.round(diffMs / 1000));

  if (diffSeconds < 15) {
    return "Just now";
  }

  if (diffSeconds < 60) {
    return `${diffSeconds}s ago`;
  }

  const diffMinutes = Math.round(diffSeconds / 60);
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  return formatTime(value);
}

export function formatRelationToPar(value) {
  if (value === null || value === undefined) {
    return "--";
  }

  if (value === 0) {
    return "E";
  }

  return value > 0 ? `+${value}` : `${value}`;
}

export function titleCase(value) {
  return String(value || "")
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function average(numbers) {
  if (!numbers.length) {
    return 0;
  }

  return numbers.reduce((sum, value) => sum + value, 0) / numbers.length;
}

export function compactNames(values) {
  return values.filter(Boolean).join(", ");
}
