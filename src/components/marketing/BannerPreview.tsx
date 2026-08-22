import React, { useState, useRef } from 'react';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Download, Share2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

type Template = 'Modern Clean' | 'Promotional Bold' | 'Compact Minimal';

interface BannerPreviewProps {
  centerLogoUrl?: string;
  centerName: string;
  platformLogoUrl?: string;
  platformName: string;
}

export const BannerPreview: React.FC<BannerPreviewProps> = ({
  centerLogoUrl,
  centerName,
  platformLogoUrl,
  platformName,
}) => {
  const [template, setTemplate] = useState<Template>('Modern Clean');
  const bannerRef = useRef<HTMLDivElement>(null);

  const templates: Template[] = ['Modern Clean', 'Promotional Bold', 'Compact Minimal'];

  const handleDownload = async () => {
    if (!bannerRef.current) return;
    const canvas = await html2canvas(bannerRef.current);
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('landscape', 'px', [canvas.width, canvas.height]);
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save(`${centerName.replace(/\s+/g, '_')}_banner.pdf`);
  };

  const handleShare = async () => {
    if (!bannerRef.current) return;
    const canvas = await html2canvas(bannerRef.current);
    canvas.toBlob(async (blob) => {
        if (blob) {
            const file = new File([blob], 'banner.png', { type: 'image/png' });
            if (navigator.share && navigator.canShare({ files: [file] })) {
                try {
                    await navigator.share({
                        files: [file],
                        title: `${centerName} Banner`,
                        text: 'Check out our new store banner!',
                    });
                } catch (err) {
                    console.error('Error sharing:', err);
                }
            } else {
                // Fallback: download the image
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'banner.png';
                a.click();
                URL.revokeObjectURL(url);
            }
        }
    });
  };

  const renderBanner = () => {
    switch (template) {
      case 'Promotional Bold':
        return (
          <div ref={bannerRef} className="w-full h-48 bg-rose-600 rounded-lg p-6 flex items-center justify-between relative text-white border-4 border-white shadow-inner">
            <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-white rounded-lg flex items-center justify-center p-1">
                    {centerLogoUrl ? <img src={centerLogoUrl} alt={centerName} className="w-full h-full object-contain" /> : <span className="text-rose-600 font-black text-2xl">{centerName.charAt(0)}</span>}
                </div>
                <h4 className="text-3xl font-black font-display uppercase tracking-tighter">{centerName}</h4>
            </div>
            <div className="text-right">
                <p className="font-bold">PICKUP POINT</p>
                <p className="text-xs">{platformName}</p>
            </div>
          </div>
        );
      case 'Compact Minimal':
        return (
          <div ref={bannerRef} className="w-full h-32 bg-slate-100 rounded-lg p-4 flex items-center justify-between relative text-slate-900 border border-slate-300">
            <div className="flex items-center gap-3">
              {centerLogoUrl && <img src={centerLogoUrl} alt={centerName} className="w-10 h-10 object-contain rounded" />}
              <h4 className="text-lg font-bold">{centerName}</h4>
            </div>
            <span className="text-[10px] font-medium text-slate-500 uppercase">{platformName}</span>
          </div>
        );
      case 'Modern Clean':
      default:
        return (
          <div ref={bannerRef} className="w-full h-48 bg-gradient-to-r from-slate-900 to-slate-800 rounded-lg p-6 flex items-center justify-between relative text-white">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center p-1">
                {centerLogoUrl ? (
                    <img src={centerLogoUrl} alt={centerName} className="w-full h-full object-contain rounded-full" />
                ) : (
                    <span className="text-slate-900 font-black text-xl">{centerName.charAt(0)}</span>
                )}
              </div>
              <div>
                <h4 className="text-xl font-black font-display tracking-tight">{centerName}</h4>
                <p className="text-xs text-slate-300">Authorized Pickup Point</p>
              </div>
            </div>
            <div className="flex flex-col items-center gap-1">
              {platformLogoUrl && (
                <img src={platformLogoUrl} alt={platformName} className="w-12 h-12 object-contain bg-white rounded-full p-1" />
              )}
              <span className="text-[10px] font-bold uppercase tracking-widest">{platformName}</span>
            </div>
          </div>
        );
    }
  };

  return (
    <Card className="p-6 border-slate-200 dark:border-slate-800 bg-white shadow-lg overflow-hidden">
      <div className="text-center mb-6">
        <h3 className="text-lg font-black dark:text-white font-display">Banner Preview</h3>
        <div className="flex justify-center gap-2 mt-4">
            {templates.map((t) => (
                <Button
                    key={t}
                    variant={template === t ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTemplate(t)}
                    className="text-xs"
                >
                    {t}
                </Button>
            ))}
        </div>
      </div>

      {renderBanner()}

      <div className="mt-6 flex justify-center gap-4">
        <Button onClick={handleDownload} variant="outline" className="flex items-center gap-2">
            <Download size={16} />
            Download PDF
        </Button>
        <Button onClick={handleShare} className="flex items-center gap-2">
            <Share2 size={16} />
            Share Banner
        </Button>
      </div>
    </Card>
  );
};
