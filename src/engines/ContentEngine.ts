import { faqRepository, FAQ } from '../services/db/FAQRepository';
import { knowledgeRepository, KnowledgeArticle } from '../services/db/KnowledgeRepository';
import { pageContentRepository, PageContent } from '../services/db/PageContentRepository';
import { auditEngine } from './AuditEngine';

class ContentEngine {
  private static instance: ContentEngine;

  private constructor() {}

  public static getInstance(): ContentEngine {
    if (!ContentEngine.instance) {
      ContentEngine.instance = new ContentEngine();
    }
    return ContentEngine.instance;
  }

  // FAQ
  async getAllFaqs(): Promise<FAQ[]> {
    return faqRepository.getAll();
  }

  async createFaq(faq: Partial<FAQ>, adminId: string): Promise<FAQ> {
    const id = `faq_${Date.now()}`;
    await faqRepository.create(id, faq as FAQ);
    await auditEngine.logEvent({ userId: adminId, action: 'CREATE_FAQ' as any, details: { id }, result: 'SUCCESS' });
    return { id, ...faq } as FAQ;
  }

  async deleteFaq(id: string, adminId: string): Promise<void> {
    await faqRepository.delete(id);
    await auditEngine.logEvent({ userId: adminId, action: 'DELETE_FAQ' as any, details: { id }, result: 'SUCCESS' });
  }

  // Knowledge Base
  async getAllArticles(): Promise<KnowledgeArticle[]> {
    return knowledgeRepository.getAll();
  }

  async getArticlesByCategory(category: string): Promise<KnowledgeArticle[]> {
    return knowledgeRepository.query([{ field: 'category', operator: '==', value: category }]);
  }

  async updateArticle(id: string, data: Partial<KnowledgeArticle>, adminId: string): Promise<void> {
    await knowledgeRepository.update(id, data);
    await auditEngine.logEvent({ userId: adminId, action: 'UPDATE_ARTICLE' as any, details: { id }, result: 'SUCCESS' });
  }

  // Page Content
  async getPageContent(pageId: string): Promise<any> {
    return pageContentRepository.getPageContent(pageId);
  }

  async updatePageContent(pageId: string, content: string, adminId: string): Promise<void> {
    await pageContentRepository.updatePageContent(pageId, { content });
    await auditEngine.logEvent({ userId: adminId, action: 'UPDATE_PAGE_CONTENT' as any, details: { pageId }, result: 'SUCCESS' });
  }
}

export const contentEngine = ContentEngine.getInstance();
