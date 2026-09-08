import fs from 'fs';
import path from 'path';
import { connectToDatabase, isMongoConfigured } from './mongodb';
import { UserModel, FacultyModel, AdminModel } from '@/models/User';
import { RequestModel } from '@/models/Request';
import { FacultyRequestModel } from '@/models/FacultyRequest';
import { AnnouncementModel } from '@/models/Announcement';
import { MessageModel } from '@/models/Message';

const dataFilePath = path.join(process.cwd(), 'src', 'lib', 'data.json');

// Memory cache for fallback mode (when MONGODB_URI is not set or during file fallback)
let cachedData: any = null;

function readFallbackData() {
  if (cachedData) return cachedData;
  try {
    const fileData = fs.readFileSync(dataFilePath, 'utf-8');
    cachedData = JSON.parse(fileData);
    return cachedData;
  } catch (err) {
    cachedData = { users: [], requests: [], announcements: [], messages: [], facultyRequests: [] };
    return cachedData;
  }
}

function writeFallbackData(data: any) {
  cachedData = data;
  try {
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.warn("Filesystem is read-only. Data will only persist in memory for this instance.");
  }
}

export function sanitizeUser(user: any) {
  if (!user) return null;
  const userObj = user.toObject ? user.toObject() : { ...user };
  const { password, _id, __v, createdAt, updatedAt, ...safeUser } = userObj;
  return safeUser;
}

function cleanDoc(doc: any) {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  const { _id, __v, createdAt, updatedAt, ...clean } = obj;
  return clean;
}

// ---------------- USER OPERATIONS ----------------

export async function getUsers(includeSensitive = false) {
  if (isMongoConfigured()) {
    try {
      const conn = await connectToDatabase();
      if (conn) {
        const db = conn.connection.db;
        const [students, faculty, admins] = await Promise.all([
          UserModel.find({}).lean(),
          FacultyModel.find({}).lean(),
          AdminModel.find({}).lean(),
        ]);
        let all: any[] = [...students, ...faculty, ...admins];

        // Also check if 'students' collection was created in Atlas
        if (all.length === 0 && db) {
          try {
            const studentCol = await db.collection('students').find({}).toArray();
            if (studentCol.length > 0) {
              all = [...all, ...studentCol];
            }
          } catch (_) {}
        }

        if (includeSensitive) {
          return all.map(u => {
            const { _id, __v, ...rest } = u as any;
            return rest;
          });
        }
        return all.map(sanitizeUser);
      }
    } catch (e) {
      console.warn("MongoDB getUsers failed:", (e as any).message);
    }
  }

  const users = readFallbackData().users || [];
  if (includeSensitive) return users;
  return users.map(sanitizeUser);
}

export async function saveUser(user: any) {
  if (isMongoConfigured()) {
    try {
      const conn = await connectToDatabase();
      if (conn) {
        let created;
        if (user.role === 'Faculty') {
          created = await FacultyModel.create(user);
        } else if (user.role === 'Admin') {
          created = await AdminModel.create(user);
        } else {
          created = await UserModel.create(user);
        }
        return sanitizeUser(created);
      }
    } catch (e) {
      console.warn("MongoDB saveUser failed, using fallback:", (e as any).message);
    }
  }

  const data = readFallbackData();
  if (!data.users) data.users = [];
  data.users.push(user);
  writeFallbackData(data);
  return sanitizeUser(user);
}

// ---------------- REQUEST OPERATIONS ----------------

export async function getRequests() {
  if (isMongoConfigured()) {
    try {
      const conn = await connectToDatabase();
      if (conn) {
        const reqs = await RequestModel.find({}).sort({ createdAt: -1 }).lean();
        return reqs.map(cleanDoc);
      }
    } catch (e) {
      console.warn("MongoDB getRequests failed, using fallback:", (e as any).message);
    }
  }

  return readFallbackData().requests || [];
}

export async function saveRequest(request: any) {
  if (isMongoConfigured()) {
    try {
      const conn = await connectToDatabase();
      if (conn) {
        const created = await RequestModel.create(request);
        return cleanDoc(created);
      }
    } catch (e) {
      console.warn("MongoDB saveRequest failed, using fallback:", (e as any).message);
    }
  }

  const data = readFallbackData();
  data.requests.unshift(request);
  writeFallbackData(data);
  return request;
}

export async function updateRequestStatus(id: string, status: string) {
  if (isMongoConfigured()) {
    try {
      const conn = await connectToDatabase();
      if (conn) {
        // Search in Student requests first
        const updatedStudent = await RequestModel.findOneAndUpdate(
          { id },
          { $set: { status } },
          { new: true }
        ).lean();

        if (updatedStudent) {
          return cleanDoc(updatedStudent);
        }

        // Search in Faculty requests
        const updatedFaculty = await FacultyRequestModel.findOneAndUpdate(
          { id },
          { $set: { status } },
          { new: true }
        ).lean();

        if (updatedFaculty) {
          return cleanDoc(updatedFaculty);
        }
      }
    } catch (e) {
      console.warn("MongoDB updateRequestStatus failed, using fallback:", (e as any).message);
    }
  }

  const data = readFallbackData();
  let index = data.requests?.findIndex((r: any) => r.id === id);
  if (index !== -1 && index !== undefined) {
    data.requests[index].status = status;
    writeFallbackData(data);
    return data.requests[index];
  }

  index = data.facultyRequests?.findIndex((r: any) => r.id === id);
  if (index !== -1 && index !== undefined) {
    data.facultyRequests[index].status = status;
    writeFallbackData(data);
    return data.facultyRequests[index];
  }

  return null;
}

// ---------------- FACULTY REQUEST OPERATIONS ----------------

export async function getFacultyRequests() {
  if (isMongoConfigured()) {
    try {
      const conn = await connectToDatabase();
      if (conn) {
        const reqs = await FacultyRequestModel.find({}).sort({ createdAt: -1 }).lean();
        return reqs.map(cleanDoc);
      }
    } catch (e) {
      console.warn("MongoDB getFacultyRequests failed, using fallback:", (e as any).message);
    }
  }

  return readFallbackData().facultyRequests || [];
}

export async function saveFacultyRequest(request: any) {
  if (isMongoConfigured()) {
    try {
      const conn = await connectToDatabase();
      if (conn) {
        const created = await FacultyRequestModel.create(request);
        return cleanDoc(created);
      }
    } catch (e) {
      console.warn("MongoDB saveFacultyRequest failed, using fallback:", (e as any).message);
    }
  }

  const data = readFallbackData();
  if (!data.facultyRequests) data.facultyRequests = [];
  data.facultyRequests.unshift(request);
  writeFallbackData(data);
  return request;
}

// ---------------- ANNOUNCEMENT OPERATIONS ----------------

export async function getAnnouncements() {
  if (isMongoConfigured()) {
    try {
      const conn = await connectToDatabase();
      if (conn) {
        const anns = await AnnouncementModel.find({}).sort({ createdAt: -1 }).lean();
        return anns.map(cleanDoc);
      }
    } catch (e) {
      console.warn("MongoDB getAnnouncements failed, using fallback:", (e as any).message);
    }
  }

  return readFallbackData().announcements || [];
}

export async function saveAnnouncement(announcement: any) {
  if (isMongoConfigured()) {
    try {
      const conn = await connectToDatabase();
      if (conn) {
        const created = await AnnouncementModel.create(announcement);
        return cleanDoc(created);
      }
    } catch (e) {
      console.warn("MongoDB saveAnnouncement failed, using fallback:", (e as any).message);
    }
  }

  const data = readFallbackData();
  data.announcements.unshift(announcement);
  writeFallbackData(data);
  return announcement;
}

// ---------------- MESSAGE & DOUBT OPERATIONS ----------------

export async function getMessages() {
  if (isMongoConfigured()) {
    try {
      const conn = await connectToDatabase();
      if (conn) {
        const msgs = await MessageModel.find({}).sort({ createdAt: -1 }).lean();
        return msgs.map(cleanDoc);
      }
    } catch (e) {
      console.warn("MongoDB getMessages failed, using fallback:", (e as any).message);
    }
  }

  return readFallbackData().messages || [];
}

export async function saveMessage(msg: any) {
  if (isMongoConfigured()) {
    try {
      const conn = await connectToDatabase();
      if (conn) {
        const created = await MessageModel.create(msg);
        return cleanDoc(created);
      }
    } catch (e) {
      console.warn("MongoDB saveMessage failed, using fallback:", (e as any).message);
    }
  }

  const data = readFallbackData();
  if (!data.messages) data.messages = [];
  data.messages.push(msg);
  writeFallbackData(data);
  return msg;
}

export async function deleteMessage(id: string) {
  if (isMongoConfigured()) {
    try {
      const conn = await connectToDatabase();
      if (conn) {
        const res = await MessageModel.deleteOne({ id });
        if (res.deletedCount && res.deletedCount > 0) {
          return true;
        }
      }
    } catch (e) {
      console.warn("MongoDB deleteMessage failed, using fallback:", (e as any).message);
    }
  }

  const data = readFallbackData();
  if (!data.messages) return false;
  const initialLen = data.messages.length;
  data.messages = data.messages.filter((m: any) => m.id !== id);
  if (data.messages.length !== initialLen) {
    writeFallbackData(data);
    return true;
  }
  return false;
}

export async function updateMessage(id: string, updates: any) {
  if (isMongoConfigured()) {
    try {
      const conn = await connectToDatabase();
      if (conn) {
        const updated = await MessageModel.findOneAndUpdate({ id }, { $set: updates }, { new: true }).lean();
        if (updated) {
          return cleanDoc(updated);
        }
      }
    } catch (e) {
      console.warn("MongoDB updateMessage failed, using fallback:", (e as any).message);
    }
  }

  const data = readFallbackData();
  if (!data.messages) return null;
  const idx = data.messages.findIndex((m: any) => m.id === id);
  if (idx !== -1) {
    data.messages[idx] = { ...data.messages[idx], ...updates };
    writeFallbackData(data);
    return data.messages[idx];
  }
  return null;
}

