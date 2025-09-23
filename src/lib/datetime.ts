export function toKstWindowText(startIso?: string, endIso?: string) {
    try {
        const toLocal = (iso?: string) => (iso ? new Date(iso) : null);
        const f = (d: Date) =>
            `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ` +
            `${String(d.getHours()).toString().padStart(2, "0")}:${String(d.getMinutes()).toString().padStart(2, "0")}`;
        const s = toLocal(startIso),
            e = toLocal(endIso);
        if (s && e) return `${f(s)} ~ ${f(e)}`;
    } catch {}
    return "";
}
