// DRF validation errors come back as {field: [messages]} or {detail: "..."}.
// Flatten whichever shape shows up into one human-readable line for forms.
export function extractErrorMessage(error) {
  const data = error?.response?.data;
  if (!data) return "Something went wrong. Please try again.";
  if (typeof data === "string") return data;

  if (data.detail) {
    return Array.isArray(data.detail) ? data.detail.join(" ") : data.detail;
  }

  const firstKey = Object.keys(data)[0];
  if (firstKey) {
    const value = data[firstKey];
    const message = Array.isArray(value) ? value.join(" ") : value;
    return firstKey === "non_field_errors" ? message : `${firstKey}: ${message}`;
  }

  return "Something went wrong. Please try again.";
}
