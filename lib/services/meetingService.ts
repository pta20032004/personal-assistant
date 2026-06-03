import { z } from 'zod';
import { prisma } from '@/lib/db';

const attendeeSchema = z
  .string()
  .trim()
  .min(1)
  .max(100, 'Tên người tham dự tối đa 100 ký tự');

export const createMeetingSchema = z
  .object({
    title: z.string().trim().min(1, 'Tiêu đề bắt buộc').max(200),
    startTime: z.coerce.date(),
    endTime: z.coerce.date(),
    attendees: z.array(attendeeSchema).max(50, 'Tối đa 50 người tham dự').default([]),
    notes: z.string().max(2000).nullable().optional(),
  })
  .refine((m) => m.endTime.getTime() >= m.startTime.getTime(), {
    message: 'Thời gian kết thúc phải sau thời gian bắt đầu',
    path: ['endTime'],
  });

export const updateMeetingSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    startTime: z.coerce.date().optional(),
    endTime: z.coerce.date().optional(),
    attendees: z.array(attendeeSchema).max(50).optional(),
    notes: z.string().max(2000).nullable().optional(),
  })
  .refine(
    (m) =>
      m.startTime === undefined ||
      m.endTime === undefined ||
      m.endTime.getTime() >= m.startTime.getTime(),
    { message: 'Thời gian kết thúc phải sau thời gian bắt đầu', path: ['endTime'] },
  );

export type CreateMeetingInput = z.infer<typeof createMeetingSchema>;
export type UpdateMeetingInput = z.infer<typeof updateMeetingSchema>;

export interface MeetingDTO {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  attendees: string[];
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

function toDTO(row: {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  attendees: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}): MeetingDTO {
  let attendees: string[] = [];
  try {
    const parsed: unknown = JSON.parse(row.attendees);
    if (Array.isArray(parsed)) attendees = parsed.filter((x): x is string => typeof x === 'string');
  } catch {
    // ignore malformed data
  }
  return { ...row, attendees };
}

export async function listUpcomingMeetings(now: Date = new Date()): Promise<MeetingDTO[]> {
  const rows = await prisma.meeting.findMany({
    where: { endTime: { gte: now } },
    orderBy: { startTime: 'asc' },
  });
  return rows.map(toDTO);
}

export async function listAllMeetings(): Promise<MeetingDTO[]> {
  const rows = await prisma.meeting.findMany({ orderBy: { startTime: 'asc' } });
  return rows.map(toDTO);
}

export async function createMeeting(input: CreateMeetingInput): Promise<MeetingDTO> {
  const data = createMeetingSchema.parse(input);
  const row = await prisma.meeting.create({
    data: {
      title: data.title,
      startTime: data.startTime,
      endTime: data.endTime,
      attendees: JSON.stringify(data.attendees),
      notes: data.notes ?? null,
    },
  });
  return toDTO(row);
}

export async function updateMeeting(
  id: string,
  patch: UpdateMeetingInput,
): Promise<MeetingDTO> {
  const data = updateMeetingSchema.parse(patch);
  const row = await prisma.meeting.update({
    where: { id },
    data: {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.startTime !== undefined ? { startTime: data.startTime } : {}),
      ...(data.endTime !== undefined ? { endTime: data.endTime } : {}),
      ...(data.attendees !== undefined
        ? { attendees: JSON.stringify(data.attendees) }
        : {}),
      ...(data.notes !== undefined ? { notes: data.notes } : {}),
    },
  });
  return toDTO(row);
}

export async function deleteMeeting(id: string): Promise<void> {
  await prisma.meeting.delete({ where: { id } });
}
