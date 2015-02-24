var _ = require('lodash');

var debug = false;

function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function Dispatcher(log) {
  var callbacks = {};
  return {
    on: function(name, callback) {
      var events = callbacks[name] || (callbacks[name] = []);
      events.push(callback);
    },
    off: function(name, callback) {
      var events = callbacks[name] || [];
      callbacks[name] = _.filter(events, function(cb) {
        return cb !== callback; 
      });
    },
    trigger: function(name, payload) {
      if (log || debug) console.log('[FLUX CAPACITOR] Notify "' + name + '" with payload : ' + JSON.stringify(payload));
      var events = callbacks[name] || [];
      _.each(events, function(callback) {
        callback(payload);
      });  
      var all = callbacks['*'] || [];
      _.each(all, function(callback) {
        callback(name, payload);
      }); 
    }
  }; 
};

function MultiDispatcher(arr, dispatcherName, log) {

  var dispatcher = Dispatcher(log);

  function action(name) {
    var ret = function() {
      var arg = arguments[0] || {};
      dispatcher.trigger(dispatcherName + "." + name, arg);
    };
    ret.listen = function(callback) {
      dispatcher.on(dispatcherName + "." + name, callback);
    };
    ret.off = function(callback) {
      dispatcher.on(dispatcherName + "." + name, callback);
    };
    return ret;
  }

  var api = {};
  _.each(arr, function(name) {
    api[name] = action(name);
  });
  api.bindTo = function(obj, config) { // TODO : on...
    if (config) {
      _.chain(_.keys(config)).filter(function(key) {
        var actualFuncName = config[key];
        return _.isFunction(obj[actualFuncName]);
      }).each(function(key) {
        var actualFuncName = config[key];
        api[key].listen(obj[actualFuncName]);
      });
    } else {
      _.chain(_.keys(obj)).map(function(key) {
        return 'on' + capitalize(key);
      }).map(function(key) { 
        return obj[key]; 
      }).filter(function(attr) { 
        return _.isFunction(attr); 
      }).each(function(func) {
        api[key].listen(func); 
      });
    }
  };
  return api;
}

function Events(arr, log) {
  return MultiDispatcher(arr, "Events", log);
}

function Actions(arr, log) {
  return MultiDispatcher(arr, "Actions", log);
}

function keyMirror(obj, prefix) {
  if (!prefix) {
    prefix = '';
  }
  var ret = {};
  var key;
  if (!(obj instanceof Object && !Array.isArray(obj))) {
    throw new Error('mirror(...): Argument must be an object.');
  }
  for (key in obj) {
    if (!obj.hasOwnProperty(key)) {
      continue;
    }
    if (obj[key] instanceof Object) {
      ret[key] = keyMirror(obj[key], key + '.');
    } else {
      ret[key] = prefix + key;
    }
  }
  return ret;
}

function uuid() {
  var d = Date.now();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = (d + Math.random()*16)%16 | 0;
    d = Math.floor(d/16);
    return (c=='x' ? r : (r&0x7|0x8)).toString(16);
  });
}

function invariant(condition, message, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
  if (!condition) {
    var args = [a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p];
    var argIndex = 0;
    throw new Error("Violation : " + message.replace(/%s/g, function() { return args[argIndex++]; }));
  }
}

function invariantLog(condition, message, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
  if (!condition) {
    var args = [a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p];
    var argIndex = 0;
    console.error("Violation : " + message.replace(/%s/g, function() { return args[argIndex++]; }));
  }
}

function createStore(actions, store) {
  actions.listenTo(store);
  return store;
}

exports.invariant = invariant;
exports.invariantLog = invariantLog;
exports.uuid = uuid;
exports.mirror = keyMirror;
exports.keyMirror = keyMirror;
exports.dispatcher = Dispatcher;
exports.createDispatcher = Dispatcher;
exports.createActions = Actions;
exports.createEvents = Events;
exports.Actions = Actions;
exports.Events = Events;
exports.Dispatcher = Dispatcher;
exports.createStore = createStore;
exports.Store = createStore;
exports.lodash = _;

exports.createAction = function(name) {
  return Actions([name])[name];
};

exports.createEvent = function(name) {
  return Events([name])[name];
};

exports.withDebug = function(d) {
  debug = d;
  return exports;
};