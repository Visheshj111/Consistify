import OpenAI from 'openai';

// Initialize OpenAI client lazily to ensure env is loaded
let openai = null;
function getOpenAI() {
  if (!openai) {
    openai = new OpenAI({
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
  
  const systemPrompt = `You are creating a command-based execution roadmap. Every output must be a VERIFIABLE ACTION, not an explanation of knowledge.

COMMAND vs EXPLANATION:
❌ "Learn variables" → ✅ "Create variables.py, declare 5 variables, print their types"
❌ "Understand loops" → ✅ "Write a for loop that prints numbers 1-100"
❌ "Build confidence with CSS" → ✅ "Build a navigation bar with 5 links using CSS flexbox"

OUTPUT SCHEMA RULES:

1. PURPOSE field (NOT "description")
   - Must explain TECHNICAL DEPENDENCY, not learning outcomes
   - ❌ "This builds understanding for later" 
   - ✅ "These syntax patterns are required for loops in Day 5"
   - ❌ "Strengthens foundation"
   - ✅ "File I/O is prerequisite for the data parser project in Phase 3"

2. DELIVERABLES field (NOT "whatToLearn")
   - Must be VERIFIABLE OUTPUTS only
   - Each item = a thing that exists after completion
   - ❌ "Understanding of variables"
   - ✅ "A Python file with 10 variable declarations"
   - ❌ "Knowledge of Git basics"
   - ✅ "A GitHub repo with 3 commits pushed"

3. ACTION ITEMS - STRICTEST RULES:
   Every action must contain:
   - A VERB (${type === 'learning' ? 'watch, read, write, code, solve, build, create' : type === 'health' ? 'perform, hold, repeat, track, execute' : 'design, implement, deploy, test'})
   - An OBJECT (what you're acting on)
   - A CONSTRAINT (time, quantity, or completion criteria)
   
   ❌ "Practice Python (15 min)" - no object, no constraint
   ✅ "Write 3 Python functions that calculate area of circle, square, triangle (15 min)"
   
   ❌ "Complete exercises" - which exercises?
   ✅ "Complete exercises 1-20 on codecademy.com/python (25 min)"

4. SKILL PROGRESSION
   - Format: "Outcome: Can [verb] [object] [constraint]"
   - Must be testable
   - ❌ "Better understanding of functions"
   - ✅ "Can write functions with parameters and return values"

FORBIDDEN PHRASES (motivation AND abstraction):
- Motivational: "Great job", "Keep going", "You've got this", "Stay consistent"
- Abstract: "Strengthen understanding", "Build skills", "Develop knowledge", "Gain familiarity", "Core concepts", "Build foundation"
- Vague verbs: "Work on", "Continue", "Practice" (without specifics), "Review" (without scope)

RESOURCES: Same quality standard (real URLs, real creators)
- YouTube: Traversy Media, freeCodeCamp, Corey Schafer, The Net Ninja, Fireship
- Docs: MDN, Python.org, official documentation
- Interactive: freeCodeCamp, Codecademy, LeetCode, HackerRank

TONE: Command-line interface. Not a teacher, not a coach. An executor.`;  

  const userPrompt = `Create a ${totalDays}-day learning roadmap for: "${title}"${description ? ` - ${description}` : ''}

CRITICAL: EVERY DAY MUST BE DIFFERENT!
- Day 1 ≠ Day 2 ≠ Day 3 ≠ ... ≠ Day ${totalDays}
- Each day introduces NEW concepts or builds on previous days
- NO REPETITION of the same tasks across multiple days
- Progress must be VISIBLE day-to-day

CONSTRAINTS:
- Daily time budget: ${dailyMinutes} minutes
- Total days: ${totalDays}

PHASE STRUCTURE:
${phaseDistribution.map(p => `${p.name} (Days ${p.startDay}-${p.endDay}): ${p.focus}`).join('\n')}

PROGRESSION REQUIREMENTS:
- Days 1-${Math.ceil(totalDays * 0.3)}: Fundamentals (breathing, posture, vocal warmups, basic techniques)
- Days ${Math.ceil(totalDays * 0.3) + 1}-${Math.ceil(totalDays * 0.6)}: Technique building (scales, pitch control, tone quality)
- Days ${Math.ceil(totalDays * 0.6) + 1}-${totalDays}: Application (singing actual songs, performance, recording)

For each day, provide a JSON object with:

{
  "dayNumber": <number>,
  "phase": "<current phase name>",
  "title": "<specific topic/skill - NOT 'Day X: Topic', just the topic>",
  "purpose": "<technical reason this day exists - explain dependency or prerequisite relationship>",
  "deliverables": [
    "<verifiable output 1 - must be a thing that exists after completion>",
    "<verifiable output 2>",
    "<verifiable output 3>"
  ],
  "resources": [
    {
      "type": "video|docs|tutorial|article",
      "title": "<exact title>",
      "url": "<real URL>",
      "creator": "<creator name>"
    }
  ],
  "actionItems": [
    "<VERB + OBJECT + CONSTRAINT> (X min)",
    "<VERB + OBJECT + CONSTRAINT> (X min)"
  ],
  "skillProgression": "Outcome: Can <verb> <object> <constraint>",
  "nodeType": "up|down|neutral",
  "estimatedMinutes": ${dailyMinutes}
}

NodeType definitions:
- "up": New concept introduction
- "down": Practice/repetition of existing concepts  
- "neutral": Consolidation or review

EXAMPLE for a "Learn Python" goal, Day 2:
{
  "dayNumber": 2,
  "phase": "Phase 1: Foundation",
  "title": "Variables, Data Types, and Basic Operations",
  "purpose": "Variable manipulation and type conversion are used in every subsequent exercise, including the calculator project in Day 7.",
  "deliverables": [
    "A Python file named variables.py with 10 variable declarations (strings, ints, floats, bools)",
    "A temperature converter program (celsius_to_fahrenheit.py) that accepts input",
    "Completed W3Schools Python Variables exercises 1-8 (screenshots or code)"
  ],
  "resources": [
    {
      "type": "video",
      "title": "Python Variables and Data Types - Complete Guide",
      "url": "https://www.youtube.com/watch?v=Z1Yd7upQsXY",
      "creator": "Corey Schafer"
    },
    {
      "type": "docs",
      "title": "Python Built-in Types Documentation",
      "url": "https://docs.python.org/3/library/stdtypes.html",
      "creator": "Python.org"
    },
    {
      "type": "tutorial",
      "title": "Python Variables Tutorial",
      "url": "https://www.w3schools.com/python/python_variables.asp",
      "creator": "W3Schools"
    }
  ],
  "actionItems": [
    "Watch Corey Schafer's 'Variables and Data Types' video, pause and replicate each example in VS Code (20 min)",
    "Create variables.py: declare 10 variables of different types, print each with type() function (8 min)",
    "Read Python.org Built-in Types docs sections 4.1-4.3, test each operator in interactive shell (12 min)",
    "Write celsius_to_fahrenheit.py: accept Celsius input, convert to Fahrenheit using formula, print result (10 min)",
    "Complete exercises 1-8 at w3schools.com/python/python_variables.asp (10 min)"
  ],
  "skillProgression": "Outcome: Can declare variables of any type, perform arithmetic operations, and convert between types using int(), str(), float()",
  "nodeType": "up",
  "estimatedMinutes": 60
}

EXAMPLE for "Game Development in Unreal Engine", Day 1:
{
  "dayNumber": 1,
  "phase": "Phase 1: Foundation",
  "title": "Install Unreal Engine and Create First Level",
  "purpose": "The Unreal Engine installation and a working project are required for all blueprints, materials, and level design in subsequent days.",
  "deliverables": [
    "Unreal Engine 5.1 installed on your system",
    "A Third Person template project named 'MyFirstGame'",
    "A level containing 5 placed objects (cubes, spheres, point lights) arranged in space"
  ],
  "resources": [
    {
      "type": "video",
      "title": "Unreal Engine 5 Beginner Tutorial - Getting Started",
      "url": "https://www.youtube.com/watch?v=gQmiqmxJMtA",
      "creator": "Unreal Sensei"
    },
    {
      "type": "docs",
      "title": "Installing Unreal Engine",
      "url": "https://docs.unrealengine.com/5.0/en-US/installing-unreal-engine/",
      "creator": "Epic Games"
    }
  ],
  "actionItems": [
    "Download Epic Games Launcher from epicgames.com, install, create Epic account (10 min)",
    "Install Unreal Engine 5.1 through Epic Launcher Library tab (15 min)",
    "Watch Unreal Sensei's getting started video, pause at each UI section (25 min)",
    "Create new project: Third Person template, name it 'MyFirstGame', save to Documents (5 min)",
    "Place 3 cubes, 1 sphere, 1 point light in the level using Place Actors panel, move each to different positions (5 min)"
  ],
  "skillProgression": "Outcome: Can launch Unreal Engine, create a project, and place/manipulate actors in a level",
  "nodeType": "up",
  "estimatedMinutes": 60
}

Return ONLY a valid JSON array with exactly ${totalDays} day objects. No markdown formatting, no code blocks, no explanation text.`;

  try {
    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.4,
      max_tokens: 12000
    });

    const content = response.choices[0].message.content;
    
    // Parse the JSON response
    const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
    const tasks = JSON.parse(cleanContent);
    
    // Validate and clean all fields
    return tasks.map((task, index) => {
      const dayNumber = task.dayNumber || index + 1;
      const phase = task.phase || phaseDistribution.find(p => dayNumber >= p.startDay && dayNumber <= p.endDay)?.name || 'Foundation';
      
      // Clean purpose (technical dependency only)
      const cleanText = (text) => stripAbstractLanguage(stripMotivationalLanguage(text));
      
      // Clean and validate action items
      const actionItems = (task.actionItems || [])
        .map(item => typeof item === 'string' ? item : item.text || '')
        .filter(item => item.length > 0)
        .map(item => {
          // Ensure time allocation exists
          if (!item.match(/\(\d+\s*min\)/i)) {
            const estimatedTime = Math.floor(dailyMinutes / 4);
            return `${item} (${estimatedTime} min)`;
          }
          return item;
        });
      
      // Ensure minimum action items
      while (actionItems.length < 3) {
        const topicName = task.title || 'this session';
        actionItems.push(`Complete practice exercises for ${topicName} (${Math.floor(dailyMinutes / 4)} min)`);
      }
      
      // Clean and validate resources
      const resources = (task.resources || []).map(r => ({
        type: r.type || 'docs',
        title: r.title || 'Learning Resource',
        url: r.url || '',
        creator: r.creator || 'Unknown'
      })).filter(r => r.url && r.url.startsWith('http'));
      
      // Clean and validate deliverables (verifiable outputs)
      const deliverables = (task.deliverables || [])
        .filter(item => item && typeof item === 'string' && item.length > 0)
        .map(item => cleanText(item));
      
      // Ensure minimum deliverables
      while (deliverables.length < 2) {
        deliverables.push(`Completed exercises for ${task.title || 'this session'}`);
      }
      
      return {
        dayNumber,
        title: cleanText(task.title || `Session ${dayNumber}`),
        purpose: cleanText(task.purpose || task.description || `Technical foundation for subsequent days.`),
        estimatedMinutes: task.estimatedMinutes || dailyMinutes,
        phase,
        deliverables,
        resources,
        actionItems: actionItems.map(item => cleanText(item)),
        skillProgression: cleanText(task.skillProgression || `Outcome: Completed day ${dayNumber} objectives`),
        nodeType: task.nodeType || (dayNumber === 1 ? 'up' : index % 2 === 0 ? 'up' : 'down')
      };
    });
  } catch (error) {
    console.error('AI planning error:', error);
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
  const { title, totalDays, dailyMinutes } = goal;
  const tasks = [];
  const phases = calculatePhases(totalDays);
  
  for (let i = 1; i <= totalDays; i++) {
    const currentPhase = phases.find(p => i >= p.startDay && i <= p.endDay);
    const phaseDay = i - (currentPhase?.startDay || 1) + 1;
    
    tasks.push({
      dayNumber: i,
      title: `${title} - ${currentPhase?.name || 'Foundation'} Session ${phaseDay}`,
      purpose: `${currentPhase?.focus || 'Technical foundation'}. Required for tasks in subsequent sessions.`,
      estimatedMinutes: dailyMinutes,
      phase: currentPhase?.name || 'Phase 1: Foundation',
      deliverables: [
        `Completed exercises for session ${phaseDay}`,
        `Notes document for ${currentPhase?.name || 'this phase'}`,
        `Practice project files`
      ],
      resources: [],
      actionItems: [
        `Study core material for ${title} session ${phaseDay} (${Math.floor(dailyMinutes * 0.4)} min)`,
        `Complete ${phaseDay * 3} practice exercises (${Math.floor(dailyMinutes * 0.4)} min)`,
        `Create notes.md documenting key points from session ${phaseDay} (${Math.floor(dailyMinutes * 0.2)} min)`
      ],
      skillProgression: `Outcome: Completed session ${i} tasks for ${title}`,
      nodeType: i === 1 ? 'up' : (i % 2 === 0 ? 'up' : 'down')
    });
  }
  
  return tasks;
}

export default { generatePlan, checkTimelineAndSuggest };
