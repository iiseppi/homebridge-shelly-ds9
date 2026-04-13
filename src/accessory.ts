import { DeviceId } from '@buddyshome/shellies-ds9';
import { PlatformAccessory } from 'homebridge';

import { Ability } from './abilities';
import { DeviceLogger } from './utils/device-logger';
import { FakegatoHistoryService } from './utils/fakegato-history';
import { ShellyPlatform } from './platform';

export type AccessoryId = string;
export type AccessoryUuid = string;

/**
 * iiseppi's HomeKit Accessory with History Support
 */
export class Accessory {
  readonly uuid: AccessoryUuid;
  protected _platformAccessory: PlatformAccessory | null;

  get platformAccessory(): PlatformAccessory | null {
    return this._platformAccessory;
  }

  readonly abilities: Ability[];
  private fakegatoHistory: FakegatoHistoryService | null = null;
  private _active = true;

  get active(): boolean {
    return this._active;
  }

  set active(value) {
    if (value === this._active) return;
    this._active = value;
    this.update();
  }

  protected updateTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(
    readonly id: AccessoryId,
    readonly deviceId: DeviceId,
    readonly name: string,
    readonly platform: ShellyPlatform,
    readonly log: DeviceLogger,
    ...abilities: Ability[]) {
    this.uuid = platform.api.hap.uuid.generate(`${deviceId}-${id}`);
    this.abilities = abilities;

    this._platformAccessory = platform.getAccessory(this.uuid) || null;
    if (this._platformAccessory !== null) {
      log.debug(`[iiseppi] Accessory loaded from cache: ${name}`);
    }

    this.update();
  }

  setActive(value: boolean): this {
    this.active = value;
    return this;
  }

  /**
   * Yleinen metodi historian lisäämiseen
   */
  addHistoryEntry(entry: Record<string, number>) {
    if (this.fakegatoHistory) {
      if (!entry.time) {
        entry.time = Math.round(new Date().valueOf() / 1000);
      }
      this.fakegatoHistory.addEntry(entry);
    }
  }

  /**
   * IISIPPI: Päivittää lämpötilan (temperature:100) historiaan
   */
  updateTemperature(temp: number) {
    this.log.debug(`[iiseppi-history] Lämpötila päivitetty: ${temp}°C`);
    this.addHistoryEntry({ temp: temp });
  }

  /**
   * IISIPPI: Päivittää oven tilan (input:0) historiaan
   * status 1 = Auki, status 0 = Kiinni
   */
  updateDoorStatus(isOpen: boolean) {
    const status = isOpen ? 1 : 0;
    this.log.debug(`[iiseppi-history] Oven tila päivitetty: ${isOpen ? 'AUKI' : 'KIINNI'}`);
    this.addHistoryEntry({ status: status });
  }

  protected update() {
    if (this.updateTimeout !== null) clearTimeout(this.updateTimeout);
    this.updateTimeout = setTimeout(() => {
      this.updateTimeout = null;
      if (this.active) {
        this.activate();
      } else {
        this.deactivate();
      }
    }, 0);
  }

  protected activate() {
    if (this._platformAccessory === null) {
      this._platformAccessory = this.createPlatformAccessory();
      this.log.debug(`[iiseppi] Accessory activated: ${this.name}`);
    }

    // Alustetaan Fakegato (Eve historia)
    if (this.fakegatoHistory === null) {
      try {
        // Käytetään 'weather' tyyppiä, koska se tukee lämpötilaa ja statusta
        this.fakegatoHistory = new FakegatoHistoryService(
          this._platformAccessory,
          this.platform,
        );
        this.log.debug('[iiseppi] Eve-historia alustettu');
      } catch (e) {
        this.log.error('Fakegato hiba:', e instanceof Error ? e.message : e);
      }
    }

    for (const a of this.abilities) {
      try {
        // FIXED: Vain 3 argumenttia build-virheen välttämiseksi
        a.setup(this._platformAccessory, this.platform, this.log);
      } catch (e) {
        this.log.error('Ability setup failed:', e instanceof Error ? e.message : e);
      }
    }

    this.platform.addAccessory(this._platformAccessory);
  }

  protected deactivate() {
    for (const a of this.abilities) {
      try { a.destroy(); } catch (e) { }
    }
    this.fakegatoHistory = null;
    if (this._platformAccessory !== null) {
      this.platform.removeAccessory(this._platformAccessory);
      this._platformAccessory = null;
    }
  }

  protected createPlatformAccessory(): PlatformAccessory {
    const pa = new this.platform.api.platformAccessory(this.name, this.uuid);
    pa.context.device = { id: this.deviceId };
    return pa;
  }

  detach() {
    if (this.updateTimeout !== null) {
      clearTimeout(this.updateTimeout);
      this.updateTimeout = null;
    }
    for (const a of this.abilities) {
      try { a.detach(); } catch (e) { }
    }
  }
}
