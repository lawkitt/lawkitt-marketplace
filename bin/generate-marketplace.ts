#!/usr/bin/env npx tsx
/**
 * Generate skills.yaml from skill SKILL.md frontmatter.
 *
 * Usage: npx tsx bin/generate-marketplace.ts
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import matter from "gray-matter";
import * as yaml from "yaml";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const skillsDir = path.join(__dirname, "..", "skills");

const GITHUB_BASE_URL = "https://github.com/Kilo-Org/kilo-marketplace/tree/main/skills";
const RAW_BASE_URL = "https://raw.githubusercontent.com/Kilo-Org/kilo-marketplace/main/skills";

const items = fs
  .readdirSync(skillsDir, { withFileTypes: true })
  .filter((d) => d.isDirectory() && !d.name.startsWith("."))
  .map((dir) => {
    const { data } = matter(
      fs.readFileSync(path.join(skillsDir, dir.name, "SKILL.md"), "utf-8")
    );
    console.log(`Added: ${data.name}`);
    return {
      id: dir.name,
      description: data.description,
      category: data.metadata?.category || undefined,
      githubUrl: `${GITHUB_BASE_URL}/${dir.name}`,
      rawUrl: `${RAW_BASE_URL}/${dir.name}/SKILL.md`,
    };
  })
  .sort((a, b) => {
    const catCmp = (a.category || "zzz").localeCompare(b.category || "zzz");
    return catCmp !== 0 ? catCmp : a.id.localeCompare(b.id);
  });

const output = yaml.stringify({ items }, { lineWidth: 120 });

fs.writeFileSync(path.join(skillsDir, "skills.yaml"), output);

console.log(`\nGenerated skills.yaml with ${items.length} skills`);
