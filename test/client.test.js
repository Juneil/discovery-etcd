'use strict';

const assert = require('chai').assert;
//const rewire = require('rewire');
const Client = require('../lib/client');

describe('Creation', () => {
  it('Success', () => {
    let client = new Client('coucou');
    assert.isDefined(client);
  });
  it('Failed', () => {
    try { new Client(); }
    catch (e) { assert.equal(e.message, 'url has to be provided'); }
  });
});

describe('Get', () => {
  it('Success', (done) => {
    let client = new Client('http://test.local/');
    client.request = (opts, cb) => {
      assert.deepEqual(opts, {
        url: 'http://test.local/',
        method: 'GET'
      });
      return cb(null, 'response');
    };
    client.get((err, val) => {
      if (err) return done(err);
      assert.equal(val, 'response');
      return done();
    });
  });
  it('Failed', (done) => {
    let client = new Client('http://test.local/');
    client.request = (opts, cb) => {
      return cb(new Error('error'));
    };
    client.get((err) => {
      assert.isDefined(err);
      return done();
    });
  });
});

describe('Put', () => {
  it('Success', (done) => {
    let client = new Client('http://test.local/');
    client.request = (opts, cb) => {
      assert.deepEqual(opts, {
        url: 'http://test.local/',
        method: 'PUT',
        form: {
          value: JSON.stringify('toto')
        }
      });
      return cb(null, 'response');
    };
    client.put('toto', null, (err, val) => {
      if (err) return done(err);
      assert.equal(val, 'response');
      return done();
    });
  });
  it('Success - TTL', (done) => {
    let client = new Client('http://test.local/');
    client.request = (opts, cb) => {
      assert.deepEqual(opts, {
        url: 'http://test.local/',
        method: 'PUT',
        form: {
          value: JSON.stringify('toto'),
          ttl: 5
        }
      });
      return cb(null, 'response');
    };
    client.put('toto', 5, (err, val) => {
      if (err) return done(err);
      assert.equal(val, 'response');
      return done();
    });
  });
  it('Failed', (done) => {
    let client = new Client('http://test.local/');
    client.request = (opts, cb) => {
      return cb(new Error('error'));
    };
    client.put('toto', 0, (err) => {
      assert.isDefined(err);
      return done();
    });
  });
});

describe('Watch', () => {
  it('Success', (done) => {
    let client = new Client('http://test.local/');
    client.request = (opts, cb) => {
      assert.deepEqual(opts, {
        url: 'http://test.local/',
        method: 'GET',
        qs: {
          wait: true
        }
      });
      return cb(null, 'response');
    };
    client.watch((err, val) => {
      if (err) return done(err);
      assert.equal(val, 'response');
      return done();
    });
  });
  it('Failed', (done) => {
    let client = new Client('http://test.local/');
    client.request = (opts, cb) => {
      return cb(new Error('error'));
    };
    client.watch((err) => {
      assert.isDefined(err);
      return done();
    });
  });
});

describe('Watcher', () => {
  it('Success', (done) => {
    let loop = 0;
    let client = new Client('http://test.local/');
    client.request = (opts, cb) => {
      assert.deepEqual(opts, {
        url: 'http://test.local/',
        method: 'GET',
        qs: {
          wait: true
        }
      });
      switch (loop) {
        case 0: // No update, long-polling closed
          loop++;
          return cb(null, '');
        case 1: // update
          loop++;
          return cb(null, 'update');
      }
    };
    client.watcher((err, val) => {
      if (err) return done(err);
      assert.equal(loop, 2);
      assert.equal(val, 'update');
      return done();
    });
  });
  it('Failed', (done) => {
    let client = new Client('http://test.local/');
    client.request = (opts, cb) => {
      return cb(new Error('error'));
    };
    client.watcher((err) => {
      assert.isDefined(err);
      return done();
    });
  });
});
