import Groq from 'groq-sdk';

// Initialize OpenAI client lazily to ensure env is loaded
let openai = null;
function getOpenAI() {
  if (!openai) {
    openai = new Groq({
      apiKey: process.env.OPENAI_API_KEY
    });
  }
  return openai;
}

// Minimum recommended days for different goal types
const MINIMUM_DAYS = {
  learning: 3,
  project: 3,
  health: 3,
  exam: 3,
  habit: 3
};

// Domain-specific action verbs (forces concrete commands)
const DOMAIN_VERBS = {
  learning: ['watch', 'read', 'write', 'code', 'solve', 'build', 'create', 'install', 'configure', 'complete', 'implement'],
  project: ['design', 'implement', 'deploy', 'test', 'debug', 'refactor', 'document', 'commit', 'push'],
  health: ['perform', 'hold', 'repeat', 'track', 'measure', 'log', 'execute', 'complete'],
  exam: ['solve', 'answer', 'review', 'time', 'memorize', 'practice', 'drill'],
  habit: ['do', 'repeat', 'log', 'track', 'complete', 'execute']
};

export function checkTimelineAndSuggest(goalType, totalDays) {
  const minDays = MINIMUM_DAYS[goalType] || 3;
  
  if (totalDays < minDays) {
    return {
      isRushed: true,
      suggestedDays: minDays,
      message: `Minimum ${minDays} days recommended for this goal type to allow proper skill development.`
    };
  }
  
  return {
    isRushed: false,
    suggestedDays: totalDays,
    message: "Timeline accepted."
  };
}

export async function generatePlan(goal) {
  const { type, title, description, totalDays, dailyMinutes } = goal;
  
  // Calculate phase distribution based on total days
  const phaseDistribution = calculatePhases(totalDays);
  
  const systemPrompt = `You are an expert learning curriculum designer creating calm, achievable daily topics.

CORE PRINCIPLES:
1. One focused topic per day - no overwhelm
2. Topics build progressively from simple → intermediate → advanced
3. Language is calm and encouraging, never pressuring
4. Respect the user's pace - if they have fewer days, keep topics broad; more days = granular detail

OUTPUT REQUIREMENTS:
- Each day = ONE specific, focused topic
- Topics must be concrete, not vague (❌ "Basics" ✅ "Variables and Data Types")
- Progression must feel natural and achievable
- No anxiety-inducing language, no rush, no pressure

EXAMPLES:
- Singing (6 days): Day 1: Breathing and Posture, Day 2: Vocal Warmups, Day 3: Pitch Control...
- Python (30 days): Day 1: Variables and Data Types, Day 2: If Statements, Day 3: Loops...
- Guitar (7 days): Day 1: Tuning and Basic Chords, Day 2: Chord Transitions, Day 3: Strumming Patterns...

FORBIDDEN: "Master", "Cram", "Intensive", "Speed through", competitive language, guilt-inducing terms.`;  

  const userPrompt = `Create a ${totalDays}-day learning journey for: "${title}"${description ? ` - ${description}` : ''}

REQUIREMENTS:
- Generate ${totalDays} unique daily topics
- Each topic should be specific and focused on ONE concept
- Topics progress naturally: beginner → intermediate → advanced
- ${totalDays <= 7 ? 'Keep topics broad since time is limited - cover essentials only' : totalDays <= 14 ? 'Balance breadth and depth - core concepts with some practice' : 'Break topics into granular detail - comprehensive coverage'}
- Language should be calm and achievable, never overwhelming
- Daily time available: ${dailyMinutes} minutes

PACING GUIDE:
${totalDays <= 7 ? '- Days 1-2: Absolute fundamentals\n- Days 3-5: Core techniques\n- Days 6-7: First application' : 
  totalDays <= 14 ? '- Days 1-3: Foundations\n- Days 4-10: Core skills and practice\n- Days 11-14: Application and projects' :
  '- First 20%: Foundations and setup\n- Middle 50%: Core techniques with progressive complexity\n- Final 30%: Application, projects, and mastery'}

Return ONLY a valid JSON array:

[
  {
    "dayNumber": 1,
    "topic": "Specific topic name (calm, achievable focus)",
    "estimatedMinutes": ${dailyMinutes}
  },
  {
    "dayNumber": 2,
    "topic": "Next logical topic",
    "estimatedMinutes": ${dailyMinutes}
  }
  // ... for all ${totalDays} days
]

No markdown, no explanations, just the JSON array.`;

  try {
    console.log('🤖 Calling OpenAI to generate topics...');
    console.log('Goal:', title);
    console.log('Days:', totalDays);
    
    const response = await getOpenAI().chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 3000
    });

    const content = response.choices[0].message.content;
    console.log('✅ OpenAI Response received');
    console.log('Response preview:', content.substring(0, 200));
    
    // Parse the JSON response
    const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
    const topics = JSON.parse(cleanContent);
    console.log('✅ Parsed', topics.length, 'topics');
    
    // Convert simple topics to full task objects
    return topics.map((item, index) => {
      const dayNumber = item.dayNumber || index + 1;
      const phase = phaseDistribution.find(p => dayNumber >= p.startDay && dayNumber <= p.endDay)?.name || 'Foundation';
      const topic = item.topic || `Day ${dayNumber}`;
      
      // Generate learning resources based on topic
      const resources = generateResources(topic, title);
      
      return {
        dayNumber,
        title: topic,
        purpose: `Today's focus`,
        estimatedMinutes: item.estimatedMinutes || dailyMinutes,
        phase,
        deliverables: [`Understand and practice ${topic}`],
        resources,
        actionItems: [`Study and practice (${dailyMinutes} min)`],
        skillProgression: `Can apply ${topic}`,
        nodeType: dayNumber === 1 ? 'up' : (index % 2 === 0 ? 'up' : 'down')
      };
    });
  } catch (error) {
    console.error('❌ AI planning error:', error.message);
    console.error('Full error:', error);
    console.log('⚠️ Falling back to generic plan');
    return generateFallbackPlan(goal);
  }
}

// Remove abstract educational language
function stripAbstractLanguage(text) {
  if (!text || typeof text !== 'string') return text;
  
  const abstractPhrases = [
    /strengthen understanding/gi,
    /build skills?/gi,
    /develop knowledge/gi,
    /gain familiarity/gi,
    /learn the basics/gi,
    /core concepts?/gi,
    /fundamental concepts?/gi,
    /build foundation/gi,
    /improve ability/gi,
    /enhance skills?/gi,
    /deepen understanding/gi,
    /broaden knowledge/gi,
    /expand capabilities/gi,
    /master the basics/gi
  ];
  
  let cleaned = text;
  abstractPhrases.forEach(phrase => {
    cleaned = cleaned.replace(phrase, '');
  });
  
  return cleaned
    .replace(/\s+/g, ' ')
    .replace(/\s+\./g, '.')
    .replace(/\s+,/g, ',')
    .replace(/\.\s*\./g, '.')
    .trim();
}

// Remove any motivational language that slipped through
function stripMotivationalLanguage(text) {
  if (!text || typeof text !== 'string') return text;
  
  const bannedPhrases = [
    /great job/gi,
    /well done/gi,
    /keep it up/gi,
    /keep going/gi,
    /you're doing great/gi,
    /you're making progress/gi,
    /stay consistent/gi,
    /trust the process/gi,
    /believe in yourself/gi,
    /you've got this/gi,
    /feel confident/gi,
    /build confidence/gi,
    /celebrate your/gi,
    /be proud/gi,
    /appreciate your/gi,
    /remember why you started/gi,
    /you can do this/gi,
    /don't give up/gi,
    /stay motivated/gi,
    /congratulations/gi,
    /excellent work/gi,
    /amazing progress/gi,
    /proud of/gi,
    /you're on your way/gi,
    /believe in your/gi,
    /trust yourself/gi,
    /you're ready/gi,
    /take a moment to/gi,
    /reflect on your/gi,
    /embrace the/gi,
    /enjoy the journey/gi,
    /!\s*$/g, // Remove trailing exclamation points
  ];
  
  let cleaned = text;
  bannedPhrases.forEach(phrase => {
    cleaned = cleaned.replace(phrase, '');
  });
  
  // Clean up double spaces, orphaned punctuation, and trim
  return cleaned
    .replace(/\s+/g, ' ')
    .replace(/\s+\./g, '.')
    .replace(/\s+,/g, ',')
    .replace(/\.\s*\./g, '.')
    .trim();
}

function calculatePhases(totalDays) {
  if (totalDays <= 3) {
    return [
      { name: 'Phase 1: Foundation & Quick Wins', startDay: 1, endDay: totalDays, focus: 'Core concepts and first practical application' }
    ];
  }
  
  if (totalDays <= 7) {
    const foundationEnd = Math.ceil(totalDays * 0.4);
    return [
      { name: 'Phase 1: Foundation', startDay: 1, endDay: foundationEnd, focus: 'Core concepts and mental models' },
      { name: 'Phase 2: Application', startDay: foundationEnd + 1, endDay: totalDays, focus: 'Hands-on practice and building' }
    ];
  }
  
  if (totalDays <= 14) {
    const foundationEnd = Math.ceil(totalDays * 0.25);
    const coreEnd = Math.ceil(totalDays * 0.6);
    return [
      { name: 'Phase 1: Foundation', startDay: 1, endDay: foundationEnd, focus: 'Core concepts and terminology' },
      { name: 'Phase 2: Core Skills', startDay: foundationEnd + 1, endDay: coreEnd, focus: 'Essential techniques' },
      { name: 'Phase 3: Project', startDay: coreEnd + 1, endDay: totalDays, focus: 'Build something real' }
    ];
  }
  
  // 15+ days: Full 4-phase structure
  const foundationEnd = Math.ceil(totalDays * 0.2);
  const coreEnd = Math.ceil(totalDays * 0.5);
  const applicationEnd = Math.ceil(totalDays * 0.8);
  
  return [
    { name: 'Phase 1: Foundation', startDay: 1, endDay: foundationEnd, focus: 'Core concepts, terminology, mental models' },
    { name: 'Phase 2: Core Skills', startDay: foundationEnd + 1, endDay: coreEnd, focus: 'Essential techniques and patterns' },
    { name: 'Phase 3: Application', startDay: coreEnd + 1, endDay: applicationEnd, focus: 'Real-world problem solving' },
    { name: 'Phase 4: Mastery Project', startDay: applicationEnd + 1, endDay: totalDays, focus: 'Independent creation' }
  ];
}

function generateFallbackPlan(goal) {
  const { title, totalDays, dailyMinutes, type } = goal;
  const tasks = [];
  const phases = calculatePhases(totalDays);
  
  // Smart topic generation based on skill keywords
  const skillTopics = getSkillTopics(title.toLowerCase(), totalDays);
  
  for (let i = 1; i <= totalDays; i++) {
    const currentPhase = phases.find(p => i >= p.startDay && i <= p.endDay);
    const topic = skillTopics[i - 1] || `${title} - Session ${i}`;
    
    // Generate learning resources for this topic
    const resources = generateResources(topic, title);
    
    tasks.push({
      dayNumber: i,
      title: topic,
      purpose: `Focus on ${topic}`,
      estimatedMinutes: dailyMinutes,
      phase: currentPhase?.name || 'Phase 1: Foundation',
      deliverables: [`Complete study session on ${topic}`],
      resources,
      actionItems: [`Study ${topic} (${dailyMinutes} min)`],
      skillProgression: `Outcome: Completed ${topic}`,
      nodeType: i === 1 ? 'up' : (i % 2 === 0 ? 'up' : 'down')
    });
  }
  
  return tasks;
}

// Generate skill-specific topics based on keywords
function getSkillTopics(skillName, totalDays) {
  const topicLibrary = {
    // Programming
    'python': ['Variables and Data Types', 'Conditionals and If Statements', 'Loops (For and While)', 'Functions and Parameters', 'Lists and Arrays', 'Dictionaries and Sets', 'String Manipulation', 'File I/O Operations', 'Error Handling and Exceptions', 'Object-Oriented Programming Basics', 'Classes and Objects', 'Inheritance and Polymorphism', 'Modules and Packages', 'List Comprehensions', 'Lambda Functions', 'Decorators', 'Generators', 'Working with APIs', 'Data Analysis with Pandas', 'Building a Complete Project'],
    'javascript': ['Variables (let, const, var)', 'Data Types and Operators', 'Conditionals and Comparison', 'Loops (for, while, forEach)', 'Functions and Arrow Functions', 'Arrays and Array Methods', 'Objects and Object Methods', 'DOM Manipulation Basics', 'Event Listeners and Handling', 'ES6 Features', 'Promises and Async/Await', 'Fetch API and AJAX', 'Local Storage', 'Array Destructuring', 'Spread and Rest Operators', 'Modules (Import/Export)', 'Error Handling', 'Working with JSON', 'Building a Web App', 'Final Project'],
    'react': ['JSX and Components', 'Props and State', 'Event Handling', 'Conditional Rendering', 'Lists and Keys', 'Forms and Controlled Components', 'Lifecycle Methods', 'Hooks - useState', 'Hooks - useEffect', 'Hooks - useContext', 'Custom Hooks', 'React Router Basics', 'Navigation and Links', 'API Integration', 'State Management', 'Component Composition', 'Performance Optimization', 'Testing React Components', 'Deployment', 'Full Stack Project'],
    
    // Music
    'singing': ['Breathing Techniques and Posture', 'Vocal Warmups and Scales', 'Pitch Control and Ear Training', 'Tone Quality and Resonance', 'Basic Melodies and Simple Songs', 'Vocal Range Expansion', 'Articulation and Diction', 'Rhythm and Timing', 'Dynamics (Soft and Loud)', 'Vibrato Technique', 'Song Interpretation', 'Learning Your First Full Song', 'Performance Techniques', 'Microphone Technique', 'Harmony and Backing Vocals', 'Genre-Specific Techniques', 'Recording Basics', 'Stage Presence', 'Repertoire Building', 'Live Performance Practice'],
    'guitar': ['Parts of Guitar and Tuning', 'Basic Chords (G, C, D)', 'Chord Changes and Transitions', 'Strumming Patterns', 'Basic Fingerpicking', 'Reading Chord Charts', 'Power Chords', 'Barre Chords Basics', 'Minor Chords', 'Rhythm Patterns', 'Basic Scales', 'Learning Your First Song', 'Fingerstyle Techniques', 'Hammer-ons and Pull-offs', 'Slides and Bends', 'Palm Muting', 'Music Theory Basics', 'Improvisation', 'Song Writing Basics', 'Performance Practice'],
    'piano': ['Piano Keys and Posture', 'Right Hand Position and C Major Scale', 'Left Hand Bass Notes', 'Both Hands Together', 'Reading Sheet Music Basics', 'Basic Chords (C, F, G)', 'Chord Progressions', 'Rhythm and Timing', 'Dynamics and Expression', 'Pedal Technique', 'Minor Scales', 'Arpeggios', 'Hand Independence', 'Sight Reading', 'Your First Song', 'Music Theory Fundamentals', 'Advanced Chords', 'Improvisation', 'Performance Techniques', 'Recital Preparation'],
    
    // Design
    'photoshop': ['Interface and Workspace', 'Selection Tools', 'Layers and Layer Masks', 'Basic Adjustments', 'Brushes and Painting', 'Text and Typography', 'Color Correction', 'Retouching Techniques', 'Filters and Effects', 'Pen Tool Mastery', 'Compositing Basics', 'Smart Objects', 'Adjustment Layers', 'Blending Modes', 'Photo Manipulation', 'Creating Graphics', 'Working with RAW', 'Exporting for Web', 'Advanced Techniques', 'Portfolio Project'],
    'drawing': ['Basic Shapes and Lines', 'Shading Techniques', 'Perspective Basics', 'Proportions and Anatomy', 'Light and Shadow', 'Textures', 'Facial Features', 'Eyes and Expression', 'Hands and Feet', 'Full Body Proportions', 'Dynamic Poses', 'Clothing and Folds', 'Hair Rendering', 'Backgrounds', 'Composition', 'Color Theory', 'Digital vs Traditional', 'Character Design', 'Style Development', 'Final Artwork'],
    
    // Fitness
    'gym': ['Gym Equipment Tour', 'Proper Form Basics', 'Chest Exercises', 'Back Exercises', 'Shoulder Exercises', 'Arm Exercises', 'Leg Exercises', 'Core Strengthening', 'Compound Movements', 'Progressive Overload', 'Workout Split Basics', 'Cardio Integration', 'Rest and Recovery', 'Nutrition Basics', 'Tracking Progress', 'Advanced Techniques', 'Injury Prevention', 'Flexibility Work', 'Goal Setting', 'Custom Workout Plan'],
    'yoga': ['Basic Breathing (Pranayama)', 'Mountain Pose and Alignment', 'Sun Salutation A', 'Standing Poses', 'Balancing Poses', 'Forward Folds', 'Backbends', 'Twists', 'Hip Openers', 'Seated Poses', 'Inversions Basics', 'Core Strengthening', 'Arm Balances', 'Restorative Poses', 'Meditation Basics', 'Flexibility Flow', 'Strength Building', 'Mind-Body Connection', 'Full Practice Sequence', 'Personal Practice Development'],
    
    // Business & Tech
    'powerbi': ['Power BI Interface and Setup', 'Importing Data Sources', 'Data Transformation Basics', 'Creating Your First Visual', 'Table and Matrix Visuals', 'Chart Types and Usage', 'Filters and Slicers', 'DAX Basics', 'Calculated Columns', 'Measures and KPIs', 'Relationships Between Tables', 'Data Modeling', 'Time Intelligence', 'Advanced DAX Functions', 'Dashboard Design Principles', 'Interactive Reports', 'Publishing and Sharing', 'Row Level Security', 'Performance Optimization', 'Complete Dashboard Project'],
    'excel': ['Interface and Basic Formulas', 'Cell References', 'SUM, AVERAGE, COUNT', 'IF Statements', 'VLOOKUP and HLOOKUP', 'Data Sorting and Filtering', 'Conditional Formatting', 'Charts and Graphs', 'Pivot Tables Basics', 'Advanced Pivot Tables', 'Data Validation', 'INDEX and MATCH', 'Text Functions', 'Date and Time Functions', 'SUMIF and COUNTIF', 'Array Formulas', 'Macros Basics', 'Data Analysis', 'Dashboard Creation', 'Real-World Project'],
    
    // Languages
    'spanish': ['Basic Greetings and Introductions', 'Numbers and Counting', 'Present Tense Regular Verbs', 'Common Nouns and Articles', 'Adjectives and Descriptions', 'Question Words', 'Irregular Verbs (Ser, Estar)', 'Family and Relationships', 'Food and Restaurants', 'Daily Routine Vocabulary', 'Past Tense Basics', 'Future Tense', 'Directions and Locations', 'Shopping and Money', 'Weather and Seasons', 'Hobbies and Free Time', 'Making Plans', 'Conversation Practice', 'Cultural Topics', 'Real Conversations'],
    
    // Other
    'cooking': ['Knife Skills and Safety', 'Basic Cutting Techniques', 'Sautéing Basics', 'Boiling and Blanching', 'Roasting Vegetables', 'Cooking Proteins', 'Basic Sauces', 'Seasoning and Flavoring', 'Pasta from Scratch', 'Rice Varieties', 'Baking Basics', 'Bread Making', 'Eggs - All Methods', 'Soups and Stocks', 'Meal Prep Basics', 'International Cuisines', 'Desserts', 'Plating and Presentation', 'Menu Planning', 'Full Course Meal']
  };
  
  // Find matching topic set
  for (const [keyword, topics] of Object.entries(topicLibrary)) {
    if (skillName.includes(keyword)) {
      return topics.slice(0, totalDays);
    }
  }
  
  // Generic fallback
  const genericTopics = [];
  for (let i = 1; i <= totalDays; i++) {
    const phase = i <= totalDays * 0.3 ? 'Fundamentals' : 
                  i <= totalDays * 0.6 ? 'Intermediate Techniques' : 
                  'Advanced Application';
    genericTopics.push(`${phase} - Session ${i}`);
  }
  return genericTopics;
}

// Generate learning resources for a topic
function generateResources(topic, skillName) {
  const resources = [];
  const topicLower = topic.toLowerCase();
  const skillLower = skillName.toLowerCase();
  
  // YouTube - Always helpful
  resources.push({
    type: 'video',
    title: `${topic} - Tutorial`,
    url: `https://www.youtube.com/results?search_query=${encodeURIComponent(skillName + ' ' + topic + ' tutorial')}`,
    creator: 'YouTube'
  });
  
  // Add skill-specific resources
  if (skillLower.includes('python') || skillLower.includes('javascript') || skillLower.includes('react')) {
    resources.push({
      type: 'tutorial',
      title: `${topic} - Interactive Tutorial`,
      url: 'https://www.freecodecamp.org/',
      creator: 'freeCodeCamp'
    });
    resources.push({
      type: 'docs',
      title: 'Official Documentation',
      url: skillLower.includes('python') ? 'https://docs.python.org/' : 
            skillLower.includes('react') ? 'https://react.dev/' : 'https://developer.mozilla.org/',
      creator: 'Official Docs'
    });
  } else if (skillLower.includes('guitar') || skillLower.includes('piano') || skillLower.includes('singing')) {
    resources.push({
      type: 'tutorial',
      title: 'Music lessons and exercises',
      url: 'https://www.musictheory.net/',
      creator: 'MusicTheory.net'
    });
  } else if (skillLower.includes('excel') || skillLower.includes('powerbi')) {
    resources.push({
      type: 'tutorial',
      title: 'Step-by-step guide',
      url: 'https://support.microsoft.com/',
      creator: 'Microsoft'
    });
  } else {
    // Generic helpful resources
    resources.push({
      type: 'article',
      title: `Learn about ${topic}`,
      url: `https://www.google.com/search?q=${encodeURIComponent(skillName + ' ' + topic + ' tutorial')}`,
      creator: 'Web Search'
    });
  }
  
  return resources;
}

export default { generatePlan, checkTimelineAndSuggest };
