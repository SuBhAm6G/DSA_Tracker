import { ModuleWithTopics, TopicWithProgress, Subtopic } from './supabase/types';

export function applyLanguageVirtualTopics(modules: ModuleWithTopics[], language: string | null): ModuleWithTopics[] {
  if (!language || language === 'Python') {
    return modules;
  }

  return modules.map(mod => {
    // Only modify "Module 0"
    if (!mod.slug.includes('-m0-')) {
      return mod;
    }

    // Rename module
    let newModName = mod.name;
    if (mod.name.includes('Python')) {
      newModName = mod.name.replace('Python', language);
    } else {
      newModName = mod.name + ` (${language})`;
    }

    // Generate virtual topics
    const virtualTopics = getVirtualTopics(mod.slug, language);
    
    // If we have mapped virtual topics for this module, replace them.
    // Otherwise, just use the original topics but rename the module.
    return {
      ...mod,
      name: newModName,
      topics: virtualTopics.length > 0 ? mergeVirtualTopics(mod.topics, virtualTopics) : mod.topics,
      totalCount: virtualTopics.length > 0 ? virtualTopics.length : mod.totalCount
    };
  });
}

// Preserve existing progress if possible, but map to new virtual IDs
function mergeVirtualTopics(originalTopics: TopicWithProgress[], virtualTopics: TopicWithProgress[]): TopicWithProgress[] {
  // Since virtual topics have different IDs (hash based), they won't have progress initially.
  // When the user clicks them, `toggleTopic` in `useCurriculum` will insert progress using the virtual ID.
  return virtualTopics;
}

function getVirtualTopics(moduleSlug: string, language: string): TopicWithProgress[] {
  // For List 1 Module 0
  if (moduleSlug.includes('list-1') || moduleSlug.includes('l1-m0')) {
    return getLanguageBasicsTopics('l1-m0', language);
  }
  // For List 2 Module 0
  if (moduleSlug.includes('list-2') || moduleSlug.includes('l2-m0')) {
    return getLanguageBasicsTopics('l2-m0', language);
  }
  
  return [];
}

function getLanguageBasicsTopics(mId: string, language: string): TopicWithProgress[] {
  const topicsMap: Record<string, string[]> = {
    'C++': [
      'Basic Syntax & Data Types',
      'Pointers, References & Memory Management',
      'STL Vectors & Strings',
      'STL Maps, Sets & Hash Tables',
      'Object Oriented Programming Basics'
    ],
    'Java': [
      'Basic Syntax & Data Types',
      'Object Oriented Programming Basics',
      'ArrayList & String',
      'HashMap & HashSet',
      'Exception Handling'
    ],
    'JavaScript/TypeScript': [
      'Basic Syntax & Let/Const',
      'Objects, Arrays & Methods',
      'Functions & Closures',
      'Map & Set',
      'Promises & Async/Await'
    ]
  };

  const topicNames = topicsMap[language] || [];
  
  return topicNames.map((name, i) => {
    // Generate a stable ID based on language + module + index
    const langKey = language.toLowerCase().replace(/[^a-z0-9]/g, '');
    const virtualSlug = `${mId}-virtual-${langKey}-t${i}`;
    
    // UUID v4 format isn't strictly required for the `id` field in frontend UI, 
    // BUT user_topic_progress uses topic_id UUID. 
    // Since this is a virtual topic, if they complete it, we insert into user_topic_progress.
    // Postgres requires a UUID for topic_id in user_topic_progress! 
    // We MUST use a valid UUID. We can generate a deterministic UUID.
    
    // Simple deterministic UUID generator for virtual topics
    const uuidChars = `${langKey.padEnd(8, '0')}${mId.replace(/[^a-z0-9]/g, '').padEnd(4, '0')}432189ab${i.toString().padStart(12, '0')}`;
    const virtualId = `${uuidChars.slice(0, 8)}-${uuidChars.slice(8, 12)}-${uuidChars.slice(12, 16)}-${uuidChars.slice(16, 20)}-${uuidChars.slice(20, 32)}`;

    return {
      id: virtualId,
      module_id: mId, // Not a valid UUID but we don't insert modules
      slug: virtualSlug,
      name: `0.${i + 1} ${name}`,
      order_index: i,
      is_trackable: true,
      subtopics: [],
      progress: undefined
    };
  });
}
