import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { createMeeting, listAllMeetings } from '@/lib/services/meetingService';

export async function GET() {
  const meetings = await listAllMeetings();
  return NextResponse.json({ meetings });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const meeting = await createMeeting(body);
    return NextResponse.json({ meeting }, { status: 201 });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: 'validation', issues: err.flatten() }, { status: 400 });
    }
    console.error('[meetings POST]', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
