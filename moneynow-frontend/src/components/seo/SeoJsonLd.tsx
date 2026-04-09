type SeoJsonLdProps = {
  schema?: string | null;
};

export default function SeoJsonLd({ schema }: SeoJsonLdProps) {
  const trimmed = schema?.trim();
  if (!trimmed) return null;

  let safeSchema = trimmed;
  try {
    safeSchema = JSON.stringify(JSON.parse(trimmed));
  } catch {
    safeSchema = trimmed;
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeSchema }}
    />
  );
}
