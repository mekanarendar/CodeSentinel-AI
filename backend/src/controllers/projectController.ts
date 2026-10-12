import { Request, Response } from 'express';
import { z } from 'zod';
import { DataStore } from '../models/dataStore.ts';
import { sendSuccess, sendError } from '../utils/apiResponse.ts';
import { logger } from '../utils/logger.ts';

export const createProjectSchema = z.object({
  name: z.string().min(2, 'Project name must be at least 2 characters').max(120),
  description: z.string().max(500).optional(),
  repositoryUrl: z.string().url().optional().or(z.literal('')),
  primaryLanguage: z.string().default('typescript'),
  tags: z.array(z.string()).optional().default([]),
});

export const ProjectController = {
  async listProjects(req: Request, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 401);

      const projects = await DataStore.findProjectsByUser(req.user.id);
      return sendSuccess(res, projects);
    } catch (error) {
      logger.error('Error fetching projects', error);
      return sendError(res, 'Failed to fetch projects', 500);
    }
  },

  async createProject(req: Request, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 401);

      const { name, description, repositoryUrl, primaryLanguage, tags } = req.body;

      const project = await DataStore.createProject({
        userId: req.user.id as any,
        name,
        description,
        repositoryUrl,
        primaryLanguage,
        tags,
      });

      logger.info('Project created', { projectId: project._id || project.id, userId: req.user.id });
      return sendSuccess(res, project, 'Project created successfully', 201);
    } catch (error) {
      logger.error('Project creation failed', error);
      return sendError(res, 'Failed to create project', 500);
    }
  },

  async getProject(req: Request, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 401);

      const { id } = req.params;
      const project = await DataStore.findProjectById(id, req.user.id);
      if (!project) {
        return sendError(res, 'Project not found or access denied', 404);
      }

      // Fetch reviews attached to this project
      const reviews = await DataStore.findReviewsByUser(req.user.id, { projectId: id });

      return sendSuccess(res, {
        project,
        reviews,
      });
    } catch (error) {
      return sendError(res, 'Failed to fetch project details', 500);
    }
  },

  async updateProject(req: Request, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 401);

      const { id } = req.params;
      const { name, description, repositoryUrl, primaryLanguage, tags } = req.body;

      const updated = await DataStore.updateProject(id, req.user.id, {
        name,
        description,
        repositoryUrl,
        primaryLanguage,
        tags,
      });

      if (!updated) {
        return sendError(res, 'Project not found or access denied', 404);
      }

      return sendSuccess(res, updated, 'Project updated successfully');
    } catch (error) {
      return sendError(res, 'Failed to update project', 500);
    }
  },

  async deleteProject(req: Request, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 401);

      const { id } = req.params;
      const deleted = await DataStore.deleteProject(id, req.user.id);

      if (!deleted) {
        return sendError(res, 'Project not found or access denied', 404);
      }

      logger.info('Project and associated reviews deleted', { projectId: id, userId: req.user.id });
      return sendSuccess(res, { deleted: true }, 'Project deleted successfully');
    } catch (error) {
      return sendError(res, 'Failed to delete project', 500);
    }
  },
};
