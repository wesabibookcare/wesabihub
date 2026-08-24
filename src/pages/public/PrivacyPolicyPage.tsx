import React, { useState, useEffect } from 'react';
import { PublicLayout } from '@/src/layouts/PublicLayout';
import { Card } from '@/src/components/ui/Card';
import { configurationEngine } from '@/src/engines';

export const PrivacyPolicyPage = () => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  const defaultText = `1. Introduction
OmorfiHub ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform, mobile application, and services.

2. Information We Collect
We collect information that you provide directly to us, including:
- Name and contact information (email, phone number)
- Payment information and transaction history
- Parcel details (weight, dimensions, destination)
- Identification documents for verification (for Hub Partners)
- Location data for finding nearby hubs

3. How We Use Your Information
We use the information we collect to provide, maintain, and improve our services, to process transactions, to verify identities, to send technical notices and support messages, and to communicate with you about products, services, and events.

4. Data Sharing and Disclosure
We may share your information with Hub Partners and Logistics Partners to facilitate the delivery of parcels. We do not sell your personal information to third parties. We may disclose information if required by law or to protect our rights.

5. Security
We implement a variety of security measures to maintain the safety of your personal information. However, no method of transmission over the Internet or electronic storage is 100% secure.

6. Contact Us
If you have any questions about this Privacy Policy, please contact us at privacy@omorfihub.com.`;

  useEffect(() => {
    const loadContent = async () => {
      try {
        setLoading(true);
        const data = await configurationEngine.getPageContent('privacy-policy');
        if (data && data.content) {
          setContent(data.content);
        } else {
          setContent(defaultText);
          await configurationEngine.updatePageContent('privacy-policy', {
            title: 'Privacy Policy',
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
            Privacy Policy
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
