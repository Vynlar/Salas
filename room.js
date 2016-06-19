const uuid = require('node-uuid');
const _ = require("lodash");

module.exports = class Room {
  constructor(roomId) {
    if(_.isNil(roomId))
      this.id = uuid.v1();
    else
      this.id = roomId;
    this.players = [];
  }

  addPlayer(player) {
    this.players.push(player);
  }

  removePlayer(username) {
    this.players = this.players.filter(player => {
      return player.username !== username;
    });
  }

  getPlayer(username) {
    const player = this.players.filter((player) => {
      return player.username === username;
    });
    return player[0];
  }

  getPlayersByRole(role) {
    return this.players.filter((player) => {
      if(Array.isArray(role))
        return role.includes(player.role);
      return player.role === role;
    });
  }

  emitToRole(role, name, data) {
    this.getPlayersByRole(role).forEach((player) => {
      player.socket.emit(name, data);
    });
  }
}
