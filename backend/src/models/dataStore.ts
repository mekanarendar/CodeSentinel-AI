import mongoose, { Types } from 'mongoose';
import { UserModel, IUser } from './User.ts';
import { SessionModel, ISession } from './Session.ts';
import { ProjectModel, IProject } from './Project.ts';
import { ReviewModel, IReview } from './Review.ts';
import { AuditEventModel, IAuditEvent } from './AuditEvent.ts';
import { getDatabaseStatus } from '../config/database.ts';

// In-Memory Storage maps
const memoryUsers = new Map<string, any>();
const memorySessions = new Map<string, any>();
const memoryProjects = new Map<string, any>();
const memoryReviews = new Map<string, any>();
const memoryAuditEvents: any[] = [];

function isMongoConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

export const DataStore = {
  // User Operations
  async findUserByEmail(email: string, includePassword = false) {
    if (isMongoConnected()) {
      const query = UserModel.findOne({ email: email.toLowerCase() });
      if (includePassword) query.select('+passwordHash');
      return query.exec();
    }
    const user = Array.from(memoryUsers.values()).find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );
    if (!user) return null;
    const cloned = { ...user };
    if (!includePassword) delete cloned.passwordHash;
    return cloned;
  },

  async findUserById(id: string, includePassword = false) {
    if (isMongoConnected()) {
      const query = UserModel.findById(id);
      if (includePassword) query.select('+passwordHash');
      return query.exec();
    }
    const user = memoryUsers.get(id);
    if (!user) return null;
    const cloned = { ...user };
    if (!includePassword) delete cloned.passwordHash;
    return cloned;
  },

  async createUser(data: Partial<IUser> & { passwordHash: string }) {
    if (isMongoConnected()) {
      return UserModel.create(data);
    }
    const id = new Types.ObjectId().toString();
    const newUser = {
      _id: id,
      id,
      name: data.name,
      email: data.email?.toLowerCase(),
      passwordHash: data.passwordHash,
      role: data.role || 'user',
      isActive: true,
      preferences: data.preferences || {
        theme: 'dark',
        autoRedactSecrets: true,
        defaultLanguage: 'typescript',
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memoryUsers.set(id, newUser);
    const cloned = { ...newUser };
    delete (cloned as any).passwordHash;
    return cloned;
  },

  async updateUser(id: string, updates: Partial<IUser>) {
    if (isMongoConnected()) {
      return UserModel.findByIdAndUpdate(id, updates, { new: true });
    }
    const user = memoryUsers.get(id);
    if (!user) return null;
    const updated = { ...user, ...updates, updatedAt: new Date() };
    memoryUsers.set(id, updated);
    const cloned = { ...updated };
    delete cloned.passwordHash;
    return cloned;
  },

  // Session Operations
  async createSession(data: { userId: string; tokenHash: string; userAgent?: string; ipAddress?: string; expiresAt: Date }) {
    if (isMongoConnected()) {
      return SessionModel.create(data);
    }
    const id = new Types.ObjectId().toString();
    const session = {
      _id: id,
      id,
      userId: data.userId,
      tokenHash: data.tokenHash,
      userAgent: data.userAgent,
      ipAddress: data.ipAddress,
      expiresAt: data.expiresAt,
      createdAt: new Date(),
    };
    memorySessions.set(id, session);
    return session;
  },

  async findSession(tokenHash: string) {
    if (isMongoConnected()) {
      return SessionModel.findOne({ tokenHash, revokedAt: { $exists: false } }).exec();
    }
    return (
      Array.from(memorySessions.values()).find(
        (s) => s.tokenHash === tokenHash && !s.revokedAt && new Date(s.expiresAt) > new Date()
      ) || null
    );
  },

  async revokeSession(tokenHash: string) {
    if (isMongoConnected()) {
      return SessionModel.updateOne({ tokenHash }, { revokedAt: new Date() }).exec();
    }
    for (const session of memorySessions.values()) {
      if (session.tokenHash === tokenHash) {
        session.revokedAt = new Date();
      }
    }
  },

  // Project Operations
  async findProjectsByUser(userId: string) {
    if (isMongoConnected()) {
      return ProjectModel.find({ userId }).sort({ updatedAt: -1 }).exec();
    }
    return Array.from(memoryProjects.values())
      .filter((p) => p.userId.toString() === userId.toString())
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  },

  async findProjectById(id: string, userId: string) {
    if (isMongoConnected()) {
      return ProjectModel.findOne({ _id: id, userId }).exec();
    }
    const project = memoryProjects.get(id);
    if (project && project.userId.toString() === userId.toString()) {
      return project;
    }
    return null;
  },

  async createProject(data: Partial<IProject>) {
    if (isMongoConnected()) {
      return ProjectModel.create(data);
    }
    const id = new Types.ObjectId().toString();
    const project = {
      _id: id,
      id,
      userId: data.userId,
      name: data.name,
      description: data.description || '',
      repositoryUrl: data.repositoryUrl || '',
      primaryLanguage: data.primaryLanguage || 'typescript',
      latestScore: 100,
      totalReviews: 0,
      tags: data.tags || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memoryProjects.set(id, project);
    return project;
  },

  async updateProject(id: string, userId: string, updates: Partial<IProject>) {
    if (isMongoConnected()) {
      return ProjectModel.findOneAndUpdate({ _id: id, userId }, updates, { new: true }).exec();
    }
    const project = memoryProjects.get(id);
    if (!project || project.userId.toString() !== userId.toString()) return null;
    const updated = { ...project, ...updates, updatedAt: new Date() };
    memoryProjects.set(id, updated);
    return updated;
  },

  async deleteProject(id: string, userId: string) {
    if (isMongoConnected()) {
      await ReviewModel.deleteMany({ projectId: id, userId });
      return ProjectModel.findOneAndDelete({ _id: id, userId }).exec();
    }
    const project = memoryProjects.get(id);
    if (!project || project.userId.toString() !== userId.toString()) return null;
    memoryProjects.delete(id);
    for (const [revId, rev] of memoryReviews.entries()) {
      if (rev.projectId?.toString() === id) {
        memoryReviews.delete(revId);
      }
    }
    return project;
  },

  // Review Operations
  async findReviewsByUser(userId: string, filters?: { projectId?: string; language?: string; limit?: number }) {
    if (isMongoConnected()) {
      const q: any = { userId };
      if (filters?.projectId) q.projectId = filters.projectId;
      if (filters?.language) q.language = filters.language;
      return ReviewModel.find(q).sort({ createdAt: -1 }).limit(filters?.limit || 50).exec();
    }
    let list = Array.from(memoryReviews.values()).filter(
      (r) => r.userId.toString() === userId.toString()
    );
    if (filters?.projectId) {
      list = list.filter((r) => r.projectId?.toString() === filters.projectId);
    }
    if (filters?.language) {
      list = list.filter((r) => r.language?.toLowerCase() === filters.language?.toLowerCase());
    }
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (filters?.limit) {
      list = list.slice(0, filters.limit);
    }
    return list;
  },

  async findReviewById(id: string, userId: string) {
    if (isMongoConnected()) {
      return ReviewModel.findOne({ _id: id, userId }).exec();
    }
    const review = memoryReviews.get(id);
    if (review && review.userId.toString() === userId.toString()) {
      return review;
    }
    return null;
  },

  async createReview(data: Partial<IReview>) {
    if (isMongoConnected()) {
      const created = await ReviewModel.create(data);
      if (data.projectId) {
        await ProjectModel.findByIdAndUpdate(data.projectId, {
          $inc: { totalReviews: 1 },
          $set: { latestScore: data.overallScore },
        });
      }
      return created;
    }
    const id = new Types.ObjectId().toString();
    const review = {
      _id: id,
      id,
      ...data,
      createdAt: new Date(),
    };
    memoryReviews.set(id, review);

    if (data.projectId) {
      const project = memoryProjects.get(data.projectId.toString());
      if (project) {
        project.totalReviews = (project.totalReviews || 0) + 1;
        project.latestScore = data.overallScore ?? 100;
        project.updatedAt = new Date();
      }
    }
    return review;
  },

  async deleteReview(id: string, userId: string) {
    if (isMongoConnected()) {
      return ReviewModel.findOneAndDelete({ _id: id, userId }).exec();
    }
    const review = memoryReviews.get(id);
    if (!review || review.userId.toString() !== userId.toString()) return null;
    memoryReviews.delete(id);
    return review;
  },

  // Audit Events
  async logAuditEvent(data: { userId?: string; action: string; ipAddress?: string; userAgent?: string; details?: Record<string, unknown> }) {
    if (isMongoConnected()) {
      return AuditEventModel.create({
        ...data,
        timestamp: new Date(),
      });
    }
    memoryAuditEvents.push({
      ...data,
      timestamp: new Date(),
    });
  },

  // Dashboard Aggregates
  async getDashboardStats(userId: string) {
    const reviews = await this.findReviewsByUser(userId);
    const projects = await this.findProjectsByUser(userId);

    let criticalCount = 0;
    let highCount = 0;
    let mediumCount = 0;
    let lowCount = 0;
    let totalScore = 0;
    const languageCounts: Record<string, number> = {};

    for (const r of reviews) {
      criticalCount += r.stats?.criticalCount || 0;
      highCount += r.stats?.highCount || 0;
      mediumCount += r.stats?.mediumCount || 0;
      lowCount += r.stats?.lowCount || 0;
      totalScore += r.overallScore || 0;

      const lang = r.language || 'other';
      languageCounts[lang] = (languageCounts[lang] || 0) + 1;
    }

    const averageQualityScore = reviews.length > 0 ? Math.round(totalScore / reviews.length) : 100;

    return {
      totalReviews: reviews.length,
      totalProjects: projects.length,
      criticalVulnerabilities: criticalCount,
      highSeverityIssues: highCount,
      mediumSeverityIssues: mediumCount,
      lowSeverityIssues: lowCount,
      averageQualityScore,
      languages: languageCounts,
      recentReviews: reviews.slice(0, 5),
    };
  },
};
