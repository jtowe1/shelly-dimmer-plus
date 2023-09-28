import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';

import mDNS from 'multicast-dns';

import { PLATFORM_NAME, PLUGIN_NAME } from './settings';
import { ShellyDimmerPlusAccessory } from './ShellyDimmerPlusAccessory';
import axios from 'axios';
import { IShellyDimmerPlus, MODEL, SERVICE_NAME } from './types';

export class ShellyDimmerPlusPlatform implements DynamicPlatformPlugin {
    public readonly Service: typeof Service = this.api.hap.Service;
    public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;
    protected mdns: mDNS.MulticastDNS | null = null;

    // this is used to track restored cached accessories
    public readonly accessories: PlatformAccessory[] = [];

    constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API,
    ) {
        this.log.debug('Finished initializing platform:', this.config.name);

        this.mdns = mDNS({
            interface: undefined,
        });

        // When this event is fired it means Homebridge has restored all cached accessories from disk.
        // Dynamic Platform plugins should only register new accessories after this event was fired,
        // in order to ensure they weren't added to homebridge already. This event can also be used
        // to start discovery of new accessories.
        this.api.on('didFinishLaunching', () => {
            log.debug('Executed didFinishLaunching callback');
            // run the method to discover / register your devices as accessories
            this.discoverDevices();
        });
    }

    /**
   * This function is invoked when homebridge restores cached accessories from disk at startup.
   * It should be used to setup event handlers for characteristics and update respective values.
   */
    configureAccessory(accessory: PlatformAccessory) {
        this.log.info('Loading accessory from cache:', accessory.displayName);

        // add the restored accessory to the accessories cache so we can track if it has already been registered
        this.accessories.push(accessory);
    }

    discoverDevices() {
        let deviceId: string | null = null;
        let ipAddress: string | null = null;

        this.log.info('setting up mDNS');
        this.mdns!.on('response', (response) => {
            for (const answer of response.answers) {
                if (answer.type === 'PTR' && answer.name === SERVICE_NAME && answer.data) {
                    this.log.debug('Found a shelly device', response);
                    deviceId = answer.data.split('.', 1)[0];
                }
            }

            for (const additionals of response.additionals) {
                if (additionals.type === 'A') {
                    ipAddress = additionals.data;
                }
            }

            if (deviceId && ipAddress) {
                this.log.info('Getting Shelly device info');
                const url = `http://${ipAddress}/rpc/Shelly.GetDeviceInfo`;
                axios.get(url)
                    .then((deviceResponse) => {
                        if (deviceResponse.data.model === MODEL) {
                            this.log.info('Device has info: ', deviceResponse.data);
                            this.log.info('Found a dimmer plus, stopping mDNS');
                            const device = {
                                name: deviceResponse.data.name,
                                id: deviceResponse.data.id,
                                ipAddress,
                            } as IShellyDimmerPlus;

                            this.mdns!.destroy();

                            const uuid = this.api.hap.uuid.generate(device.id);
                            const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);

                            if (existingAccessory) {
                                this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);
                                new ShellyDimmerPlusAccessory(this, existingAccessory, device);
                            } else {
                                this.log.info('Adding new accessory:', device.name);
                                const accessory = new this.api.platformAccessory(device.name, uuid);
                                new ShellyDimmerPlusAccessory(this, accessory, device);
                                this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
                            }

                        } else {
                            this.log.info(`Device ${deviceResponse.data.model} is not a dimmer plus, ignoring`);
                        }
                    });
            }
        });

        this.log.info('querying mDNS');
        this.mdns!.query(SERVICE_NAME, 'PTR', (error: Error | null) => {
            if (error) {
                this.log.error('error while querying:', error);
            }
        });
    }
}
