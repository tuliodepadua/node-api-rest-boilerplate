'use strict';

const timezone = process.env.TZ || 'America/Sao_Paulo';
const moment = require('moment-timezone');
moment.tz.setDefault(timezone);

class DataUtils {
  getPropertyValue(obj, path) {
    return path
      .replace(/\[(\w+)\]/g, '.$1')
      .replace(/^\./, '')
      .split('.')
      .reduce((a, part) => a && a[part], obj);
  }

  setPropertyValue(obj, path, value) {
    let i;
    const a = path.replace(/^\./, '').split('.');
    for (i = 0; i < a.length - 1; i++) {
      if (!obj[a[i]]) {
        obj[a[i]] = {};
      }
      obj = obj[a[i]];
    }

    obj[a[i]] = value;
    return obj;
  }

  format(data, type) {
    let format = 'YYYY-MM-DD[T]HH:mm:ss.SSSZZ';

    switch (type) {
      case 'datetime':
      case 'date':
        format = this.DateTimeUtils.getDateFormat(data);
        if (moment(data, format, true).isValid()) {
          data = moment(data, format).toISOString(true);
        }
        break;
      case 'number':
        data = isNaN(Number(data)) ? data : Number(data);
        break;
      case 'boolean':
        data = Boolean(JSON.parse(data));
        break;
    }

    return data;
  }

  getFieldsOfSchema(model) {
    const object = model.schema ? model.schema.obj : model.obj;
    const fields = Object.keys(object);
    const result = [];

    for (const key of fields) {
      result.push({
        key: key,
        type: object[key].type.name.toLowerCase()
      });
    }
    return result;
  }

  normalize(params, fields) {
    const fieldNames = Object.keys(fields);
    const finalParams = {};

    if (fieldNames.length) {
      fieldNames.forEach(item => {
        const opt = fields[item].custom ? fields[item].custom.options() : {};
        const value = this.getPropertyValue(params, item);

        if (!opt.remove && value) {
          if (opt.rename && opt.type && value) {
            finalParams[opt.rename] = this.format(value, opt.type);
          } else if (opt.type && value) {
            finalParams[item] = this.format(value, opt.type);
          } else {
            finalParams[item] = value;
          }
        }
      });
    }

    return finalParams;
  }

  getDateFormat(date) {
    if (moment(date, 'YYYY-MM-DD[T]HH:mm:ss.SSSZZ', true).isValid()) {
      return 'YYYY-MM-DD[T]HH:mm:ss.SSSZZ';
    }
    if (moment(date, 'YYYY-MM-DD[T]HH:mm:ss.SSS[Z]', true).isValid()) {
      return 'YYYY-MM-DD[T]HH:mm:ss.SSS[Z]';
    }
    if (moment(date, 'YYYY-MM-DD', true).isValid()) {
      return 'YYYY-MM-DD';
    }
    if (moment(date, 'YYYY-MM-DD[T]HH:mm:ss', true).isValid()) {
      return 'YYYY-MM-DD[T]HH:mm:ss';
    }
    if (moment(date, 'DD/MM/YYYY HH:mm:ss', true).isValid()) {
      return 'DD/MM/YYYY HH:mm:ss';
    }
    if (moment(date, 'DD/MM/YYYY HH:mm', true).isValid()) {
      return 'DD/MM/YYYY HH:mm';
    }
    if (moment(date, 'YYYY-MM-DD[T]HH:mm', true).isValid()) {
      return 'YYYY-MM-DD[T]HH:mm';
    }
    if (moment(date, 'DD/MM/YYYY', true).isValid()) {
      return 'DD/MM/YYYY';
    }

    return 'YYYY-MM-DD[T]HH:mm:ss.SSSZZ';
  }
}

module.exports = new DataUtils();