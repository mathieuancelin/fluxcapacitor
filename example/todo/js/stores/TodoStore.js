var FluxCapacitor = require('fluxcapacitor');
var TodoActions = require('../actions/TodoActions');
var assign = require('object-assign');

var TodoStore = FluxCapacitor.createStore([TodoActions], {
  events: FluxCapacitor.createEvents(['change']),
  text: '',
  todos: {},
  onCreate: function(action) {
    if (action.text !== '') {
      this.create(action.text);
    }
    this.events.change();
  },
  onToggleCompleteAll: function() {
    if (this.areAllComplete()) {
      this.updateAll({complete: false});
    } else {
      this.updateAll({complete: true});
    }
    this.events.change();
  },
  onDestroyCompleted: function() {
    this.destroyCompleted();
    this.events.change();
  },
  onDestroy: function(action) {
    this.destroy(action.id);
    this.events.change();
  },
  onToggleComplete: function(action) {
    this.update(action.id, { complete: !action.complete });
    this.events.change();
  },
  onUpdateText: function(action) {
    text = action.text.trim();
    if (text !== '') {
      this.update(action.id, {text: text});
    }
    this.events.change();
  },
  create: function(text) {
    var id = (+new Date() + Math.floor(Math.random() * 999999)).toString(36);
    this.todos[id] = {
      id: id,
      complete: false,
      text: text
    };
  },
  update: function(id, updates) {
    this.todos[id] = assign({}, this.todos[id], updates);
  },
  updateAll: function(updates) {
    for (var id in this.todos) {
      this.update(id, updates);
    }
  },
  destroy: function(id) {
    delete this.todos[id];
  },
  destroyCompleted: function() {
    for (var id in this.todos) {
      if (this.todos[id].complete) {
        this.destroy(id);
      }
    }
  },
  areAllComplete: function() {
    for (var id in this.todos) {
      if (!this.todos[id].complete) {
        return false;
      }
    }
    return true;
  },
  getAll: function() {
    return this.todos;
  }
});

module.exports = TodoStore;
