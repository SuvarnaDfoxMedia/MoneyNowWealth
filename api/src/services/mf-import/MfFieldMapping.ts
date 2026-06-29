export class MfFieldMapping {
  static normalizeDateValue(val: unknown): Date | null {
    if (!val) return null;
    if (val instanceof Date) return val;
    const num = Number(val);
    if (!isNaN(num) && num > 20000 && num < 60000) {
      return new Date((num - 25569) * 86400 * 1000);
    }
    const d = new Date(String(val));
    if (!isNaN(d.getTime())) return d;
    return null;
  }

  static parseNumber(row: Record<string, unknown>, aliases: string[]): number | null {
    const keys = Object.keys(row);
    for (const alias of aliases) {
      const match = keys.find(k => k.toLowerCase().replace(/[^a-z0-9]/g, '') === alias.toLowerCase().replace(/[^a-z0-9]/g, ''));
      if (match && row[match] !== undefined && row[match] !== "") {
        const val = row[match];
        if (typeof val === "number") return val;
        const str = String(val).replace(/,/g, "").trim();
        const num = parseFloat(str);
        if (!isNaN(num)) return num;
      }
    }
    return null;
  }
}
