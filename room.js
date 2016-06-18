const uuid = require('node-uuid');

module.exports = class Room {
  constructor() {
    this.id = uuid.v1();
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
}
