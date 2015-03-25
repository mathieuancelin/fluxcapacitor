"use strict";

var _ = require('lodash');
var Q = require('q');

var debug = false;

function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

var pending = {};

function Dispatcher(log) {
  var callbacks = {};
  var api = {
    on: function(name, token, callback) {
      if (!callback) {
        callback = token;
        if (!callback.__uuid) callback.__uuid = uuid();
      } else {
        callback.__uuid = token;
      }
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
      var current;
      var done = {};
      var events = callbacks[name] || [];
      var call = function(cb, waiting) {
        if (cb && !done[cb.__uuid]) {
          if (waiting) {
            invariant(waiting && cb.__uuid !== current, 'Cyclic dependency detected, current action directly wait for itself : %s', cb.__uuid);
            invariant(waiting && !pending[cb.__uuid], 'Cyclic dependency detected, you are already waiting for %s', cb.__uuid);
          }
          current = cb.__uuid;
          pending[cb.__uuid] = true;
          try {
            cb(payload, waitFor);
          } finally {
            delete pending[cb.__uuid];
            done[cb.__uuid] = true;
          }
        }
      }
      var waitFor = function(arr) {
        _.each(arr, function(k) {
          if (k.__store && k.token) k = k.token;
          call(_.findWhere(events, { __uuid: k }), true);
        });
      };
      _.each(events, function(callback) {
        call(callback);
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
    ret.listen = function(token, callback) {
      if (!callback) {
        callback = token;
      } else {
        callback.__uuid = token;
      }
      dispatcher.on(dispatcherName + "." + name, callback);
      return function() {
        ret.off(callback);
      };
    };
    ret.off = function(callback) {
      dispatcher.off(dispatcherName + "." + name, callback);
    };
    ret.__name = name;
    ret.__action = true;
    return ret;
  }
  if (!_.isArray(arr) && _.isObject(arr)) {
    arr = _.keys(arr);
  }
  var api = {};
  _.each(arr, function(name) {
    api[name] = action(name);
  });
  api.__actions = true;
  api.bindTo = function(obj, config) {
    var token = uuid();
    if (arguments.length >= 2 && _.isString(arguments[0])) {
      token = arguments[0];
      obj = arguments[1];
      config = arguments[2];
    }
    var subscriptions = [];
    if (config) {
      _.chain(_.keys(config)).filter(function(key) {
        var actualFuncName = config[key];
        return _.isFunction(obj[actualFuncName]) || _.isFunction(actualFuncName);
      }).each(function(key) {
        var actualFuncName = config[key];
        subscriptions.push(api[key].listen(token, _.isFunction(actualFuncName) ? actualFuncName.bind(obj) : obj[actualFuncName].bind(obj)));
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
        subscriptions.push(api[struct.key].listen(token, struct.f.bind(obj)));
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
  var token = uuid();
  if (_.isFunction(store)) {
    var api = {};
    api.token = token;
    store(api);
    store = api;
  }
  store.token = token;
  store.__store = true;
  if (_.isArray(actions)) {
    var unsubscribe = function() {};
    store.init = store.init || function() {
      var subs = [];
      _.each(actions, function(a) {
        subs.push(a.bindTo(token, store));
      });
      unsubscribe = function() {
        _.each(subs, function(s) { s(); });
      }
      store.shutdown = unsubscribe;
    };
    store.init();
    store.shutdown = store.shutdown || unsubscribe;
    return store;
  } else {
    var unsubscribe = actions.bindTo(token, store);
    store.init = store.init || function() {
      store.shutdown = actions.bindTo(token, store);
    };
    store.shutdown = store.shutdown || unsubscribe;
    return store;
  }
}

exports.createAction = function(name) {
  return Actions([name])[name];
};

exports.createEvent = function(name) {
  return Events([name])[name];
};

var reactMixins = {
  AutoListen: {
    componentDidMount: function() {
      var that = this;
      var subs = [];
      var eventsArr = that.listenTo || [];
      eventsArr.forEach(function(e) {
        subs.push(e.bindTo(that));
      });
      that.__unsubscribe = function() {
        subs.forEach(function(s) { s(); });
      };
    },
    componentWillUnmount: function() {
      this.__unsubscribe();
    }
  },
  AutoListenAt: function(event, name) {
    var regName = '__registrationAutoListenAt' + name + Date.now();
    return {
      componentDidMount: function() {
        this[regName] = event.listen(this[name] || function() { console.log('Missing function "' + name + '"'); });
      },
      componentWillUnmount: function() {
        this[regName]();
      }
    };
  },
  AutoStates: {
    componentDidMount: function() {
      var that = this;
      var subs = [];
      var eventsArr = that.stateFrom || [];
      _.each(eventsArr, function(event) {
        var actions = [];
        if (event.__actions) {
          _.each(event, function(value, key) {
            if (value.__action) actions.push(value);
          });
        } else if (event.__action) {
          actions.push(event);
        }
        _.each(actions, function(action) {
          subs.push(action.listen(function(payload) {
            var name = action.__name;
            if (_.startsWith(name, 'on')) {
              name = name.slice(2);
            }
            if (_.startsWith(name, 'set')) {
              name = name.slice(3);
            }
            if (_.startsWith(name, 'notify')) {
              name = name.slice(6);
            }
            if (_.endsWith(name, 'Change')) {
              name = name.slice(0, name.length - 6);
            }
            if (_.endsWith(name, 'Changed')) {
              name = name.slice(0, name.length - 7);
            }
            if (_.endsWith(name, 'Updated')) {
              name = name.slice(0, name.length - 7);
            }
            name = name.charAt(0).toLowerCase() + name.slice(1);
            var newState = {};
            newState[name] = payload;
            that.setState(newState);
          }));
        });
      });
      that.__unsubscribe = function() {
        subs.forEach(function(s) { s(); });
      };
    },
    componentWillUnmount: function() {
      this.__unsubscribe();
    }
  },
  AutoState: function(event, name) {
    var regName = '__registrationAutoState' + name + Date.now();
    return {
      componentDidMount: function() {
        var that = this;
        that[regName] = event.listen(function(payload) {
          var newState = {};
          newState[name] = payload;
          that.setState(newState);
        });
      },
      componentWillUnmount: function() {
        this[regName]();
      }
    };
  }
};

exports.invariant = invariant;
exports.invariantLog = invariantLog;
exports.uuid = uuid;
exports.mirror = keyMirror;
exports.keyMirror = keyMirror;
exports.createDispatcher = Dispatcher;
exports.createActions = Actions;
exports.createEvents = Events;
exports.createStore = createStore;
exports.lodash = _;
exports.q = Q;
exports.Mixins = reactMixins;
exports.Store = function(actions) {
  FluxCapacitor.createStore(actions, this);
};

exports.withDebug = function(d) {
  debug = d;
  return exports;
};
