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
  
  const systemPrompt = `You are an expert learning curriculum designer with deep knowledge of every skill domain.

Your job: Generate a day-by-day topic progression for ANY skill the user wants to learn.

RULES:
1. Each day = ONE specific topic/concept to focus on
2. Topics must build on each other logically
3. Progress from fundamentals → intermediate → advanced
4. Topics must be SPECIFIC, not vague (❌ "Basics" ✅ "Breathing techniques and diaphragm control")
5. Use your knowledge to create the OPTIMAL learning path for that specific skill

EXAMPLES:
- Singing: Day 1: Breathing & Posture, Day 2: Vocal Warmups & Scales, Day 3: Pitch Control...
- Python: Day 1: Variables & Data Types, Day 2: Conditionals & Loops, Day 3: Functions...
- Guitar: Day 1: Parts of Guitar & Tuning, Day 2: Basic Chords (G, C, D), Day 3: Strumming Patterns...
- Drawing: Day 1: Basic Shapes & Lines, Day 2: Shading Techniques, Day 3: Perspective Basics...

FORBIDDEN: Motivational language, vague terms, repetition across days.`;  

  const userPrompt = `Create a ${totalDays}-day topic progression for: "${title}"${description ? ` - ${description}` : ''}

CRITICAL: Generate ${totalDays} UNIQUE topics, one per day.
- Each topic should be specific and focused
- Topics must progress logically (beginner → intermediate → advanced)
- NO repetition across days
- Use your knowledge of "${title}" to create the optimal learning sequence

Time available per day: ${dailyMinutes} minutes

Return ONLY a valid JSON array with this simple structure:

[
  {
    "dayNumber": 1,
    "topic": "Specific topic name (e.g., 'Breathing Techniques and Posture')",
    "estimatedMinutes": ${dailyMinutes}
  },
  {
    "dayNumber": 2,
    "topic": "Next specific topic",
    "estimatedMinutes": ${dailyMinutes}
  }
  // ... continue for all ${totalDays} days
]

No markdown, no code blocks, no explanation. Just the JSON array.`;

  try {
    console.log('🤖 Calling OpenAI to generate topics...');
    console.log('Goal:', title);
    console.log('Days:', totalDays);
    
    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
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
      
      return {
        dayNumber,
        title: item.topic || `Day ${dayNumber}`,
        purpose: `Focus on ${item.topic || 'this topic'}`,
        estimatedMinutes: item.estimatedMinutes || dailyMinutes,
        phase,
        deliverables: [`Complete study session on ${item.topic || 'this topic'}`],
        resources: [],
        actionItems: [`Study ${item.topic || 'this topic'} (${dailyMinutes} min)`],
        skillProgression: `Outcome: Completed ${item.topic || 'this topic'}`,
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
