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

    // 1. Lisätään rele (kytkin) HomeKitiin
    this.addSwitch(d.switch0, { single: true });

    /**
     * IISIPPI: LÄMPÖTILAMITTARI NÄKYVIIN (UI)
     * Haetaan temperature:100 komponentti ja lisätään se HomeKit-palveluksi.
     * Tämä tekee laitteesta näkyvän mittarin Apple Home -sovellukseen.
     */
    const temp100 = d.getComponent('temperature:100');
    if (temp100) {
      this.addTemperatureSensor(temp100);
      this.log.debug('[iiseppi] Lämpötila-anturi (temperature:100) lisätty palveluksi');
    }

    /**
     * IISIPPI: FAKEGATO HISTORIA - Lämpötila
     * Kuunnellaan tilamuutoksia ja tallennetaan ne Eve-historiaan.
     */
    d.on('status:temperature:100', (status) => {
      if (status && typeof status.tC === 'number') {
        this.accessory.updateTemperature(status.tC);
      }
    });

    /**
     * IISIPPI: FAKEGATO HISTORIA - Oven tila (input:0)
     * Kuunnellaan magneettikytkintä ja tallennetaan auki/kiinni -tieto historiaan.
     */
    d.on('status:input:0', (status) => {
      if (status && status.state !== undefined) {
        // status.state: true = auki, false = kiinni
        this.accessory.updateDoorStatus(status.state);
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
