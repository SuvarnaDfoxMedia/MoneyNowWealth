export const calculatorApi = {
  async call(type: string, payload: any) {
    const res = await fetch(`/api/calc/${type}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("API Error:", text);
      throw new Error("Failed to fetch API");
    }

    return res.json();
  },
};
