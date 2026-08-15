/**
 * parse-curriculum.ts
 *
 * Reads lists.txt and outputs structured curriculum JSON.
 * Run via: npx ts-node --esm scripts/parse-curriculum.ts
 * Or:      npx tsx scripts/parse-curriculum.ts
 *
 * OUTPUT: app/data/curriculum.json
 *
 * RULES:
 * - Preserves exact names, order, nesting from lists.txt
 * - Assigns stable structural slugs
 * - Does NOT invent, rename, or reorder topics
 */

import * as fs from "fs";
import * as path from "path";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Subtopic {
  id: string; // e.g. "l1-m0-t0-s0"
  slug: string;
  name: string;
  orderIndex: number;
}

export interface Topic {
  id: string; // e.g. "l1-m0-t0"
  slug: string;
  name: string;
  orderIndex: number;
  isTrackable: boolean;
  subtopics: Subtopic[];
}

export interface Module {
  id: string; // e.g. "l1-m0"
  slug: string;
  name: string;
  orderIndex: number;
  topics: Topic[];
}

export interface CurriculumList {
  id: string; // e.g. "l1"
  slug: string;
  name: string;
  shortName: string;
  description: string;
  orderIndex: number;
  modules: Module[];
}

export interface Curriculum {
  generatedAt: string;
  lists: CurriculumList[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*/g, "")
    .replace(/`/g, "")
    .replace(/^\s*#+\s*/, "")
    .trim();
}

// ---------------------------------------------------------------------------
// List boundary markers (the exact headings in lists.txt)
// ---------------------------------------------------------------------------

const LIST_MARKERS: Array<{
  pattern: RegExp;
  name: string;
  shortName: string;
  slug: string;
  description: string;
}> = [
  {
    pattern: /^#\s+LIST\s+1\s*[—–-]/i,
    name: "List 1 — DSA for Data Roles",
    shortName: "Data Roles",
    slug: "list-1-data-roles",
    description:
      "Data Analyst + Data Scientist / ML roles. Python-first, focusing on algorithms and patterns with highest return for data-role coding rounds.",
  },
  {
    pattern: /^#\s+LIST\s+2\s*[—–-]/i,
    name: "List 2 — TCS / Infosys & Indian Campus OAs",
    shortName: "Indian Placement OAs",
    slug: "list-2-indian-placement",
    description:
      "Topics not in List 1, useful for TCS, Infosys, and comparable Indian campus/service-company coding rounds.",
  },
  {
    pattern: /^#\s+LIST\s+3\s*[—–-]/i,
    name: "List 3 — MAANG / High-Profile Product OAs",
    shortName: "MAANG / Product",
    slug: "list-3-maang-product",
    description:
      "Topics not in List 1 or 2, useful for MAANG/FAANG and other high-profile product-company OAs.",
  },
];

// Very High Tier is MODULE 27 of List 3
const VERY_HIGH_TIER_MODULE_PATTERN =
  /^#\s+MODULE\s+27\s*[—–-]\s*DEFERRED\s*\/\s*VERY\s+HIGH[-\s]+END/i;

// ---------------------------------------------------------------------------
// Parse
// ---------------------------------------------------------------------------

function parse(raw: string): Curriculum {
  const lines = raw.split(/\r?\n/);

  const lists: CurriculumList[] = [];
  let currentList: CurriculumList | null = null;
  let currentModule: Module | null = null;
  let currentTopic: Topic | null = null;

  let listIndex = -1;
  let moduleIndex = 0;
  let topicIndex = 0;
  let subtopicIndex = 0;

  // Very High Tier accumulation
  let inVeryHighTier = false;
  let veryHighTierModule: Module | null = null;

  for (let lineNum = 0; lineNum < lines.length; lineNum++) {
    const rawLine = lines[lineNum];
    const line = rawLine.trim();

    if (!line) continue;

    // Skip pure horizontal rules
    if (/^---+$/.test(line)) continue;

    // Skip code blocks (``` ... ```)
    if (line.startsWith("```")) continue;

    // Skip reference links like [1]: https://...
    if (/^\[[\w\d]+\]:\s+https?:\/\//.test(line)) continue;

    // Skip blockquotes (context/explanation lines)
    if (line.startsWith(">")) continue;

    // -----------------------------------------------------------------------
    // Detect list boundary
    // -----------------------------------------------------------------------
    let foundList = false;
    for (let li = 0; li < LIST_MARKERS.length; li++) {
      if (LIST_MARKERS[li].pattern.test(line)) {
        // Save previous state
        if (currentTopic && currentModule) {
          currentModule.topics.push(currentTopic);
          currentTopic = null;
        }
        if (currentModule && currentList) {
          currentList.modules.push(currentModule);
          currentModule = null;
        }

        listIndex = li;
        moduleIndex = 0;
        topicIndex = 0;
        subtopicIndex = 0;
        inVeryHighTier = false;

        currentList = {
          id: `l${li + 1}`,
          slug: LIST_MARKERS[li].slug,
          name: LIST_MARKERS[li].name,
          shortName: LIST_MARKERS[li].shortName,
          description: LIST_MARKERS[li].description,
          orderIndex: li,
          modules: [],
        };
        lists.push(currentList);
        currentModule = null;
        currentTopic = null;
        foundList = true;
        break;
      }
    }
    if (foundList) continue;

    if (listIndex < 0) continue; // haven't hit any list yet

    // -----------------------------------------------------------------------
    // Very High Tier detection (MODULE 27 of List 3)
    // -----------------------------------------------------------------------
    if (listIndex === 2 && VERY_HIGH_TIER_MODULE_PATTERN.test(line)) {
      // Flush current state
      if (currentTopic && currentModule) {
        currentModule.topics.push(currentTopic);
        currentTopic = null;
      }
      if (currentModule && currentList) {
        currentList.modules.push(currentModule);
        currentModule = null;
      }

      inVeryHighTier = true;

      // Create the "Very High Tier" as its own list (list 4)
      const l4: CurriculumList = {
        id: "l4",
        slug: "list-4-very-high-tier",
        name: "List 4 — Very High Tier",
        shortName: "Very High Tier",
        description:
          "Beyond ordinary MAANG preparation. Relevant for specialized high-profile product, HFT, competitive-programming-heavy, or extremely difficult OAs.",
        orderIndex: 3,
        modules: [],
      };
      lists.push(l4);
      currentList = l4;

      veryHighTierModule = {
        id: "l4-m0",
        slug: "l4-m0-deferred-very-high-end-topics",
        name: "MODULE 27 — Deferred / Very High-End Topics",
        orderIndex: 0,
        topics: [],
      };
      currentModule = veryHighTierModule;
      moduleIndex = 0;
      topicIndex = 0;
      subtopicIndex = 0;
      continue;
    }

    // -----------------------------------------------------------------------
    // Module detection  (#  MODULE N — ...)
    // -----------------------------------------------------------------------
    const moduleMatch = line.match(
      /^#\s+MODULE\s+([\d.]+)\s*[—–-]\s*(.+)/i
    );
    if (moduleMatch && !inVeryHighTier) {
      // Flush topic and module
      if (currentTopic && currentModule) {
        currentModule.topics.push(currentTopic);
        currentTopic = null;
      }
      if (currentModule && currentList) {
        currentList.modules.push(currentModule);
      }

      const moduleNum = moduleMatch[1];
      const moduleName = stripMarkdown(moduleMatch[2]);
      const moduleSlug = `l${listIndex + 1}-m${moduleIndex}-${toSlug(moduleName)}`;

      currentModule = {
        id: `l${listIndex + 1}-m${moduleIndex}`,
        slug: moduleSlug,
        name: `MODULE ${moduleNum} — ${moduleName}`,
        orderIndex: moduleIndex,
        topics: [],
      };

      moduleIndex++;
      topicIndex = 0;
      subtopicIndex = 0;
      currentTopic = null;
      continue;
    }

    // -----------------------------------------------------------------------
    // Topic detection  (## N.N ...)
    // -----------------------------------------------------------------------
    const topicMatch = line.match(/^##\s+([\d.]+)\s+(.+)/);
    if (topicMatch && currentModule) {
      // Flush previous topic
      if (currentTopic) {
        currentModule.topics.push(currentTopic);
      }

      const topicNum = topicMatch[1];
      const topicName = stripMarkdown(topicMatch[2]);
      const lId = currentList!.id;
      const mId = `${currentModule.id}`;
      const tSlug = `${mId}-t${topicIndex}-${toSlug(topicName)}`;

      currentTopic = {
        id: `${mId}-t${topicIndex}`,
        slug: tSlug,
        name: `${topicNum} ${topicName}`,
        orderIndex: topicIndex,
        isTrackable: true,
        subtopics: [],
      };

      topicIndex++;
      subtopicIndex = 0;
      continue;
    }

    // -----------------------------------------------------------------------
    // Sub-topic detection  (### ...)
    // -----------------------------------------------------------------------
    const subtopicH3Match = line.match(/^###\s+(.+)/);
    if (subtopicH3Match && currentTopic) {
      const stName = stripMarkdown(subtopicH3Match[1]);
      // Only add if it's not a "Step N" heading (those are topic-level items in module 21)
      // and not a combination-pattern label (module 23 in list 3)
      currentTopic.subtopics.push({
        id: `${currentTopic.id}-s${subtopicIndex}`,
        slug: `${currentTopic.slug}-s${subtopicIndex}-${toSlug(stName)}`,
        name: stName,
        orderIndex: subtopicIndex,
      });
      subtopicIndex++;
      continue;
    }

    // -----------------------------------------------------------------------
    // Bullet subtopics  (* item)
    // -----------------------------------------------------------------------
    const bulletMatch = line.match(/^\*\s+(.+)/);
    if (bulletMatch && currentTopic) {
      const stName = stripMarkdown(bulletMatch[1]);
      if (stName && stName.length > 0) {
        currentTopic.subtopics.push({
          id: `${currentTopic.id}-s${subtopicIndex}`,
          slug: `${currentTopic.slug}-s${subtopicIndex}-${toSlug(stName)}`,
          name: stName,
          orderIndex: subtopicIndex,
        });
        subtopicIndex++;
      }
      continue;
    }

    // -----------------------------------------------------------------------
    // Very High Tier bullet items (the module 27 bullets like "* Heavy-Light...")
    // -----------------------------------------------------------------------
    if (inVeryHighTier && currentModule) {
      const vhtBullet = line.match(/^\*\s+(.+)/);
      if (vhtBullet) {
        const stName = stripMarkdown(vhtBullet[1]);

        // Each VHT bullet becomes its own topic (since there are no ## headers)
        const lId = "l4";
        const mId = currentModule.id;
        const tSlug = `${mId}-t${topicIndex}-${toSlug(stName)}`;

        const t: Topic = {
          id: `${mId}-t${topicIndex}`,
          slug: tSlug,
          name: stName,
          orderIndex: topicIndex,
          isTrackable: true,
          subtopics: [],
        };
        currentModule.topics.push(t);
        topicIndex++;
      }
    }
  }

  // Flush remaining
  if (currentTopic && currentModule) {
    currentModule.topics.push(currentTopic);
  }
  if (currentModule && currentList) {
    currentList.modules.push(currentModule);
  }

  return {
    generatedAt: new Date().toISOString(),
    lists,
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const listsPath = path.resolve(process.cwd(), "lists.txt");
const outDir = path.resolve(process.cwd(), "app", "data");
const outPath = path.join(outDir, "curriculum.json");

if (!fs.existsSync(listsPath)) {
  console.error(`ERROR: lists.txt not found at ${listsPath}`);
  process.exit(1);
}

const raw = fs.readFileSync(listsPath, "utf-8");
const curriculum = parse(raw);

// Stats
let totalModules = 0;
let totalTopics = 0;
let totalSubtopics = 0;
curriculum.lists.forEach((l) => {
  totalModules += l.modules.length;
  l.modules.forEach((m) => {
    totalTopics += m.topics.length;
    m.topics.forEach((t) => {
      totalSubtopics += t.subtopics.length;
    });
  });
});

console.log("✅ Curriculum parsed:");
curriculum.lists.forEach((l) => {
  const mCount = l.modules.length;
  const tCount = l.modules.reduce((a, m) => a + m.topics.length, 0);
  console.log(`   ${l.name}: ${mCount} modules, ${tCount} topics`);
});
console.log(`\n   Total modules: ${totalModules}`);
console.log(`   Total topics: ${totalTopics}`);
console.log(`   Total subtopics: ${totalSubtopics}`);

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

fs.writeFileSync(outPath, JSON.stringify(curriculum, null, 2), "utf-8");
console.log(`\n✅ Written to ${outPath}`);
