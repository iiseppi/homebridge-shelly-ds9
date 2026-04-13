import { PlatformAccessory } from 'homebridge';
import { ShellyPlatform } from '../platform';

/**
 * Manages historical data storage for HomeKit accessories using fakegato.
 */
export class FakegatoHistoryService {
  private fakegatoHistory: any;

  /**
   * @param platformAccessory - The platform accessory to store history for.
   * @param platform - A reference to the platform.
   */
  constructor(
    private platformAccessory: PlatformAccessory,
    private platform: ShellyPlatform,
  ) {
    try {
      // Import fakegato-history dynamically
      const FakeGatoHistory = require('fakegato-history');
      
      // Initialize fakegato-history service
      this.fakegatoHistory = new FakeGatoHistory(platform.api, platformAccessory, {
        storage: 'fs',
        path: platform.api.user.storagePath(),
        disableTimer: false,
      });
    } catch (e) {
      // If fakegato-history is not available, we'll just skip it
      this.fakegatoHistory = null;
    }
  }

  /**
   * Adds an entry to the history.
   * @param entry - The history entry object with timestamp and values.
   */
  addEntry(entry: Record<string, number>) {
    if (this.fakegatoHistory) {
      try {
        this.fakegatoHistory.addEntry(entry);
      } catch (e) {
        // Silently ignore errors in history recording
      }
    }
  }

  /**
   * Gets historical entries.
   * @param options - Optional query options.
   * @returns The history data or null.
   */
  getHistory(options?: Record<string, any>) {
    if (this.fakegatoHistory) {
      try {
        return this.fakegatoHistory.getHistory(options);
      } catch (e) {
        return null;
      }
    }
    return null;
  }
}