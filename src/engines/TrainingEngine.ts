import { courseRepository } from '../services/db/CourseRepository';
import { Course } from '../types';
import { auditEngine } from './AuditEngine';

class TrainingEngine {
  private static instance: TrainingEngine;

  private constructor() {}

  public static getInstance(): TrainingEngine {
    if (!TrainingEngine.instance) {
      TrainingEngine.instance = new TrainingEngine();
    }
    return TrainingEngine.instance;
  }

  async getAllCourses(): Promise<Course[]> {
    return courseRepository.getAll();
  }

  async saveCourse(course: Partial<Course>, adminId: string): Promise<void> {
    if (course.id) {
      await courseRepository.update(course.id, course as Course);
      await auditEngine.logEvent({ userId: adminId, action: 'UPDATE_COURSE' as any, details: { courseId: course.id }, result: 'SUCCESS' });
    } else {
      const newId = `${course.title?.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`;
      await courseRepository.create(newId, course as Course);
      await auditEngine.logEvent({ userId: adminId, action: 'CREATE_COURSE' as any, details: { courseId: newId }, result: 'SUCCESS' });
    }
  }

  async deleteCourse(id: string, adminId: string): Promise<void> {
    await courseRepository.delete(id);
    await auditEngine.logEvent({ userId: adminId, action: 'DELETE_COURSE' as any, details: { courseId: id }, result: 'SUCCESS' });
  }
}

export const trainingEngine = TrainingEngine.getInstance();
