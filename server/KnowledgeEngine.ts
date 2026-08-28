import { getFirestore } from 'firebase-admin/firestore';

export async function createKnowledgeReviewRequest(db: any, question: string, context: any) {
  if (!db) return;
  try {
    const requestId = `KRR-${Date.now()}`;
    await db.collection('knowledgeReviewRequests').doc(requestId).set({
        id: requestId,
        question,
        context,
        createdAt: new Date().toISOString(),
        status: 'PENDING',
        frequency: 1
    });
  } catch (err) {
    console.warn("[KNOWLEDGE ENGINE] Could not save review request:", err);
  }
}

export async function searchApprovedKnowledge(db: any, query: string) {
  if (!db) return [];
  try {
    const articlesSnap = await db.collection('knowledgeArticles').where('approved', '==', true).get();
    return articlesSnap.docs.filter((doc: any) => doc.data().content?.toLowerCase().includes(query.toLowerCase()));
  } catch (err) {
    console.warn("[KNOWLEDGE ENGINE] Search failed:", err);
    return [];
  }
}
