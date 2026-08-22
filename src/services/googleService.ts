import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { toast } from 'sonner';

// In-memory access token cache
let googleAccessToken: string | null = null;

export const getGoogleAccessToken = (): string | null => {
  return googleAccessToken;
};

export const setGoogleAccessToken = (token: string | null) => {
  googleAccessToken = token;
};

/**
 * Initiates Google OAuth popup with Calendar and Contacts scopes
 */
export const connectGoogleServices = async (): Promise<string | null> => {
  try {
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/calendar');
    provider.addScope('https://www.googleapis.com/auth/calendar.events');
    provider.addScope('https://www.googleapis.com/auth/contacts.readonly');

    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);

    if (credential?.accessToken) {
      googleAccessToken = credential.accessToken;
      toast.success('Google Calendar & Contacts connected successfully!');
      return googleAccessToken;
    } else {
      toast.error('Failed to retrieve access token from Google sign in');
      return null;
    }
  } catch (error: any) {
    console.error('Google authorization error:', error);
    toast.error(error.message || 'Failed to connect Google account');
    return null;
  }
};

/**
 * Google Calendar Integration
 */
export interface CalendarEventPayload {
  summary: string;
  description: string;
  startTime: string; // ISO String
  endTime: string;   // ISO String
  location?: string;
}

export const createGoogleCalendarEvent = async (event: CalendarEventPayload, token?: string) => {
  const activeToken = token || googleAccessToken;
  if (!activeToken) {
    throw new Error('Google account not connected. Please connect your Google account first.');
  }

  const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${activeToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      summary: event.summary,
      description: event.description,
      location: event.location || 'WeSabiHub Center / Address',
      start: {
        dateTime: event.startTime,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: event.endTime,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 60 },
          { method: 'email', minutes: 24 * 60 },
        ],
      },
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData?.error?.message || 'Failed to create Google Calendar event');
  }

  return await response.json();
};

export const listUpcomingCalendarEvents = async (token?: string) => {
  const activeToken = token || googleAccessToken;
  if (!activeToken) return [];

  const now = new Date().toISOString();
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(now)}&orderBy=startTime&singleEvents=true&maxResults=10`,
    {
      headers: {
        Authorization: `Bearer ${activeToken}`,
      },
    }
  );

  if (!response.ok) return [];
  const data = await response.json();
  return data.items || [];
};

/**
 * Google Contacts Integration
 */
export interface GoogleContact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  photoUrl?: string;
}

export const fetchGoogleContacts = async (token?: string): Promise<GoogleContact[]> => {
  const activeToken = token || googleAccessToken;
  if (!activeToken) {
    throw new Error('Google account not connected. Please connect your Google account first.');
  }

  const response = await fetch(
    'https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,phoneNumbers,addresses,photos&pageSize=100',
    {
      headers: {
        Authorization: `Bearer ${activeToken}`,
      },
    }
  );

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err?.error?.message || 'Failed to fetch Google Contacts');
  }

  const data = await response.json();
  const connections = data.connections || [];

  return connections.map((person: any) => {
    const nameObj = person.names?.[0];
    const emailObj = person.emailAddresses?.[0];
    const phoneObj = person.phoneNumbers?.[0];
    const addressObj = person.addresses?.[0];
    const photoObj = person.photos?.[0];

    return {
      id: person.resourceName || Math.random().toString(),
      name: nameObj?.displayName || 'No Name',
      email: emailObj?.value || '',
      phone: phoneObj?.value || '',
      address: addressObj?.formattedValue || '',
      photoUrl: photoObj?.url || '',
    };
  });
};
