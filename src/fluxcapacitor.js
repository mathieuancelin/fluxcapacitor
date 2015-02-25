var _ = require('lodash');
var Q = require('q');

var debug = false;

function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function Dispatcher(log) {
  var callbacks = {};
  var api = {
    on: function(name, callback) {
      var events = callbacks[name] || (callbacks[name] = []);
      events.push(callback);
      return function() {
        api.off(name, callback);
      };
    },
    off: function(name, callback) {
      var events = callbacks[name] || [];
      callbacks[name] = _.filter(events, function(cb) {
        return cb !== callback; 
      });
    },
    triggerAsync: function(name, payload) {
      var deferred = Q.defer();
      var cb = this.trigger;
      _.defer(function() {
        try {
          cb(name, payload);
          if (payload.__response) {
            deferred.resolve(payload.__response);
          } else {
            deferred.resolve({});
          }
        } catch(e) {
          console.error(e);
          deferred.reject(new Error(e));
        }
      });
      return deferred.promise;
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
  return api; 
};

function MultiDispatcher(arr, dispatcherName, log) {

  var dispatcher = Dispatcher(log);

  function action(name) {
    var ret = function() {
      var arg = arguments[0] || {};
      dispatcher.trigger(dispatcherName + "." + name, arg);
    };
    ret.triggerAsync = function() {
      var arg = arguments[0] || {};
      return dispatcher.triggerAsync(dispatcherName + "." + name, arg);
    };
    ret.listen = function(callback) {
      dispatcher.on(dispatcherName + "." + name, callback);
      return function() {
        ret.off(callback);
      };
    };
    ret.off = function(callback) {
      dispatcher.off(dispatcherName + "." + name, callback);
    };
    return ret;
  }
  if (!_.isArray(arr) && _.isObject(arr)) {
    arr = _.keys(arr);
  }
  var api = {};
  _.each(arr, function(name) {
    api[name] = action(name);
  });
  api.bindTo = function(obj, config) { 
    var subscriptions = [];
    if (config) {
      _.chain(_.keys(config)).filter(function(key) {
        var actualFuncName = config[key];
        return _.isFunction(obj[actualFuncName]) || _.isFunction(actualFuncName);
      }).each(function(key) {
        var actualFuncName = config[key];
        subscriptions.push(api[key].listen(_.isFunction(actualFuncName) ? actualFuncName.bind(obj) : obj[actualFuncName].bind(obj)));
      }).value();
    } else {
      _.chain(_.keys(api)).filter(function(key) {
        if (key === 'bindTo') return false;
        return true;
      }).map(function(key) {
        return {
          f: obj['on' + capitalize(key)],
          key: key,
          handler: 'on' + capitalize(key)
        };
      }).filter(function(struct) { 
        return _.isFunction(struct.f); 
      }).each(function(struct) {
        subscriptions.push(api[struct.key].listen(struct.f.bind(obj))); 
      }).value();
    }
    return function() {
      _.each(subscriptions, function(unsubscribe) {
        unsubscribe();
      });
    };
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
  if (_.isArray(actions)) {
    var unsubscribe = function() {};
    store.init = function() {
      var subs = [];
      _.each(actions, function(a) {
        subs.push(a.bindTo(store));
      });
      unsubscribe = function() {
        _.each(subs, function(s) { s(); });
      }
      store.shutdown = unsubscribe;
    };
    store.init();
    store.shutdown = unsubscribe;
    return store;
  } else {
    var unsubscribe = actions.bindTo(store);
    store.init = function() {
      store.shutdown = actions.bindTo(store);  
    };
    store.shutdown = unsubscribe;
    return store;
  }
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