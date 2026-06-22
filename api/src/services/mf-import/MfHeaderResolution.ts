export class MfHeaderResolution {
  static valueByAliases(row: Record<string, unknown>, aliases: string[]): any {
    const keys = Object.keys(row);
    for (const alias of aliases) {
      const match = keys.find(k => k.toLowerCase().trim() === alias.toLowerCase().trim() || 
                                   k.toLowerCase().replace(/[^a-z0-9]/g, '') === alias.toLowerCase().replace(/[^a-z0-9]/g, ''));
      if (match && row[match] !== undefined && row[match] !== "") {
        return row[match];
      }
    }
    return null;
  }
}
