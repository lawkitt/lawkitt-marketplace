#!/usr/bin/env npx tsx
/**
 * Validate that skill URLs in marketplace.yaml are owned by Lawkitt.
 *
 * Usage: npx tsx bin/validate-skill-urls.ts
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import * as yaml from "yaml";
import { MARKETPLACE_CONFIG } from "./marketplace-config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const skillsCatalogPath = path.join(__dirname, "..", "skills", "marketplace.yaml");

if (!fs.existsSync(skillsCatalogPath)) {
  console.error(`❌ Missing catalog: ${skillsCatalogPath}`);
  process.exit(1);
}

const doc = yaml.parse(fs.readFileSync(skillsCatalogPath, "utf-8"));
const items = doc.items || [];
let hasError = false;

console.log(`Checking ownership of ${items.length} skills...`);

items.forEach((item: any) => {
  // Check githubUrl
  if (!item.githubUrl.startsWith(MARKETPLACE_CONFIG.skills.githubBaseUrl)) {
    console.error(`❌ Skill ${item.id} has invalid githubUrl: ${item.githubUrl}`);
    console.error(`   Expected start: ${MARKETPLACE_CONFIG.skills.githubBaseUrl}`);
    hasError = true;
  }

  // Check rawUrl
  if (!item.rawUrl.startsWith(MARKETPLACE_CONFIG.skills.rawBaseUrl)) {
    console.error(`❌ Skill ${item.id} has invalid rawUrl: ${item.rawUrl}`);
    console.error(`   Expected start: ${MARKETPLACE_CONFIG.skills.rawBaseUrl}`);
    hasError = true;
  }

  // Check content (release artifact)
  if (!item.content.startsWith(MARKETPLACE_CONFIG.skills.contentBaseUrl)) {
    console.error(`❌ Skill ${item.id} has invalid content URL: ${item.content}`);
    console.error(`   Expected start: ${MARKETPLACE_CONFIG.skills.contentBaseUrl}`);
    hasError = true;
  }
});

if (hasError) {
  console.error("\n❌ Ownership validation failed.");
  process.exit(1);
} else {
  console.log("\n✅ All skill URLs are owned by Lawkitt.");
}
