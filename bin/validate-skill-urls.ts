#!/usr/bin/env npx tsx
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import YAML from "yaml";
import { MARKETPLACE_CONFIG } from "./marketplace-config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const skillsYamlPath = path.join(__dirname, "..", "skills", "marketplace.yaml");

interface SkillItem {
  id: string;
  githubUrl: string;
  rawUrl: string;
  content: string;
  [key: string]: any;
}

function validateUrls() {
  if (!fs.existsSync(skillsYamlPath)) {
    console.error("❌ skills/marketplace.yaml not found");
    process.exit(1);
  }

  const fileContent = fs.readFileSync(skillsYamlPath, "utf-8");
  const parsed = YAML.parse(fileContent);

  if (!parsed || !Array.isArray(parsed.items)) {
    console.error("❌ Invalid skills/marketplace.yaml structure");
    process.exit(1);
  }

  let hasErrors = false;
  const items = parsed.items as SkillItem[];

  items.forEach((item) => {
    const errors: string[] = [];

    // Check githubUrl
    if (!item.githubUrl.startsWith(MARKETPLACE_CONFIG.skills.githubBaseUrl)) {
      errors.push(`githubUrl does not start with ${MARKETPLACE_CONFIG.skills.githubBaseUrl}`);
    }

    // Check rawUrl
    if (item.rawUrl && !item.rawUrl.startsWith(MARKETPLACE_CONFIG.skills.rawBaseUrl)) {
      errors.push(`rawUrl does not start with ${MARKETPLACE_CONFIG.skills.rawBaseUrl}`);
    }

    // Check content URL
    if (item.content && !item.content.startsWith(MARKETPLACE_CONFIG.skills.contentBaseUrl)) {
      errors.push(`content URL does not start with ${MARKETPLACE_CONFIG.skills.contentBaseUrl}`);
    }

    if (errors.length > 0) {
      hasErrors = true;
      console.error(`\n❌ Skill '${item.id}':`);
      errors.forEach(e => console.error(`  - ${e}`));
      console.error(`    Current githubUrl: ${item.githubUrl}`);
      console.error(`    Current rawUrl:    ${item.rawUrl}`);
      console.error(`    Current content:   ${item.content}`);
    }
  });

  if (hasErrors) {
    console.error("\nValidation failed: Found invalid URLs.");
    process.exit(1);
  } else {
    console.log("✅ All skill URLs are valid and owned by Lawkitt.");
  }
}

validateUrls();
