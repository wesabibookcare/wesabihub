
import { useState, useEffect } from 'react';
import { Parcel } from '../types';

/**
 * Hook for managing parcel data.
 * Ready for integration with Firebase listeners.
 */
export const useParcels = (userId?: string) => {
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // This will be replaced with a real Firestore query
    const fetchParcels = async () => {
      try {
        setLoading(true);
        // const data = await ParcelService.getParcelsByUser(userId);
        // setParcels(data);
      } catch (err) {
        setError('Failed to load parcels');
      } finally {
        setLoading(false);
      }
    };

    fetchParcels();
  }, [userId]);

  return { parcels, loading, error };
};
