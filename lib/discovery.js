'use strict';

const Client = require('./client');
const async = require('async');
const DISCOVERY_URL = 'https://discovery.etcd.io/';

function Discovery (key) {
  if (!key) throw new Error('Key has to be provided');
  this._key = key;
}

module.exports = Discovery;

/**
 * anonymous function - Get value from etcd
 *
 * @param  {type} key
 * @param  {type} next
 * @return {type}
 */
Discovery.prototype._get = function (key, next) {
  if (key instanceof Function) {
    next = key;
    key = null;
  }
  let url = DISCOVERY_URL + this._key;
  if (key) url += '/' + key;
  let client = new Client(url);
  client.get((err, res) => {
    if (err) return next(err);
    let value = JSON.parse(res);
    if (value.dir !== true && value.node && value.node.value) {
      value = value.node.value;
    }
    return next(null, value);
  });
};


Discovery.prototype._set = function (key, value, next) {
  if (!key || !value)
    return next(new Error('Key/Value has to be provided'));
  let url = DISCOVERY_URL + this._key + '/' + key;
  let client = new Client(url);
  client.put(JSON.stringify(value), value.ttl, (err) => {
    if (err) return next(err);
    return next(null, true);
  });
};

Discovery.prototype._del = function (key, next) {
  if (!key) return next(new Error('Key has to be provided'));
  let url = DISCOVERY_URL + this._key;
  let client = new Client(url);
  client.delete((err) => {
    if (err) return next(err);
    return next(null, true);
  });
};

Discovery.prototype.register = function (name, config, next) {
  if (!name) return next(new Error('Name has to be provided'));
  config = config || {};
  let reg = {
    name,
    alias: config.alias || name,
    ip: config.ip || '127.0.0.1',
    port: config.port || 3000,
  };
  if (config.ttl) reg.ttl = config.ttl;
  this._set(name, reg, next);
};

Discovery.prototype.discover = function (name, next) {
  if (!name) return next(new Error('Name has to be provided'));
  let url = DISCOVERY_URL + this._key + '/' + name;
  this._get(name, (err, val) => {
    if (val) next(null, val);
    let client = new Client(url);
    client.watcher((err, res) => {
      if (err) return next(err);
      let value = JSON.parse(res);
      if (value.dir !== true && value.node && value.node.value) {
        value = value.node.value;
        value = JSON.parse(value);
      }
      return next(null, value);
    });
  });
};

Discovery.prototype.discoverAll = function (names, next) {
  names = (names instanceof Array) ? names : [names];
  let result = {};
  async.each(names, (name, cb) => {
    this.discover(name, (err, val) => {
      if (err) return cb(err);
      result[name] = val;
      return cb();
    });
  }, (err) => {
    return next(err, result);
  });
};
