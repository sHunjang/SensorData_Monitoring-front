export function toKstWindowText(startIso, endIso) {
    try {
        const toLocal = (iso) => (iso ? new Date(iso) : null);
        const f = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ` +
            `${String(d.getHours()).toString().padStart(2, "0")}:${String(d.getMinutes()).toString().padStart(2, "0")}`;
        const s = toLocal(startIso), e = toLocal(endIso);
        if (s && e)
            return `${f(s)} ~ ${f(e)}`;
    }
    catch { }
    return "";
}
