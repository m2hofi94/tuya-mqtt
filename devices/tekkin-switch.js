const TuyaDevice = require('./tuya-device')
const debug = require('debug')('tuya-mqtt:device')
const debugDiscovery = require('debug')('tuya-mqtt:discovery')
const utils = require('../lib/utils')

class TekkinSwitch extends TuyaDevice {
  async init() {
    this.config.dpsPower = 1;
    this.deviceData.mf = "Tekkin"
    this.deviceData.mdl = 'SP20';

    // Configure Home Assistant Discovery
    this.ha_discovery = [
      {
        domain: 'switch',
        suffix: '',
        data: {
          state_topic: '~/state',
          command_topic: '~/command',
          availability_topic: '~/status',
        },
      },
      {
        domain: 'sensor',
        suffix: 'Voltage',
        data: {
          device_class: 'voltage',
          unit_of_measurement: 'V',
          state_topic: '~/voltage',
        },
      },
      {
        domain: 'sensor',
        suffix: 'Current',
        data: {
          device_class: 'current',
          unit_of_measurement: 'mA',
          state_topic: '~/current',
        },
      },
      {
        domain: 'sensor',
        suffix: 'Power',
        data: {
          device_class: 'power',
          unit_of_measurement: 'W',
          state_topic: '~/power',
        },
      },
    ];

    // Configure MQTT Topics
    this.deviceTopics = {
      state: {
        key: 1,
        type: 'bool',
      },
      current: {
        key: 18,
        type: 'float',
      },
      power: {
        key: 19,
        type: 'float',
        stateMath: '/10',
      },
      voltage: {
        key: 20,
        type: 'float',
        stateMath: '/10',
      }
    };

    // Send home assistant discovery data and give it a second before sending state updates
    this.initDiscovery();
    await utils.sleep(2);

    // Get initial states and start publishing topics
    this.getStates();
  }

  initDiscovery() {
    for (const d of this.ha_discovery) {
      const unique_id = [this.config.id, d.suffix.toLowerCase()].filter(Boolean).join('_');
      const baseName = this.config.name ? this.config.name : this.config.id;

      const topic = `homeassistant/${d.domain}/${unique_id}/config`;
      const discoveryData = {
        name: [baseName, d.suffix].filter(Boolean).join(' '),
        unique_id: unique_id,
        device: this.deviceData,
        ...this.replaceBaseTopic(d.data)
      }

      debugDiscovery(topic);
      debugDiscovery(discoveryData);

      this.publishMqtt(topic, JSON.stringify(discoveryData));
    }
  }

  // replaces '~' with the base Topic
  replaceBaseTopic(data) {
    const res = {};
    for (let [key, val] of Object.entries(data)) {
      res[key] = key.endsWith('_topic') ? val.replace('~/', this.baseTopic) : val;
    }
    return res;
  }
}

module.exports = TekkinSwitch;
