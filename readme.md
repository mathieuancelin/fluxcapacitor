# Flux Capacitor

Just a bunch of tools to implement apps the Flux way.

## Install

```
npm install fluxcapacitor --save
```

## Exemple

```javascript
'use strict';

const FluxCapacitor = require('fluxcapacitor');
const _ = FluxCapacitor.lodash;

let users = [];

const actions = FluxCapacitor.createActions([
  'createUser',
  'deleteUser',
  'updateUser'
]);

const events = FluxCapacitor.createEvents([
  'notifyUserListUpdated'
]);

const unsubscribe = events.notifyUserListUpdated.listen(() => console.log(users));  

const unsubscribe1 = actions.createUser.listen(user => {
  users.push(user);
  events.notifyUserListUpdated();
});

const unsubscribe2 = actions.deleteUser.listen(user => {
  users = users.filter(u => user._id !== u._id);
  events.notifyUserListUpdated();
});

const unsubscribe3 = actions.updateUser.listen(user => {
  users = users.map(u => u._id === user._id ? user : u);
  events.notifyUserListUpdated();
});

const id = FluxCapacitor.uuid();
actions.createUser({ _id: id, name: 'John Doe', age: 42 });
actions.updateUser({ _id: id, name: 'John Doe', age: 52 });
actions.deleteUser({ _id: id });

unsubscribe();
unsubscribe1();
unsubscribe2();
unsubscribe3();
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

Dispatcher.on = function(channel: string, callback: function): function
Dispatcher.off = function(channel: string, callback: function): void
Dispatcher.trigger = function(channel: string, payload: object): void

Action = function(payload: object): void
Action.listen = function(callback: function): function
Action.off = function(callback: function): void

Actions.listenTo = function(target: object, [config: object]): function

Event = function(payload: object): void
Event.listen = function(callback: function): function
Event.off = function(callback: function): void

Events.listenTo = function(target: object, [config: object]): function
```



