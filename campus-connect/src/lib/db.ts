import fs from 'fs';
import path from 'path';

const dataFilePath = path.join(process.cwd(), 'src', 'lib', 'data.json');

// Use globalThis to persist data in memory across requests in the same instance (useful for Vercel/Serverless)
let cachedData: any = null;

function readData() {
  if (cachedData) return cachedData;
  try {
    const fileData = fs.readFileSync(dataFilePath, 'utf-8');
    cachedData = JSON.parse(fileData);
    return cachedData;
  } catch (err) {
    // Fallback for missing file or read errors
    cachedData = { users: [], requests: [], announcements: [], messages: [], facultyRequests: [] };
    return cachedData;
  }
}

function writeData(data: any) {
  cachedData = data;
  try {
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
  } catch (err) {
    // Silently ignore write errors on read-only filesystems (like Vercel)
    console.warn("Filesystem is read-only. Data will only persist in memory for this instance.");
  }
}

export function sanitizeUser(user: any) {
  if (!user) return null;
  const { password, ...safeUser } = user;
  return safeUser;
}

export function getUsers(includeSensitive = false) {
  const users = readData().users || [];
  if (includeSensitive) return users;
  return users.map(sanitizeUser);
}

export function getRequests() {
  return readData().requests || [];
}

export function getFacultyRequests() {
  return readData().facultyRequests || [];
}

export function saveRequest(request: any) {
  const data = readData();
  data.requests.unshift(request); // Add to beginning
  writeData(data);
  return request;
}

export function updateRequestStatus(id: string, status: string) {
  const data = readData();
  // Search in student requests
  let index = data.requests?.findIndex((r: any) => r.id === id);
  if (index !== -1 && index !== undefined) {
    data.requests[index].status = status;
    writeData(data);
    return data.requests[index];
  }
  // Search in faculty requests
  index = data.facultyRequests?.findIndex((r: any) => r.id === id);
  if (index !== -1 && index !== undefined) {
    data.facultyRequests[index].status = status;
    writeData(data);
    return data.facultyRequests[index];
  }
  return null;
}

export function getAnnouncements() {
  return readData().announcements || [];
}

export function saveAnnouncement(announcement: any) {
  const data = readData();
  data.announcements.unshift(announcement);
  writeData(data);
  return announcement;
}

export function getMessages() {
  return readData().messages || [];
}

export function saveMessage(msg: any) {
  const data = readData();
  if(!data.messages) data.messages = [];
  data.messages.push(msg);
  writeData(data);
  return msg;
}

export function saveFacultyRequest(request: any) {
  const data = readData();
  if(!data.facultyRequests) data.facultyRequests = [];
  data.facultyRequests.unshift(request);
  writeData(data);
  return request;
}

export function deleteMessage(id: string) {
  const data = readData();
  if (!data.messages) return false;
  const initialLen = data.messages.length;
  data.messages = data.messages.filter((m: any) => m.id !== id);
  if (data.messages.length !== initialLen) {
    writeData(data);
    return true;
  }
  return false;
}

export function saveUser(user: any) {
  const data = readData();
  if (!data.users) data.users = [];
  data.users.push(user);
  writeData(data);
  return sanitizeUser(user);
}
