import {
  ShellyPlus1,
  ShellyPlus1Ul,
  ShellyPlus1V3,
  ShellyPlus1Mini,
  ShellyPlus1MiniV3,
  ShellyPlugSGen3EU,
} from '@buddyshome/shellies-ds9';

import { DeviceDelegate } from './base';

/**
 * Handles Shelly Plus 1 and Gen3 devices - iiseppi history edition.
 */
export class ShellyPlus1Delegate extends DeviceDelegate {
  protected setup() {
    const d = this.device as ShellyPlus1;

    // 1. Peruskytkin (rele)
    this.addSwitch(d.switch0, { single: true });

    /**
     * IISIPPI: LÄMPÖTILAMITTARI NÄKYVIIN
     * Käytetään (this as any), jotta kääntäjä sallii metodin kutsun.
     */
    const temp100 = d.getComponent('temperature:100');
    if (temp100) {
      if (typeof (this as any).addTemperatureSensor === 'function') {
        (this as any).addTemperatureSensor(temp100);
      }
      this.log.debug('[iiseppi] Lämpötila-anturi (temperature:100) lisätty palveluksi');
    }

    /**
     * IISIPPI: FAKEGATO HISTORIA - Lämpötila
     */
    d.on('status:temperature:100', (status) => {
      if (status && typeof status.tC === 'number') {
        // Käytetään (this as any).accessory, jotta kääntäjä ei herjaa puuttuvasta ominaisuudesta
        const acc = (this as any).accessory;
        if (acc && typeof acc.updateTemperature === 'function') {
          acc.updateTemperature(status.tC);
        }
      }
    });

    /**
     * IISIPPI: FAKEGATO HISTORIA - Oven tila
     */
    d.on('status:input:0', (status) => {
      if (status && status.state !== undefined) {
        const acc = (this as any).accessory;
        if (acc && typeof acc.updateDoorStatus === 'function') {
          acc.updateDoorStatus(status.state);
        }
      }
    });
  }
}

DeviceDelegate.registerDelegate(
  ShellyPlus1Delegate,
  ShellyPlus1,
  ShellyPlus1Ul,
  ShellyPlus1V3,
  ShellyPlus1Mini,
  ShellyPlus1MiniV3,
  ShellyPlugSGen3EU,
);
