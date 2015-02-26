/** @jsx React.DOM */

FluxCapacitor.withDebug(true);

var _ = FluxCapacitor.lodash;

var actions = FluxCapacitor.createActions([
  'createUser',
  'deleteUser',
  'updateUser'
]);

id = FluxCapacitor.uuid();

var store = FluxCapacitor.createStore([actions], {
  users: [],
  events: FluxCapacitor.createEvents(['notifyUserListUpdated', 'notifyMessageAdded']),
  onCreateUser: function(user) {
    this.users.push(user);
    this.events.notifyUserListUpdated(this.users);
    this.events.notifyMessageAdded(user);
  },
  onDeleteUser: function(user) {
    this.users = this.users.filter(function(u) { return user._id !== u._id; });
    this.events.notifyUserListUpdated(this.users);
    this.events.notifyMessageAdded(user);
  },
  onUpdateUser: function(user) {
    this.users = this.users.map(function(u) { return u._id === user._id ? user : u; });
    this.events.notifyUserListUpdated(this.users);
    this.events.notifyMessageAdded(user);
  }
});

var User = React.createClass({
  render: function() {
    return (
      <li><span style={{ color: 'white', font: 'Consolas' }}>User : {this.props.name} is {this.props.age} years old</span></li>
    );
  }
});

var Users = React.createClass({
  mixins: [FluxCapacitor.Mixins.AutoStates],
  stateFrom: [store.events.notifyUserListUpdated],
  getInitialState: function() {
    return {
      userList: []
    };
  },
  render: function() {
    return (
      <ul>
        {this.state.userList.map(function(user) {
          return <User name={user.name} age={user.age} />
        })}
      </ul>
    );
  }
});

var LogItem = React.createClass({
  render: function() {
    return (
      <li><span style={{ color: 'white', font: 'Consolas' }}><span style={{ color: 'white' }}>[{this.props.level}]</span> : {this.props.message}</span></li>
    );
  }
});

var Logger = React.createClass({
  mixins: [FluxCapacitor.Mixins.AutoListen],
  listenTo: [store.events],
  getInitialState: function() {
    return {
      userList: []
    };
  },
  onNotifyMessageAdded: function(user) {
    console.log('added')
    this.setState({
      userList: this.state.userList.concat([user])
    });
  },
  render: function() {
    return (
      <ul>
        {this.state.userList.map(function(user) {
          return <LogItem level="MESSAGE" message={JSON.stringify(user, null, 2)} />
        })}
      </ul>
    );
  }
});



React.render(<div><Users /><br /><Logger /></div>, document.getElementById('app'));

store.events.notifyUserListUpdated.listen(function() { 
  console.log('[STORE] ' + JSON.stringify(store.users));
});  

actions.createUser({ _id: id, name: 'John Doe', age: 42 });
setTimeout(function() {
  actions.updateUser({ _id: id, name: 'John Doe', age: 52 });
  setTimeout(function() {
    actions.deleteUser({ _id: id });
  }, 2000);
}, 2000);


