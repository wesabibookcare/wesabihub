import { toast } from "sonner";

import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../layouts/AdminLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { contentEngine } from '../../engines/ContentEngine';
import { FAQ } from '../../services/db/FAQRepository';
import { PageContent } from '../../services/db/PageContentRepository';
import { useAuth } from '../../context/AuthContext';

import { Trash2, HelpCircle, FileText, Save, Plus, AlertCircle } from 'lucide-react';
import { ConfirmationDialog } from '../../components/ui/ConfirmationDialog';

export const AdminContentCMSPage = () => {
  const { user } = useAuth();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [pageContents, setPageContents] = useState<Record<string, PageContent>>({});
  const [newFaq, setNewFaq] = useState({ question: '', answer: '' });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: '', title: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const allFaqs = await contentEngine.getAllFaqs();
    setFaqs(allFaqs);
    const pages = ['about', 'how-it-works', 'for-merchants', 'become-a-hub', 'omorfi-dispatch', 'become-a-dispatch-partner', 'privacy-policy', 'terms-of-service'];
    const contents: Record<string, PageContent> = {};
    for (const page of pages) {
      const content: any = await contentEngine.getPageContent(page);
      if (content) contents[page] = content;
    }
    setPageContents(contents);
  };

  const handleUpdateContent = async (pageId: string, content: string) => {
    await contentEngine.updatePageContent(pageId, content, user!.uid);
    toast.success('Saved successfully!');
    fetchData();
  };

  const handleAddFAQ = async () => {
      await contentEngine.createFaq(newFaq as any, user!.uid);
      setNewFaq({ question: '', answer: '' });
      fetchData();
  };

  const handleDeleteFAQ = async (id: string) => {
      try {
        await contentEngine.deleteFaq(id, user!.uid);
        fetchData();
        toast.success('FAQ deleted successfully');
      } catch (err) {
        console.error(err);
        toast.error('Failed to delete FAQ');
      }
  }

  return (
    <AdminLayout>
      <div className="space-y-8 max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="text-primary-600 font-bold uppercase tracking-widest text-[10px] mb-2">Content Control Hub</p>
            <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white font-display">Content Management (CMS)</h1>
            <p className="text-slate-900 font-medium mt-1">Easily customize public web pages and manage helpful FAQs. For example, edit the About Us text or add answers to customer delivery questions.</p>
          </div>
        </div>

        <Card className="p-8 border-slate-200 dark:border-slate-800 shadow-xl rounded-3xl space-y-8">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <FileText className="text-primary-600" size={24} />
              <h2 className="text-xl font-black dark:text-white font-display uppercase tracking-tight">Static Page Content</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {['about', 'how-it-works', 'for-merchants', 'become-a-hub', 'omorfi-dispatch', 'become-a-dispatch-partner', 'privacy-policy', 'terms-of-service'].map(pageId => (
                  <div key={pageId} className="space-y-3 p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl">
                      <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-800 capitalize">{pageId.replace(/-/g, ' ')}</label>
                      <textarea
                          className="w-full h-32 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-xl font-medium focus:ring-2 focus:ring-primary-500 transition-all outline-none"
                          value={pageContents[pageId]?.content || ''}
                          onChange={(e) => setPageContents({...pageContents, [pageId]: {...pageContents[pageId], content: e.target.value}})}
                      />
                      <Button
                        onClick={() => handleUpdateContent(pageId, pageContents[pageId]?.content || '')}
                        className="w-full rounded-xl font-bold italic"
                        size="sm"
                      >
                        <Save size={14} className="mr-2" /> Save {pageId.replace(/-/g, ' ')}
                      </Button>
                  </div>
              ))}
            </div>
        </Card>

        <Card className="p-8 border-slate-200 dark:border-slate-800 shadow-xl rounded-3xl space-y-8">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <HelpCircle className="text-primary-600" size={24} />
              <h2 className="text-xl font-black dark:text-white font-display uppercase tracking-tight">Global FAQ Management</h2>
            </div>

            <div className="mb-8 p-6 bg-primary-50/50 dark:bg-primary-900/10 border border-primary-100 dark:border-primary-900/30 rounded-2xl space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-primary-700 dark:text-primary-400 flex items-center gap-2">
                  <Plus size={14} /> Add New Knowledge Point
                </h3>
                <div className="space-y-3">
                  <input
                    className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Knowledge Question..."
                    value={newFaq.question}
                    onChange={e => setNewFaq({...newFaq, question: e.target.value})}
                  />
                  <textarea
                    className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Knowledge Answer / Detailed Explanation..."
                    rows={3}
                    value={newFaq.answer}
                    onChange={e => setNewFaq({...newFaq, answer: e.target.value})}
                  />
                  <Button onClick={handleAddFAQ} className="w-full h-11 rounded-xl font-black uppercase tracking-widest text-[10px]">
                    Publish to Knowledge Base
                  </Button>
                </div>
            </div>

            <div className="space-y-4">
              {faqs.map(faq => (
                  <div key={faq.id} className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex justify-between items-start gap-4 hover:border-primary-500/30 transition-all group">
                      <div className="space-y-1">
                          <p className="text-sm font-black text-slate-900 dark:text-white tracking-tight">{faq.question}</p>
                          <p className="text-xs text-slate-900 dark:text-slate-300 font-medium leading-relaxed">{faq.answer}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteModal({ isOpen: true, id: faq.id, title: faq.question })}
                        className="p-2 h-8 w-8 rounded-lg text-red-500 hover:bg-red-50 hover:border-red-200 shrink-0"
                      >
                        <Trash2 size={14} />
                      </Button>
                  </div>
              ))}
            </div>
        </Card>
      </div>

      <ConfirmationDialog
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={() => handleDeleteFAQ(deleteModal.id)}
        title="Delete Knowledge Point?"
        description={`Are you sure you want to remove "${deleteModal.title}" from the global FAQ? This will be immediately reflected across all help centers.`}
        confirmText="Yes, Delete Permanently"
        variant="danger"
      />
    </AdminLayout>
  );
};
