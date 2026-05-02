type SeoJsonLdProps = {
  schema?: string | null;
};

const extractSchemaContent = (value: string) => {
  const trimmed = value.trim();
  const scriptMatch = trimmed.match(
    /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i,
  );

  return scriptMatch?.[1]?.trim() || trimmed;
};

const hashValue = (value: string) => {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash.toString(16);
};

export default function SeoJsonLd({ schema }: SeoJsonLdProps) {
  const trimmed = schema?.trim();
  if (!trimmed) return null;

  const schemaContent = extractSchemaContent(trimmed);
  if (!schemaContent) return null;

  let safeSchema = schemaContent;
  try {
    safeSchema = JSON.stringify(JSON.parse(schemaContent));
  } catch {
    safeSchema = schemaContent;
  }

  const scriptId = `seo-jsonld-${hashValue(safeSchema)}`;

  return (
    <script
      id={scriptId}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeSchema }}
    />
  );
}
