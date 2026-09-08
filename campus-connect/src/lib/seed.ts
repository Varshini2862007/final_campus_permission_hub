import fs from 'fs';
import path from 'path';
import { connectToDatabase, isMongoConfigured } from './mongodb';
import { UserModel } from '@/models/User';
import { RequestModel } from '@/models/Request';
import { FacultyRequestModel } from '@/models/FacultyRequest';
import { AnnouncementModel } from '@/models/Announcement';
import { MessageModel } from '@/models/Message';

export async function seedInitialDataIfEmpty() {
  if (!isMongoConfigured()) return { seeded: false, reason: 'MONGODB_URI not configured' };

  const conn = await connectToDatabase();
  if (!conn) return { seeded: false, reason: 'Database connection failed' };

  const userCount = await UserModel.countDocuments();
  if (userCount > 0) {
    return { seeded: false, reason: 'Database already has data' };
  }

  const dataFilePath = path.join(process.cwd(), 'src', 'lib', 'data.json');
  if (!fs.existsSync(dataFilePath)) {
    return { seeded: false, reason: 'data.json backup file not found' };
  }

  const raw = fs.readFileSync(dataFilePath, 'utf-8');
  const seedData = JSON.parse(raw);

  if (seedData.users && seedData.users.length > 0) {
    await UserModel.insertMany(seedData.users);
  }

  if (seedData.requests && seedData.requests.length > 0) {
    await RequestModel.insertMany(seedData.requests);
  }

  if (seedData.facultyRequests && seedData.facultyRequests.length > 0) {
    await FacultyRequestModel.insertMany(seedData.facultyRequests);
  }

  if (seedData.announcements && seedData.announcements.length > 0) {
    await AnnouncementModel.insertMany(seedData.announcements);
  }

  if (seedData.messages && seedData.messages.length > 0) {
    await MessageModel.insertMany(seedData.messages);
  }

  return { seeded: true, userCount: seedData.users?.length || 0 };
}
