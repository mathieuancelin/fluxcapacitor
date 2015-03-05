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

const store = FluxCapacitor.createStore([actions], {
  users: [],
  events: FluxCapacitor.createEvents(['notifyUserListUpdated']),
  onCreateUser: (user) => {
    this.users.push(user);
    this.events.notifyUserListUpdated();
  },
  onDeleteUser: (user) => {
    this.users = this.users.filter(u => user._id !== u._id);
    this.events.notifyUserListUpdated();
  },
  onUpdateUser: (user) => {
    this.users = this.users.map(u => u._id === user._id ? user : u);
    this.events.notifyUserListUpdated();
  }
});

// FluxCapacitor.createStore([actions], function(theStore) { ... }) works too !

const unsubscribe4 = store.events.notifyUserListUpdated.listen(() => console.log(store.users));  
actions.createUser({ _id: id, name: 'John Doe', age: 42 });
actions.updateUser({ _id: id, name: 'John Doe', age: 52 });
actions.deleteUser({ _id: id });

store.shutdown();
unsubscribe4();
```

## React mixins

```javascript 
var myStore = FluxCapacitor.createStore(actions, {
  events: FluxCapacitor.createEvents(['somethingChanged']),
  ...
});

var myOtherStore = FluxCapacitor.createStore(actions, {
  events: FluxCapacitor.createEvents(['otherSomethingChanged']),
  ...
});

var Component1 = React.createClass({
  mixins: [FluxCapacitor.Mixins.AutoListenAt(myStore.events.somethingChanged, 'onSomethingChanged')],
  onSomethingChanged: function(something) {
    this.setState({
      something: something
    });
  },
  render: function() {
    ...
  }
});

var Component2 = React.createClass({
  mixins: [FluxCapacitor.Mixins.AutoListen],
  listenTo: [myStore.events, myOtherStore.events]
  onSomethingChanged: function(something) {
    this.setState({
      something: something
    });
  },
  onOtherSomethingChanged: function(othersomething) {
    this.setState({
      othersomething: othersomething
    });
  },
  render: function() {
      ...
  }
});

var Component3 = React.createClass({
  mixins: [FluxCapacitor.Mixins.AutoState(myStore.events.somethingChanged, 'something')],
  render: function() {
    // here use this.state.something
  }
});

var Component4 = React.createClass({
  mixins: [FluxCapacitor.Mixins.AutoStates],
  stateFrom: [store.events.notifyUserListUpdated], // notify and updated are escaped as well as on, set, change, changed
  getInitialState: function() {
    return {
      userList: []
    };
  },
  render: function() {
    // use this.state.userList
  }
});
```

## API

```javascript
FluxCapacitor.invariant = function(condition: bool, message: string, args...): void
FluxCapacitor.invariantLog = function(condition: bool, message: string, args...): void
FluxCapacitor.uuid = function(): String
FluxCapacitor.keyMirror = function(keys: object): object
FluxCapacitor.createDispatcher = function(): Dispatcher
FluxCapacitor.createStore = function(actions: Actions, store: object): object
FluxCapacitor.createActions = function(names: array): Actions
FluxCapacitor.createEvents = function(names: array): Events
FluxCapacitor.createAction = function(name: string): Action
FluxCapacitor.createEvent = function(name: string): Event
FluxCapacitor.withDebug = function(debug: bool): FluxCapacitor
FluxCapacitor.lodash = { ... }
FluxCapacitor.Mixins = {
  AutoListen: object
  AutoListenAt: function(event: Event, functionName: string)
  AutoState: function(event: Event, stateFieldName: string)
  AutoStates: object
}

Dispatcher.on = function(channel: string, callback: function): function
Dispatcher.off = function(channel: string, callback: function): void
Dispatcher.trigger = function(channel: string, payload: object): void
Dispatcher.triggerAsync = function(channel: string, payload: object): Promise

Action = function(payload: object): void
Action.triggerAsync = function(payload: object): Promise
Action.listen = function(callback: function): function
Action.off = function(callback: function): void

Actions.bindTo = function(target: object, [config: object]): function

Event = function(payload: object): void
Event.triggerAsync = function(payload: object): Promise
Event.listen = function(callback: function): function
Event.off = function(callback: function): void

Events.bindTo = function(target: object, [config: object]): function
```



