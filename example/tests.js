var FluxCapacitor = require('./src/fluxcapacitor');
var _ = FluxCapacitor.lodash;

var id = FluxCapacitor.uuid();

var actions = FluxCapacitor.createActions([
  'createUser',
  'deleteUser',
  'updateUser'
]);

var store = FluxCapacitor.createStore([actions], {
  users: [],
  events: FluxCapacitor.createEvents(['notifyUserListUpdated']),
  getUsers: function() {
    return this.users;
  },
  onCreateUser: function(user) {
    this.users.push(user);
    this.events.notifyUserListUpdated();
  },
  onDeleteUser: function(user) {
    this.users = this.users.filter(function(u) { return user._id !== u._id; });
    this.events.notifyUserListUpdated();
  },
  onUpdateUser: function(user) {
    this.users = this.users.map(function(u) { return u._id === user._id ? user : u; });
    this.events.notifyUserListUpdated();
  }
});

var unsubscribe4 = store.events.notifyUserListUpdated.listen(function() {
  console.log('[STORE] ' + JSON.stringify(store.getUsers()));
});

actions.createUser({ _id: id, name: 'John Doe', age: 42 });
actions.updateUser({ _id: id, name: 'John Doe', age: 52 });
actions.deleteUser({ _id: id });

store.shutdown();
unsubscribe4();
