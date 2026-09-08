import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getAnnouncements, getRequests, getUsers } from '@/lib/db';

// Initialize Gemini API
const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// Preferred model fallback hierarchy
const CANDIDATE_MODELS = ['gemini-3.6-flash', 'gemini-3.7-flash', 'gemini-3.8-flash', 'gemini-2.5-flash'];

export async function POST(req: Request) {
  let message = "";
  let history: { role: string; content: string }[] = [];
  let studentId: string | undefined = undefined;

  try {
    const body = await req.json();
    message = body.message || "";
    studentId = body.studentId;
    if (Array.isArray(body.history)) {
      history = body.history;
    }
  } catch (err) {
    return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
  }

  if (!message.trim()) {
    return NextResponse.json({ response: "Please enter a message to get started." });
  }

  if (!apiKey || !genAI) {
    return NextResponse.json({ 
      response: "⚠️ The `GOOGLE_API_KEY` environment variable is not configured. Please add your Gemini API key to `.env.local` or your deployment settings." 
    }, { status: 200 });
  }

  // Fetch real campus context from the database to assist the model accurately
  let campusContext = "";
  try {
    const [allAnnouncements, allRequests, allUsers] = await Promise.all([
      getAnnouncements().catch(() => []),
      getRequests().catch(() => []),
      getUsers().catch(() => [])
    ]);

    const recentAnnouncements = allAnnouncements.slice(0, 5).map((a: any) => 
      `- Title: ${a.title} | Type: ${a.type || 'General'} | Date: ${a.date || 'Recent'} | Details: ${a.content}`
    ).join("\n");

    const faculties = allUsers.filter((u: any) => u.role === 'Faculty').slice(0, 8).map((f: any) =>
      `- ${f.name} (${f.details?.department || 'Department'}${f.details?.designation ? ', ' + f.details.designation : ''})`
    ).join("\n");

    let studentReqInfo = "";
    if (studentId) {
      const studentReqs = allRequests.filter((r: any) => r.studentId === studentId);
      if (studentReqs.length > 0) {
        studentReqInfo = studentReqs.map((r: any) => 
          `- Request ID: ${r.id}, Title: "${r.title}", Type: "${r.type}", Status: ${r.status}, Date: ${r.date || 'Recent'}`
        ).join("\n");
      } else {
        studentReqInfo = "You have no active or pending requests at the moment.";
      }
    }

    campusContext = `
Current Application Data & Context:
${recentAnnouncements ? `Recent Announcements:\n${recentAnnouncements}` : 'No recent announcements.'}

${faculties ? `Campus Faculty:\n${faculties}` : ''}

${studentReqInfo ? `Current Student's Requests:\n${studentReqInfo}` : ''}
`;
  } catch (ctxErr) {
    console.warn("Could not load campus context for AI:", ctxErr);
  }

  // Strict server-side system instruction enforcing the Campus AI persona
  const systemInstruction = 
`You are "Campus AI", the dedicated AI assistant for the CampusConnect college web application.

CORE IDENTITY & PURPOSE:
- You identify yourself strictly as "Campus AI" or "CampusConnect AI Assistant".
- Your ONLY purpose is to assist students with campus, college, and academic matters relevant to this application.

WHAT YOU CAN AND SHOULD ANSWER:
1. Campus & College Information: Campus portal navigation, departments, courses, academic doubts, study guidance, exam tips, and college procedures.
2. Announcements & Events: Checking notices, event circulars, seminar alerts, and campus updates (use the provided application context).
3. Student Requests & Permissions: Guiding students on how to submit permission requests (e.g., leave applications, industrial visits, OD/event passes, hostel permissions), checking their request statuses if available in context, or drafting formal request letters.
4. Faculty Information: Information on faculty members listed in the college system and how to contact or address them.
5. Application Features: Explaining how to use the Student Dashboard, Doubts & Q&A forum, Announcements tab, and Settings.

STRICT REFUSAL RULE FOR UNRELATED TOPICS:
- If the user asks about ANY topic unrelated to college, campus, academics, or this application—such as celebrities, movies, TV shows, pop culture, entertainment, sports trivia, world politics, general news, gaming, jokes, general trivia, or random general knowledge:
  You MUST POLITELY REFUSE to answer.
- When refusing, follow this format:
  "I'm Campus AI, so I can help you with campus-related questions such as announcements, academic information, requests, events, and college procedures. I can't help with unrelated [mention category, e.g. entertainment / celebrity / sports] questions."
- DO NOT answer the unrelated question under any circumstances. Never answer first and then warn; refuse directly and politely.

ACCURACY & HALLUCINATION POLICY:
- If a student asks for specific college details (such as specific exam dates, fee structures, library book availability, or custom phone numbers) that are NOT present in the provided context or general standard college procedures, clearly state that you do not have that specific information in your records and suggest they check the Announcements tab or contact the department administration directly. Do NOT invent or fabricate college facts or dates.

FORMATTING:
- Format your response with clean Markdown (use **bold** for highlights, bullet points for lists, and neat paragraph breaks). Keep answers helpful, respectful, and concise.

${campusContext ? `\n---\nLIVE CAMPUS CONTEXT:\n${campusContext}\n---` : ''}
`;

  // Format past history for Gemini startChat
  const geminiHistory = history
    .filter(item => (item.role === 'user' || item.role === 'assistant') && item.content?.trim())
    .map(item => ({
      role: item.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: item.content }]
    }));

  let lastError: any = null;

  for (const modelName of CANDIDATE_MODELS) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: systemInstruction
      });

      const chat = model.startChat({
        history: geminiHistory
      });

      const result = await chat.sendMessage(message);
      const responseText = result.response.text();

      return NextResponse.json({ response: responseText });
    } catch (err: any) {
      lastError = err;
      // If error is 404 (model not found / deprecated for this API tier), try the next candidate model
      if (err.status === 404 || err.message?.includes('404')) {
        continue;
      }
      // If error is auth/quota or other fatal error, stop and report
      break;
    }
  }

  console.error('Gemini API Error:', lastError?.message || lastError);

  if (lastError?.status === 400 || lastError?.message?.includes('API_KEY_INVALID')) {
    return NextResponse.json({
      response: "🔑 The configured `GOOGLE_API_KEY` appears to be invalid. Please verify your API key."
    }, { status: 200 });
  }

  if (lastError?.status === 429 || lastError?.message?.includes('RESOURCE_EXHAUSTED')) {
    return NextResponse.json({
      response: "⏳ Rate limit reached for Gemini API. Please wait a moment before asking again."
    }, { status: 200 });
  }

  return NextResponse.json({
    response: "Sorry, I encountered an issue connecting to the AI service. Please try again in a few moments."
  }, { status: 200 });
}

