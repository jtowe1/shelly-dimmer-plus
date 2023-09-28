import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';

import axios from 'axios';

import { ShellyDimmerPlusPlatform } from './platform';
import { IShellyDimmerPlus, MANUFACTURER, MODEL } from './types';

export class ShellyDimmerPlusAccessory {
    private service: Service;

    constructor(
    private readonly platform: ShellyDimmerPlusPlatform,
    private readonly accessory: PlatformAccessory,
    private readonly device: IShellyDimmerPlus,
    ) {
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
        .setCharacteristic(this.platform.Characteristic.Manufacturer, MANUFACTURER)
        .setCharacteristic(this.platform.Characteristic.Model, MODEL);

    this.service = this.accessory.getService(this.platform.Service.Lightbulb) || this.accessory.addService(this.platform.Service.Lightbulb);

    this.service.setCharacteristic(this.platform.Characteristic.Name, this.device.name);

    this.service.getCharacteristic(this.platform.Characteristic.On)
        .onSet(this.setOn.bind(this))
        .onGet(this.getOn.bind(this));

    this.service.getCharacteristic(this.platform.Characteristic.Brightness)
        .onSet(this.setBrightness.bind(this))
        .onGet(this.getBrightness.bind(this));
    }

    async setOn(value: CharacteristicValue) {
        const url = `http://${this.device.ipAddress}/rpc/Light.Set?id=0&on=${value as boolean}`;
        this.platform.log.debug('setOn url: ', url);
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

        const url = `http://${this.device.ipAddress}/rpc/Light.GetStatus?id=0`;
        this.platform.log.debug('getOn url: ', url);

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
        const url = `http://${this.device.ipAddress}/rpc/Light.Set?id=0&brightness=${value as number}`;
        this.platform.log.debug('setBrightness url: ', url);
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

        const url = `http://${this.device.ipAddress}/rpc/Light.GetStatus?id=0`;
        this.platform.log.debug('getBrightness url: ', url);

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
