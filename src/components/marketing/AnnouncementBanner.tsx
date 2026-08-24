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
        <div className="bg-blue-600 text-white py-0.5 px-2 text-center text-[10px] font-semibold shadow-sm flex items-center justify-center gap-1 z-50 relative min-h-[16px]">
            <span>{announcement.title}</span>
            {announcement.body && <span className="font-normal opacity-85 text-[9px]">- {announcement.body}</span>}
            {announcement.destinationUrl && (
                <a href={announcement.destinationUrl} className="underline ml-1 text-blue-100 hover:text-white text-[9px]">
                    {announcement.buttonText || 'Learn More'}
                </a>
            )}
        </div>
    );
};
