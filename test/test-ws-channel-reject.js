var Server = require('./mock-server');
var Channel = require('../ws-channel');
var assert = require('assert');
var debug = require('debug')('strong-control-channel:test');
var extend = require('util')._extend;
var tap = require('tap');

tap.test('server reject', function(t) {
  // Parent and server.
  var server = new Server('channel', onRequest, onListening);
  var channel;
  var alives = 0;
  var closes = 0;

  t.plan(1);

  t.on('end', function() {
    debug('stop server');
    server.stop();
  });

  server.client.on('new-channel', function(ch) {
    channel = ch;
  });

  function onListening(uri) {
    debug('mesh uri: %s', uri);

    var channel = Channel.connect(function() {}, uri);

    channel.request({cmd: 'alive'}, function(rsp) {
      debug('client rsp %j', rsp);
    });

    channel.on('error', function(err) {
      debug('client err %s', err.message);
      t.equal(err.message, 'reject-channel');
    });
  }

  function onRequest(message, callback) {
    debug('server recv: %j', message);
    assert.equal(message.cmd, 'alive');

    callback({});

    debug('destroying channel');
    // Simulate server restart... destroy the client and its channels, then
    // reaccept the client token, but since the channel will no longer be known,
    // the channel will be rejected even though the client is known.
    server.client.destroy();
    server.client = server.router.acceptClient(function() {
      assert(false);
    }, 'CID');
  }
});
