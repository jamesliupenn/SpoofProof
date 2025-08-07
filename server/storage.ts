import { type User, type InsertUser, type GpsData, type InsertGpsData } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  saveGpsData(data: InsertGpsData): Promise<GpsData>;
  getLatestGpsData(): Promise<GpsData | undefined>;
  getAllGpsData(): Promise<GpsData[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private gpsDataStore: Map<string, GpsData>;

  constructor() {
    this.users = new Map();
    this.gpsDataStore = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async saveGpsData(data: InsertGpsData): Promise<GpsData> {
    const id = randomUUID();
    const gpsData: GpsData = { 
      ...data, 
      id, 
      timestamp: new Date().toISOString() 
    };
    this.gpsDataStore.set(id, gpsData);
    return gpsData;
  }

  async getLatestGpsData(): Promise<GpsData | undefined> {
    const allData = Array.from(this.gpsDataStore.values());
    return allData.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
  }

  async getAllGpsData(): Promise<GpsData[]> {
    return Array.from(this.gpsDataStore.values()).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }
}

export const storage = new MemStorage();
