import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';

import axios from 'axios';

import { ShellyDimmerPlusPlatform } from './platform';

export const SERVICE_NAME = '_shelly._tcp.local';
export const MODEL = 'SNDM-0013US';
export const MANUFACTURER = 'Shelly';

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class ShellyDimmerPlusAccessory {
    private service: Service;

    constructor(
    private readonly platform: ShellyDimmerPlusPlatform,
    private readonly accessory: PlatformAccessory,
    ) {

    // set accessory information
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
        .setCharacteristic(this.platform.Characteristic.Manufacturer, MANUFACTURER)
        .setCharacteristic(this.platform.Characteristic.Model, MODEL);

    // get the LightBulb service if it exists, otherwise create a new LightBulb service
    // you can create multiple services for each accessory
    this.service = this.accessory.getService(this.platform.Service.Lightbulb) || this.accessory.addService(this.platform.Service.Lightbulb);

    // set the service name, this is what is displayed as the default name on the Home app
    // in this example we are using the name we stored in the `accessory.context` in the `discoverDevices` method.
    this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.name);

    // each service must implement at-minimum the "required characteristics" for the given service type
    // see https://developers.homebridge.io/#/service/Lightbulb

    // register handlers for the On/Off Characteristic
    this.service.getCharacteristic(this.platform.Characteristic.On)
        .onSet(this.setOn.bind(this))                // SET - bind to the `setOn` method below
        .onGet(this.getOn.bind(this));               // GET - bind to the `getOn` method below

    // register handlers for the Brightness Characteristic
    this.service.getCharacteristic(this.platform.Characteristic.Brightness)
        .onSet(this.setBrightness.bind(this))    // SET - bind to the 'setBrightness` method below
        .onGet(this.getBrightness.bind(this));   // GET - bind to the 'getBrightness` method below
    }

    async setOn(value: CharacteristicValue) {
        const url = `http://10.0.0.151/rpc/Light.Set?id=0&on=${value as boolean}`;
        try {
            const response = await axios.get(url);
            this.platform.log.debug('response: ', response.data);
        } catch (error) {
            this.platform.log.debug('error: ', error);
            throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
        }

        this.platform.log.debug('Set Characteristic On ->', value);
    }


    async getOn(): Promise<CharacteristicValue> {
        let isOn;

        const url = 'http://10.0.0.151/rpc/Light.GetStatus?id=0';

        try {
            const response = await axios.get(url);
            this.platform.log.debug('response: ', response.data);
            isOn = response.data.output;
        } catch (error) {
            this.platform.log.debug('error: ', error);
            throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
        }

        this.platform.log.debug('Get Characteristic On ->', isOn);

        return isOn;
    }

    async setBrightness(value: CharacteristicValue) {
        const url = `http://10.0.0.151/rpc/Light.Set?id=0&brightness=${value as number}`;
        try {
            const response = await axios.get(url);
            this.platform.log.debug('response: ', response.data);
        } catch (error) {
            this.platform.log.debug('error: ', error);
            throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
        }

        this.platform.log.debug('Set Characteristic Brightness -> ', value);
    }

    async getBrightness(): Promise<CharacteristicValue> {
        let brightness;

        const url = 'http://10.0.0.151/rpc/Light.GetStatus?id=0';

        try {
            const response = await axios.get(url);
            this.platform.log.debug('response: ', response.data);
            brightness = response.data.brightness;
        } catch (error) {
            this.platform.log.debug('error: ', error);
            throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
        }

        this.platform.log.debug('Get Characteristic On ->', brightness);

        return brightness;
    }

}
