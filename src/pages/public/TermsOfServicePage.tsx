import React, { useState, useEffect } from 'react';
import { PublicLayout } from '@/src/layouts/PublicLayout';
import { Card } from '@/src/components/ui/Card';
import { configurationEngine } from '@/src/engines';

export const TermsOfServicePage = () => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  const defaultText = `1. Agreement to Terms
By accessing or using the OmorfiHub platform, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.

2. Service Description
OmorfiHub provides a Pick-Up & Drop-Off network service. We facilitate the movement of parcels between our Hub Partners using Logistics Partners. We are not a direct carrier but an orchestrator of logistics services.

3. User Obligations
When using our services, you agree:
- To provide accurate and complete information
- Not to ship prohibited items (illegal, hazardous, etc.)
- To ensure items are properly packaged
- To comply with all applicable laws and regulations

4. Hub and Logistics Partners
Hub Partners are independent businesses verified by OmorfiHub. Logistics Partners are independent fleet owners. While we verify these partners, OmorfiHub is not responsible for their individual conduct beyond our platform's operating procedures.

5. Liability and Insurance
OmorfiHub provides limited coverage for lost or damaged parcels as per our Compensation Policy. Users are encouraged to declare the true value of items. Our liability is limited to the extent permitted by Nigerian law.

6. Governing Law
These terms are governed by and construed in accordance with the laws of the Federal Republic of Nigeria.`;

  useEffect(() => {
    const loadContent = async () => {
      try {
        setLoading(true);
        const data = await configurationEngine.getPageContent('terms-of-service');
        if (data && data.content) {
          setContent(data.content);
        } else {
          setContent(defaultText);
          await configurationEngine.updatePageContent('terms-of-service', {
            title: 'Terms of Service',
            content: defaultText,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
      } catch (err) {
        console.error(err);
        setContent(defaultText);
      } finally {
        setLoading(false);
      }
    };
    loadContent();
  }, []);

  return (
    <PublicLayout>
      <section className="pt-32 pb-24 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white font-display tracking-tight mb-8">
            Terms of Service
          </h1>
          <p className="text-lg text-slate-900 dark:text-slate-300 mb-12">
            Last updated: July 7, 2026
          </p>

          <Card className="p-8 md:p-12 border-slate-200 dark:border-slate-800">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : (
              <div className="text-slate-800 dark:text-slate-300 leading-relaxed whitespace-pre-wrap font-medium space-y-6 text-sm">
                {content}
              </div>
            )}
          </Card>
        </div>
      </section>
    </PublicLayout>
  );
};
