/** @jsx React.DOM */

FluxCapacitor.withDebug(true);

var _ = FluxCapacitor.lodash;

var actions = FluxCapacitor.createActions([
  'createUser',
  'deleteUser',
  'updateUser'
]);

var store = FluxCapacitor.createStore([actions], {
  users: [],
  events: FluxCapacitor.createEvents([
    'notifyUserListUpdated', 
    'notifyMessageAdded'
  ]),
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
      <li><span style={{ color: 'white', font: 'Consolas' }}>[{this.props._id}] {this.props.name} is {this.props.age} years old</span></li>
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
          return <User name={user.name} age={user.age} _id={user._id} />
        })}
      </ul>
    );
  }
});

var LogItem = React.createClass({
  render: function() {
    return (
      <li><span style={{ color: 'white', font: 'Consolas' }}><span style={{ color: 'yellow' }}>[{this.props.level}]</span> : {this.props.message}</span></li>
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

var CommandBar = React.createClass({
  ids: [],
  _create: function() {
    var i = FluxCapacitor.uuid();
    this.ids.push(i);
    actions.createUser({ _id: i, name: 'John Doe', age: 42 })
  },
  _update: function() {
    var i = this.ids.pop();
    if (i) {
      actions.updateUser({ _id: i, name: 'John Doe', age: 52 });
      this.ids.reverse();
      this.ids.push(i);
      this.ids.reverse();
    }
  },
  _delete: function() {
    var i = this.ids.pop();
    if (i) {
      actions.deleteUser({ _id: i });
    }
  },
  render: function() {
    return (
      <div>
        <button type="button" onClick={this._create}>Create</button>
        <button type="button" onClick={this._update}>Update</button>
        <button type="button" onClick={this._delete}>Delete</button>
      </div>
    );
  }
});

React.render(<div><CommandBar /><Users /><br/><hr/><br/><Logger /></div>, document.getElementById('app'));