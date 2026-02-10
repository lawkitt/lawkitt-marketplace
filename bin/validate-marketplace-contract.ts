#!/usr/bin/env npx tsx
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import YAML from "yaml";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");

interface ValidationResult {
  file: string;
  errors: string[];
}

function validateCatalog(
  catalogName: string,
  requiredFields: string[]
): ValidationResult {
  const filePath = path.join(rootDir, catalogName, "marketplace.yaml");
  const errors: string[] = [];

  if (!fs.existsSync(filePath)) {
    return { file: filePath, errors: ["File not found"] };
  }

  try {
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const parsed = YAML.parse(fileContent);

    if (!parsed || !Array.isArray(parsed.items)) {
      return { file: filePath, errors: ["Invalid structure: 'items' array missing"] };
    }

    parsed.items.forEach((item: any, index: number) => {
      const itemId = item.id || `item[${index}]`;
      requiredFields.forEach((field) => {
        if (item[field] === undefined || item[field] === null || item[field] === "") {
           // Allow empty strings? Probably not for required fields.
           // But 'description' might be empty? No, should be present.
           errors.push(`Item '${itemId}' missing required field: '${field}'`);
        }
      });
    });

  } catch (e: any) {
    errors.push(`Parse error: ${e.message}`);
  }

  return { file: filePath, errors };
}

console.log("Validating marketplace catalogs...");

const results = [
  validateCatalog("modes", ["id", "name", "description", "content"]),
  validateCatalog("mcps", ["id", "name", "description", "url", "content"]),
  validateCatalog("skills", ["id", "description", "category", "githubUrl", "content"])
];

let hasErrors = false;

results.forEach((res) => {
  if (res.errors.length > 0) {
    hasErrors = true;
    console.error(`\n❌ ${path.relative(rootDir, res.file)}:`);
    res.errors.forEach((err) => console.error(`  - ${err}`));
  } else {
    console.log(`✅ ${path.relative(rootDir, res.file)}`);
  }
});

if (hasErrors) {
  process.exit(1);
} else {
  console.log("\nAll catalogs valid.");
}
