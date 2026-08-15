/**
 * seed-curriculum.ts
 *
 * Seeds curriculum.json into Supabase.
 * Requires: SUPABASE_SERVICE_ROLE_KEY env var (server-only, never expose to client)
 *
 * Usage: npm run seed-curriculum
 * Env:   copy .env.local and set SUPABASE_SERVICE_ROLE_KEY
 *
 * This script is IDEMPOTENT — safe to re-run when lists.txt is updated.
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import type { Curriculum, CurriculumList, Module, Topic, Subtopic } from './parse-curriculum';

// Load env manually (tsx doesn't load .env.local by default)
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const [key, ...vals] = line.split('=');
    if (key && vals.length) {
      process.env[key.trim()] = vals.join('=').trim().replace(/^"|"$/g, '');
    }
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('ERROR: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

const curriculumPath = path.resolve(process.cwd(), 'app', 'data', 'curriculum.json');
if (!fs.existsSync(curriculumPath)) {
  console.error('ERROR: curriculum.json not found. Run `npm run parse-curriculum` first.');
  process.exit(1);
}

const curriculum: Curriculum = JSON.parse(fs.readFileSync(curriculumPath, 'utf-8'));

async function upsertList(list: CurriculumList): Promise<string> {
  const { data, error } = await supabase
    .from('curriculum_lists')
    .upsert({
      slug:        list.slug,
      name:        list.name,
      short_name:  list.shortName,
      description: list.description,
      order_index: list.orderIndex,
    }, { onConflict: 'slug' })
    .select('id')
    .single();

  if (error) throw new Error(`List upsert failed: ${error.message}`);
  return data.id;
}

async function upsertModule(mod: Module, listDbId: string): Promise<string> {
  const { data, error } = await supabase
    .from('modules')
    .upsert({
      list_id:     listDbId,
      slug:        mod.slug,
      name:        mod.name,
      order_index: mod.orderIndex,
    }, { onConflict: 'slug' })
    .select('id')
    .single();

  if (error) throw new Error(`Module upsert failed [${mod.slug}]: ${error.message}`);
  return data.id;
}

async function upsertTopic(topic: Topic, moduleDbId: string): Promise<string> {
  const { data, error } = await supabase
    .from('topics')
    .upsert({
      module_id:    moduleDbId,
      slug:         topic.slug,
      name:         topic.name,
      order_index:  topic.orderIndex,
      is_trackable: topic.isTrackable,
    }, { onConflict: 'slug' })
    .select('id')
    .single();

  if (error) throw new Error(`Topic upsert failed [${topic.slug}]: ${error.message}`);
  return data.id;
}

async function upsertSubtopics(subtopics: Subtopic[], topicDbId: string) {
  if (!subtopics.length) return;
  const rows = subtopics.map(st => ({
    topic_id:    topicDbId,
    slug:        st.slug,
    name:        st.name,
    order_index: st.orderIndex,
  }));

  const { error } = await supabase
    .from('subtopics')
    .upsert(rows, { onConflict: 'slug' });

  if (error) throw new Error(`Subtopic batch upsert failed: ${error.message}`);
}

async function seed() {
  console.log(`Seeding ${curriculum.lists.length} lists into Supabase...\n`);

  for (const list of curriculum.lists) {
    console.log(`→ List: ${list.name}`);
    const listDbId = await upsertList(list);

    for (const mod of list.modules) {
      process.stdout.write(`  Module: ${mod.name.slice(0, 50)}... `);
      const modDbId = await upsertModule(mod, listDbId);

      for (const topic of mod.topics) {
        const topicDbId = await upsertTopic(topic, modDbId);
        await upsertSubtopics(topic.subtopics, topicDbId);
      }
      process.stdout.write(`✓ (${mod.topics.length} topics)\n`);
    }
    console.log();
  }

  // Summary
  const { count: listCount } = await supabase.from('curriculum_lists').select('*', { count: 'exact', head: true });
  const { count: modCount }  = await supabase.from('modules').select('*', { count: 'exact', head: true });
  const { count: topCount }  = await supabase.from('topics').select('*', { count: 'exact', head: true });
  const { count: subCount }  = await supabase.from('subtopics').select('*', { count: 'exact', head: true });

  console.log('✅ Seed complete!');
  console.log(`   Lists: ${listCount}  |  Modules: ${modCount}  |  Topics: ${topCount}  |  Subtopics: ${subCount}`);
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
