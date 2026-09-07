import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini API
const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// --- LOCAL SMART ENGINE (FALLBACK) ---
const localResponses: { [key: string]: string } = {
  "hello": "Hello! I am your CampusConnect Assistant. How can I help you today?",
  "hi": "Hi there! I'm here to help with your academic doubts or campus questions.",
  "leave": "To apply for leave, click the '+ New Permission Request' button on your dashboard. You can draft a letter like: 'Dear HOD, I am requesting leave for [reason] on [date].'",
  "letter": "I can help you draft a letter! Just mention the purpose (e.g., 'sick leave' or 'event permission') and I'll give you a template.",
  "exam": "Exam schedules are usually posted in the 'Announcements' tab. Keep an eye on updates from the Administration.",
  "library": "The central library is open from 9:00 AM to 8:00 PM on weekdays.",
  "help": "You can ask me about: leave letters, campus timings, exam updates, or how to use this dashboard!"
};

const getLocalResponse = (msg: string) => {
  const lower = (msg || '').toLowerCase();
  for (const key in localResponses) {
    if (lower.includes(key)) return localResponses[key];
  }
  return "I am currently answering via the local assistant mode. You can ask me about campus queries like 'leave letters', 'exams', or 'timings'!";
};

export async function POST(req: Request) {
  let message = "";
  try {
    const body = await req.json();
    message = body.message || "";
  } catch (err) {
    return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
  }

  if (!message.trim()) {
    return NextResponse.json({ response: "Please enter a message to get started." });
  }

  // If no valid Gemini API key is configured, respond using local smart engine
  if (!apiKey || apiKey === 'YOUR_API_KEY_HERE' || !genAI) {
    return NextResponse.json({ 
      response: getLocalResponse(message) 
    });
  }

  try {
    const prompt = `You are the CampusConnect AI Assistant. You are a helpful AI tutor for college students. 
    Help with: academic doubts, concepts, and campus questions.
    Student's question: ${message}`;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    return NextResponse.json({ response: responseText });
  } catch (error: any) {
    console.error('AI Assistant Error:', error.message || error);
    
    if (error.message?.includes('403') || error.message?.includes('API_KEY_INVALID')) {
      return NextResponse.json({ 
        response: "🔑 **API Key Error:** The configured Gemini API key is invalid. Falling back to local mode:\n\n" + getLocalResponse(message)
      }, { status: 200 });
    }

    return NextResponse.json({ 
      response: getLocalResponse(message)
    });
  }
}
