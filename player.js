const uuid = require('node-uuid');

module.exports = class Player {
  constructor(username, role, socket) {
    this.username = username;
    this.role = role;
    this.id = uuid.v1();
    this.socket = socket;
    this.disconnected = false;
  }
}
