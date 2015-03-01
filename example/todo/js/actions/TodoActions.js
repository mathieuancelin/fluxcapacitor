var FluxCapacitor = require('fluxcapacitor');

module.exports = FluxCapacitor.createActions([
  'destroyCompleted',
  'destroy',
  'toggleCompleteAll',
  'toggleComplete',
  'updateText',
  'create'
]);
