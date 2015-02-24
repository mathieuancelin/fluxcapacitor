# Flux Capacitor

Just a bunch of tools to implement apps the Flux way.

## Exemple

```javascript
var FluxCapacitor = require('fluxcapacitor');
var _ = FluxCapacitor.lodash;

var users [];

var actions = FluxCapacitor.createActions([
  'createUser',
  'deleteUser',
  'updateUser'
]);

var events = FluxCapacitor.createEvents([
  'notifyUserListUpdated'
]);

events.notifyUserListUpdated.listen(function() {
  console.log(users);
});

actions.createUser.listen(function(user) {
  users.push(user);
  events.notifyUserListUpdated();
});

actions.deleteUser.listen(function(user) {
  users = _.filter(users, u => user._id === u._id);
  events.notifyUserListUpdated();
});

actions.updateUser.listen(function(user) {
  users = _.merge(_.findWhere(users, { _id: user._id }), user);
  events.notifyUserListUpdated();
});

var id = FluxCapacitor.uuid();
actions.createUser({ _id: id, name: 'John Doe', age: 42 });
actions.updateUser({ _id: id, age: 52 });
actions.deleteUser({ _id: id });
```

## API

```javascript
FluxCapacitor.invariant = function(condition: bool, message: string, args...): void
FluxCapacitor.invariantLog = function(condition: bool, message: string, args...): void
FluxCapacitor.uuid = function(): String
FluxCapacitor.mirror = function(keys: object): object
FluxCapacitor.keyMirror = function(keys: object): object
FluxCapacitor.dispatcher = function(): Dispatcher
FluxCapacitor.createDispatcher = function(): Dispatcher
FluxCapacitor.Dispatcher = function(): Dispatcher;
FluxCapacitor.createActions = function(names: array): object
FluxCapacitor.createEvents = function(names: array): object
FluxCapacitor.Actions = function(names: array): object
FluxCapacitor.Events = function(names: array): object
FluxCapacitor.createAction = function(name: string): Action
FluxCapacitor.createEvent = function(name: string): Event
FluxCapacitor.withDebug = function(debug: bool): FluxCapacitor
FluxCapacitor.lodash = ...

Dispatcher.on = function(channel: string, callback: function): void
Dispatcher.off = function(channel: string, callback: function): void
Dispatcher.trigger = function(channel: string, payload: object): void

Action = function(payload: object): void
Action.listen = function(callback: function): void
Action.off = function(callback: function): void

Event = function(payload: object): void
Event.listen = function(callback: function): void
Event.off = function(callback: function): void
```



