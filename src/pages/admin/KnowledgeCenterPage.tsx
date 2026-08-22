import React, { useState, useEffect } from 'react';
import { contentEngine } from '../../engines/ContentEngine';
import { KnowledgeArticle } from '../../services/db/KnowledgeRepository';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { AdminLayout } from '../../layouts/AdminLayout';

export const KnowledgeCenterPage = () => {
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);

  useEffect(() => {
    contentEngine.getAllArticles().then(setArticles);
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Knowledge Center</h1>
        <Card className="p-6 border-slate-200 dark:border-slate-800">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Articles</h2>
            <Button className="rounded-xl">Add Article</Button>
          </div>
          <div className="space-y-4">
            {articles.map(article => (
              <div key={article.id} className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <h3 className="font-semibold text-slate-900 dark:text-white">{article.title}</h3>
                <p className="text-sm text-slate-900 mt-1">{article.category}</p>
              </div>
            ))}
            {articles.length === 0 && (
              <p className="text-slate-900 text-sm py-4">No articles found.</p>
            )}
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
};
