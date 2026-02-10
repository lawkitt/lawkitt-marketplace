#!/usr/bin/env npx tsx
/**
 * Validate marketplace.yaml contracts for all catalogs.
 *
 * Usage: npx tsx bin/validate-marketplace-contract.ts
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import * as yaml from "yaml";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");

const catalogs = [
  {
    type: "modes",
    path: path.join(rootDir, "modes", "marketplace.yaml"),
    required: ["id", "name", "description", "content"],
  },
  {
    type: "mcps",
    path: path.join(rootDir, "mcps", "marketplace.yaml"),
    required: ["id", "name", "description", "content", "url"],
  },
  {
    type: "skills",
    path: path.join(rootDir, "skills", "marketplace.yaml"),
    required: ["id", "description", "category", "githubUrl", "content"],
  },
];

let hasError = false;

for (const catalog of catalogs) {
  if (!fs.existsSync(catalog.path)) {
    console.error(`❌ Missing catalog: ${catalog.path}`);
    hasError = true;
    continue;
  }

  try {
    const fileContent = fs.readFileSync(catalog.path, "utf-8");
    const doc = yaml.parse(fileContent);

    if (!doc || !Array.isArray(doc.items)) {
       // Support both direct array or { items: [] } format. 
       // The generators seem to produce { items: [] }? 
       // generate-skill-marketplace.ts: const doc = new Document({ items });
       // generate-modes-marketplace.ts: const doc = new Document({ items });
       // generate-mcps-marketplace.ts: const doc = new Document({ items });
       // So valid YAML should parse as { items: [...] }
       
       if (!doc.items || !Array.isArray(doc.items)) {
          console.error(`❌ Invalid structure in ${catalog.type}: expected root 'items' array`);
          hasError = true;
          continue;
       }
    }

    const items = doc.items;
    console.log(`Checking ${catalog.type} (${items.length} items)...`);

    items.forEach((item: any, index: number) => {
      const missing = catalog.required.filter((field) => !item[field] && item[field] !== 0 && item[field] !== false);
      if (missing.length > 0) {
        console.error(
          `❌ ${catalog.type} item #${index} (${item.id || "unknown"}) missing fields: ${missing.join(", ")}`
        );
        hasError = true;
      }
      
      // Special check for MCPs: url is required per plan, but let's check if there are exceptions
      if (catalog.type === "mcps" && !item.url && !item.content) {
          // If no URL, must have content? 
          // Plan says: `mcps`: `id`, `name`, `description`, `url`, `content`
          // Let's stick to the plan's list.
          // Wait, plan says "url" is required.
      }
    });

  } catch (err) {
    console.error(`❌ Failed to parse ${catalog.path}:`, err);
    hasError = true;
  }
}

if (hasError) {
  console.error("\n❌ Validation failed.");
  process.exit(1);
} else {
  console.log("\n✅ All catalogs validated successfully.");
}
