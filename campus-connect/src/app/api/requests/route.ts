import { NextResponse } from 'next/server';
import { getRequests, saveRequest } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get('studentId');
  const facultyId = searchParams.get('facultyId');
  
  let requests = await getRequests();
  if (studentId) {
    requests = requests.filter((r: any) => r.studentId === studentId);
  }
  if (facultyId) {
    requests = requests.filter((r: any) => !r.targetFaculty || r.targetFaculty.includes(facultyId));
  }
  
  return NextResponse.json(requests);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.title || !body.studentId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Heuristic AI priority assessment based on urgency keywords
    const textToCheck = `${body.title} ${body.reason || ''}`.toLowerCase();
    const highPriorityKeywords = ['urgent', 'emergency', 'medical', 'hospital', 'immediate', 'today', 'tomorrow', 'hackathon', 'exam'];
    const isHighPriority = highPriorityKeywords.some(keyword => textToCheck.includes(keyword));

    const newRequest = {
      id: "req_" + crypto.randomUUID(),
      ...body,
      status: "Pending",
      submittedOn: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      priority: isHighPriority ? "High" : "Medium"
    };
    
    await saveRequest(newRequest);
    return NextResponse.json(newRequest);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to create request' }, { status: 500 });
  }
}
