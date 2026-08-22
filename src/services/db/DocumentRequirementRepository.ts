import { FirestoreDataConverter, QueryDocumentSnapshot } from 'firebase/firestore';
import { DocumentRequirement } from '../../types';
import { BaseRepository } from './BaseRepository';

const documentRequirementConverter: FirestoreDataConverter<DocumentRequirement> = {
  toFirestore: (requirement: DocumentRequirement) => {
    return { ...requirement };
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot) => {
    const data = snapshot.data();
    return {
      ...data,
      id: snapshot.id
    } as DocumentRequirement;
  }
};

class DocumentRequirementRepository extends BaseRepository<DocumentRequirement> {
  constructor() {
    super('documentRequirements', documentRequirementConverter);
  }

  async getActiveForRoleAndCountry(role: string, country: string): Promise<DocumentRequirement[]> {
    const all = await this.getAll();
    return all
      .filter(req => req.isActive && !req.isDeleted)
      .filter(req => req.applicableRoles.includes(role as any))
      .filter(req =>
        req.applicableCountries.includes('ALL') ||
        req.applicableCountries.includes(country) ||
        req.applicableCountries.includes(country.toUpperCase()) ||
        req.applicableCountries.includes(country.toLowerCase())
      )
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  }
}

export const documentRequirementRepository = new DocumentRequirementRepository();
