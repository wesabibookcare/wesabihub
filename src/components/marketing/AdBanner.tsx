import React, { useState, useEffect } from 'react';
import { advertisementRepository } from '../../services/db/AdvertisementRepository';
import { Advertisement } from '../../types';

export const AdBanner = () => {
    const [ad, setAd] = useState<Advertisement | null>(null);

    useEffect(() => {
        const fetch = async () => {
            const all = await advertisementRepository.getAll();
            const active = all.find(a =>
                !a.isDeleted &&
                a.status === 'PUBLISHED' &&
                new Date() >= new Date(a.startDate) &&
                new Date() <= new Date(a.endDate)
            );
            if (active) setAd(active as Advertisement);
        };
        fetch();
    }, []);

    if (!ad) return null;

    return (
        <div className="bg-slate-900 text-white py-0.5 px-3 text-center border-t border-primary-500 relative z-50 shadow-md min-h-[22px] flex items-center">
            <div className="w-full max-w-4xl mx-auto flex items-center justify-between gap-2 text-left">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    {ad.imageUrl && (
                        <img src={ad.imageUrl} className="max-h-4 rounded shadow-sm object-cover flex-shrink-0" alt="ad" />
                    )}
                    <div className="min-w-0 flex items-center gap-2">
                        <h3 className="font-bold text-[10px] text-primary-400 truncate">{ad.headline}</h3>
                        {ad.description && <p className="text-[9px] text-slate-300 truncate hidden md:inline">{ad.description}</p>}
                    </div>
                </div>
                {ad.destinationUrl && (
                    <a
                        href={ad.destinationUrl}
                        className="bg-primary-500 hover:bg-primary-600 text-white px-2 py-0.5 rounded text-[9px] font-bold whitespace-nowrap transition-colors"
                    >
                        View Offer
                    </a>
                )}
            </div>
        </div>
    );
};
