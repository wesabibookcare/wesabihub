import React, { useState, useEffect } from 'react';
import { announcementRepository } from '../../services/db/AnnouncementRepository';
import { Announcement } from '../../types';

export const AnnouncementBanner = () => {
    const [announcement, setAnnouncement] = useState<Announcement | null>(null);

    useEffect(() => {
        const fetch = async () => {
            try {
                const all = await announcementRepository.getAll();
                const active = all.find(a =>
                    !a.isDeleted &&
                    a.status === 'PUBLISHED' &&
                    new Date() >= new Date(a.startDate) &&
                    new Date() <= new Date(a.endDate)
                );
                if (active) setAnnouncement(active as Announcement);
            } catch (err) {
                console.warn("Failed to load announcement banner:", err);
            }
        };
        fetch();
    }, []);

    if (!announcement) return null;

    return (
        <div className="bg-blue-600 text-white py-2 px-4 text-center text-xs sm:text-sm font-bold shadow-sm flex items-center justify-center gap-2 sm:gap-3 relative min-h-[40px] w-full">
            <span>{announcement.title}</span>
            {announcement.body && <span className="font-medium opacity-90 text-xs sm:text-sm">- {announcement.body}</span>}
            {announcement.destinationUrl && (
                <a href={announcement.destinationUrl} className="underline ml-1 text-blue-100 hover:text-white text-xs font-bold whitespace-nowrap">
                    {announcement.buttonText || 'Learn More'}
                </a>
            )}
        </div>
    );
};
