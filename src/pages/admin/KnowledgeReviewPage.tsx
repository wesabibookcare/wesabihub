import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { AdminLayout } from '../../layouts/AdminLayout';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../lib/apiClient';

export function KnowledgeReviewPage() {
    const { fbUser } = useAuth();
    const [requests, setRequests] = useState<any[]>([]);
    const [answer, setAnswer] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiFetch<any[]>(fbUser, '/api/admin/knowledge-review')
            .then(setRequests)
            .catch(err => toast.error(err.message || 'Failed to load knowledge review requests.'))
            .finally(() => setLoading(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fbUser]);

    const approve = async (req: any) => {
        try {
            await apiFetch(fbUser, '/api/admin/knowledge-approve', {
                method: 'POST',
                body: { requestId: req.id, answer, category: 'General', keywords: [] }
            });
            toast.success('Answer approved and published.');
            setRequests(prev => prev.filter(r => r.id !== req.id));
            setAnswer('');
        } catch (err: any) {
            toast.error(err.message || 'Failed to approve this request.');
        }
    };

    return (
        <AdminLayout>
            <div className="max-w-4xl mx-auto space-y-6">
                <h1 className="text-3xl font-bold dark:text-white font-display">Knowledge Review</h1>
                <p className="text-slate-900 text-sm">Review, approve and publish user submitted knowledge requests.</p>
                {loading ? (
                    <Card className="p-8 text-center text-slate-800 text-xs font-bold uppercase">
                        Loading...
                    </Card>
                ) : (
                    <>
                        {requests.map(req => (
                            <Card key={req.id} className="mb-4">
                                <CardHeader><CardTitle>Question: {req.question}</CardTitle></CardHeader>
                                <CardContent>
                                    <textarea className="w-full p-2 border rounded" value={answer} onChange={e => setAnswer(e.target.value)} placeholder="Enter answer..." />
                                    <Button onClick={() => approve(req)} className="mt-2">Approve & Publish</Button>
                                </CardContent>
                            </Card>
                        ))}
                        {requests.length === 0 && (
                            <Card className="p-8 text-center text-slate-800 text-xs font-bold uppercase">
                                No pending knowledge review requests.
                            </Card>
                        )}
                    </>
                )}
            </div>
        </AdminLayout>
    );
}
