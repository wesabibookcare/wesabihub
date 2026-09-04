import React, { useState, useEffect } from 'react';
import { advertisementRepository } from '../../services/db/AdvertisementRepository';
import { Advertisement } from '../../types';

export const AdBanner = () => {
    const [ad, setAd] = useState<Advertisement | null>(null);

    useEffect(() => {
        const fetch = async () => {
            try {
                const all = await advertisementRepository.getAll();
                const active = all.find(a =>
                    !a.isDeleted &&
                    a.status === 'PUBLISHED' &&
                    new Date() >= new Date(a.startDate) &&
                    new Date() <= new Date(a.endDate)
                );
                if (active) setAd(active as Advertisement);
            } catch (err) {
                console.warn("Failed to load ad banner:", err);
            }
        };
        fetch();
    }, []);

    if (!ad) return null;

    return (
        <div className="bg-slate-900 text-white py-2 px-4 text-center border-t border-primary-500 relative shadow-md min-h-[44px] flex items-center w-full">
            <div className="w-full max-w-5xl mx-auto flex items-center justify-between gap-3 text-left">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    {ad.imageUrl && (
                        <img src={ad.imageUrl} className="max-h-8 rounded shadow-sm object-cover flex-shrink-0" alt="ad" />
                    )}
                    <div className="min-w-0 flex items-center gap-2">
                        <h3 className="font-bold text-xs sm:text-sm text-primary-400 truncate">{ad.headline}</h3>
                        {ad.description && <p className="text-xs text-slate-300 truncate hidden md:inline">{ad.description}</p>}
                    </div>
                </div>
                {ad.destinationUrl && (
                    <a
                        href={ad.destinationUrl}
                        className="bg-primary-500 hover:bg-primary-600 text-white px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-colors shrink-0"
                    >
                        View Offer
                    </a>
                )}
            </div>
        </div>
    );
};
