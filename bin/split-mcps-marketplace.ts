#!/usr/bin/env npx tsx
/**
 * Split mcps/marketplace.yaml into individual MCP YAML files.
 *
 * Usage: npx tsx bin/split-mcps-marketplace.ts
 *
 * This script reads the consolidated marketplace.yaml and creates
 * individual YAML files for each MCP in the mcps/ directory.
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import * as yaml from "yaml";
import { Document } from "yaml";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mcpsDir = path.join(__dirname, "..", "mcps");
const marketplaceFile = path.join(mcpsDir, "marketplace.yaml");

// Read and parse the marketplace.yaml
const content = fs.readFileSync(marketplaceFile, "utf-8");
const marketplace = yaml.parse(content);

if (!marketplace.items || !Array.isArray(marketplace.items)) {
  console.error("Error: marketplace.yaml does not contain an items array");
  process.exit(1);
}

console.log(`Found ${marketplace.items.length} MCPs to split\n`);

let created = 0;
let skipped = 0;

for (const mcp of marketplace.items) {
  if (!mcp.id) {
    console.warn("Warning: Skipping MCP without id");
    skipped++;
    continue;
  }

  const filename = `${mcp.id}.yaml`;
  const filepath = path.join(mcpsDir, filename);

  // Create a YAML document for the individual MCP
  const doc = new Document(mcp);
  const output = doc.toString({ lineWidth: 120 });

  fs.writeFileSync(filepath, output);
  console.log(`Created: ${filename}`);
  created++;
}

console.log(`\nSplit complete: ${created} files created, ${skipped} skipped`);
