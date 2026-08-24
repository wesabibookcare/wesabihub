import { parcelEngine } from './ParcelEngine';

/**
 * OmorfiHub Inventory Engine
 * Authoritative engine for shelf allocation and storage inventory management.
 */
class InventoryEngine {
  private static instance: InventoryEngine;
  private assignedShelves: Map<string, number> = new Map();

  private constructor() {}

  public static getInstance(): InventoryEngine {
    if (!InventoryEngine.instance) {
      InventoryEngine.instance = new InventoryEngine();
    }
    return InventoryEngine.instance;
  }

  /**
   * Assigns an available shelf or storage location at a designated Hub Point.
   * Respects capacity and distributes parcels systematically across storage zones.
   */
  async assignShelf(parcelId: string, hubId: string, category: string = 'STANDARD'): Promise<string> {
    const currentCount = (this.assignedShelves.get(hubId) || 0) + 1;
    this.assignedShelves.set(hubId, currentCount);

    // Systematic shelf zone assignment (Zone A to E, Shelves 01-20)
    let shelf: string;
    if (category === 'EXPRESS' || category === 'HIGH_PRIORITY') {
      const shelfNum = ((currentCount - 1) % 10) + 1;
      shelf = `Zone EXP - Shelf ${shelfNum.toString().padStart(2, '0')}`;
    } else if (category === 'OVERSIZE' || currentCount > 100) {
      const rackNum = ((currentCount - 1) % 5) + 1;
      shelf = `Overflow Storage - Rack ${rackNum}`;
    } else {
      const zoneLetter = String.fromCharCode(65 + (Math.floor((currentCount - 1) / 20) % 5)); // A, B, C, D, E
      const shelfNum = ((currentCount - 1) % 20) + 1;
      shelf = `Zone ${zoneLetter} - Shelf ${shelfNum.toString().padStart(2, '0')}`;
    }

    // Persist physical storage location to authoritative parcel record
    await parcelEngine.updateParcel(parcelId, { shelfLocation: shelf });
    return shelf;
  }
}

export const inventoryEngine = InventoryEngine.getInstance();
