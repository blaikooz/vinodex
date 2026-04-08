import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

function sqlString(value: string) {
  return `'${value.replace(/'/g, "''")}'`;
}

function sqlNullableString(value: string | null | undefined) {
  return value == null ? 'null' : sqlString(value);
}

function sqlJson(value: JsonValue | undefined) {
  if (value == null) {
    return 'null';
  }

  return `${sqlString(JSON.stringify(value))}::jsonb`;
}

function sqlTextArray(value: string[] | undefined) {
  if (!value || value.length === 0) {
    return 'array[]::text[]';
  }

  return `array[${value.map(sqlString).join(', ')}]::text[]`;
}

async function main() {
  const currentFile = fileURLToPath(import.meta.url);
  const rootDir = path.resolve(path.dirname(currentFile), '..');
  const sourcePath = path.join(rootDir, 'public', 'wine-entries.json');
  const outputDir = path.join(rootDir, 'supabase');
  const outputPath = path.join(outputDir, 'seed.sql');

  const raw = await readFile(sourcePath, 'utf8');
  const entries = JSON.parse(raw) as Array<Record<string, JsonValue>>;

  const rows = entries.map((entry) => {
    const values = [
      sqlString(String(entry.id ?? '')),
      sqlString(String(entry.name ?? '')),
      sqlString(String(entry.description ?? '')),
      sqlString(String(entry.category ?? '')),
      sqlTextArray(Array.isArray(entry.tags) ? (entry.tags as string[]) : []),
      sqlString(String(entry.color ?? '')),
      sqlNullableString(entry.icon as string | undefined),
      sqlNullableString(entry.tileCallback as string | undefined),
      sqlNullableString(entry.iconCallback as string | undefined),
      sqlNullableString(entry.wineType as string | undefined),
      sqlJson(entry.tastingProfile),
      sqlNullableString(entry.climate as string | undefined),
      sqlNullableString(entry.climateDescription as string | undefined),
      sqlJson(entry.details),
      sqlNullableString(entry.rarity as string | undefined),
      sqlJson(entry.grapeCard),
    ];

    return `  (${values.join(', ')})`;
  });

  const sql = `insert into public.wine_entries (
  id,
  name,
  description,
  category,
  tags,
  color,
  icon,
  "tileCallback",
  "iconCallback",
  "wineType",
  "tastingProfile",
  climate,
  "climateDescription",
  details,
  rarity,
  "grapeCard"
)
values
${rows.join(',\n')}
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  category = excluded.category,
  tags = excluded.tags,
  color = excluded.color,
  icon = excluded.icon,
  "tileCallback" = excluded."tileCallback",
  "iconCallback" = excluded."iconCallback",
  "wineType" = excluded."wineType",
  "tastingProfile" = excluded."tastingProfile",
  climate = excluded.climate,
  "climateDescription" = excluded."climateDescription",
  details = excluded.details,
  rarity = excluded.rarity,
  "grapeCard" = excluded."grapeCard";
`;

  await mkdir(outputDir, { recursive: true });
  await writeFile(outputPath, sql, 'utf8');

  console.log(`Wrote seed file to ${outputPath}`);
  console.log(`Prepared ${entries.length} wine entries for Supabase.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
