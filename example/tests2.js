'use strict';

const FluxCapacitor = require('./src/fluxcapacitor');
const _ = FluxCapacitor.lodash;
const id = FluxCapacitor.uuid();

const actions = FluxCapacitor.createActions([
  'createUser',
  'deleteUser',
  'updateUser'
]);

class TestStore extends FluxCapacitor.Store {

  constructor(actionArray) {
    super(actionArray);
    this.users = [];
    this.events = FluxCapacitor.createEvents(['notifyUserListUpdated']);
  }

  getUsers() {
    return this.users;
  }

  onCreateUser(user) {
    this.users.push(user);
    this.events.notifyUserListUpdated();
  }

  onDeleteUser(user) {
    this.users = this.users.filter((u) => user._id !== u._id);
    this.events.notifyUserListUpdated();
  }

  onUpdateUser(user) {
    this.users = this.users.map((u) => u._id === user._id ? user : u);
    this.events.notifyUserListUpdated();
  }
}

const store = new TestStore([actions]);

const unsubscribe4 = store.events.notifyUserListUpdated.listen(() => {
  console.log('[STORE] ' + JSON.stringify(store.getUsers()));
});

actions.createUser({ _id: id, name: 'Jane Doe', age: 42 });
actions.updateUser({ _id: id, name: 'Jane Doe', age: 52 });
actions.deleteUser({ _id: id });

store.shutdown();
unsubscribe4();
