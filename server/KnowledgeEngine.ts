import { getFirestore } from 'firebase-admin/firestore';

export async function createKnowledgeReviewRequest(db: any, question: string, context: any) {
  const requestId = `KRR-${Date.now()}`;
  await db.collection('knowledgeReviewRequests').doc(requestId).set({
      id: requestId,
      question,
      context,
      createdAt: new Date().toISOString(),
      status: 'PENDING',
      frequency: 1
  });
}

export async function searchApprovedKnowledge(db: any, query: string) {
  // Simple search logic - for production, use Algolia/Elasticsearch
  const articlesSnap = await db.collection('knowledgeArticles').where('approved', '==', true).get();
  // Simplified matching
  return articlesSnap.docs.filter((doc: any) => doc.data().content.toLowerCase().includes(query.toLowerCase()));
}
