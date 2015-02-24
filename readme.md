# Flux Capacitor

Just a bunch of tools to implement apps the Flux way.

## Install

```
npm install fluxcapacitor --save
```

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
FluxCapacitor.createStore = function(actions: Actions, store: object): object
FluxCapacitor.Store = function(actions: Actions, store: object): object
FluxCapacitor.createActions = function(names: array): Actions
FluxCapacitor.createEvents = function(names: array): Events
FluxCapacitor.Actions = function(names: array): Actions
FluxCapacitor.Events = function(names: array): Events
FluxCapacitor.createAction = function(name: string): Action
FluxCapacitor.createEvent = function(name: string): Event
FluxCapacitor.withDebug = function(debug: bool): FluxCapacitor
FluxCapacitor.lodash = { ... }

Dispatcher.on = function(channel: string, callback: function): void
Dispatcher.off = function(channel: string, callback: function): void
Dispatcher.trigger = function(channel: string, payload: object): void

Action = function(payload: object): void
Action.listen = function(callback: function): void
Action.off = function(callback: function): void

Actions.listenTo = function(target: object, [config: object]): void

Event = function(payload: object): void
Event.listen = function(callback: function): void
Event.off = function(callback: function): void

Events.listenTo = function(target: object, [config: object]): void
```



