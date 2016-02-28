'use strict';

const request = require('request');


/**
 * Client - Etcd Client
 *
 * @param  {string} url Full http url with key
 */
function Client (url) {
  if (!url) throw new Error('url has to be provided');
  this._url = url;
}

module.exports = Client;

/**
 * request function - Do the http call
 *
 * @param  {object}   options  See request docs
 * @param  {function} next     callback
 */
 /* istanbul ignore next */
Client.prototype.request = function (options, next) {
  request(options, (err, res, value) => {
    return next(err, value);
  });
};


/**
 * get function - Get value for the current url
 *
 * @param  {function} next callback
 */
Client.prototype.get = function (next) {
  if (!next) next = () => {};
  let options = {
    url: this._url,
    method: 'GET'
  };
  this.request(options, next);
};


/**
 * put function - Set value for the current url
 *
 * @param  {string}   value Value to set
 * @param  {number}   ttl   Set a ttl, can be null
 * @param  {function} next  callback
 */
Client.prototype.put = function (value, ttl, next) {
  if (!next) next = () => {};
  value = JSON.stringify(value);
  let options = {
    url: this._url,
    method: 'PUT',
    form: { value }
  };
  if (ttl) options.form.ttl = ttl;
  this.request(options, next);
};


/**
 * watch function - Watch for a change
 *
 * @param  {function} next callback
 */
Client.prototype.watch = function (next) {
  if (!next) next = () => {};
  let options = {
    url: this._url,
    method: 'GET',
    qs: {
      wait: true
    }
  };
  this.request(options, next);
};

/**
 * watcher function - Watch improved,
 * * keep the connection alive
 *
 * @param  {function} next callback
 */
Client.prototype.watcher = function (next) {
  let cb = (err, value) => {
    if (err) return next(err);
    if (!value) this.watch(cb);
    if (value) {
      this.watch(cb);
      return next(null, value);
    }
  };
  this.watch(cb);
};
