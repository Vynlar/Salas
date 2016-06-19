const Player = require("./player");
const Room = require("./room");
const _ = require("lodash");
const io = require("socket.io")();

module.exports = class GameManager {
  constructor(port) {
    this.port = port;
    this.rooms = [];
    this.roles = [];
    this.events = {};
    this.defaultRole = "player";
  }

  addRoom(room) {
    this.rooms.push(room);
  }

  getRoom(id) {
    const matches = this.rooms.filter((room) => {
      return room.id == id;
    });
    if(matches.length > 1) {
      throw new Error(`Two rooms have the same id: ${id}`);
    } else if(matches.length === 0) {
      //if no room is found, make a new one
      const newRoom = new Room(id);
      this.rooms.push(newRoom);
      return newRoom;
    }
    return matches[0];
  }

  on(name, callback) {
    this.events[name] = callback;
  }

  removeEvent(name) {
    delete this.events[name];
  }

  setupSocketIo() {
    io.on("connection", (socket) => {
      let room;
      let player;
      //setup standard socket events
      socket.on("join", ({roomId, username}) => {
        room = this.getRoom(roomId);
        player = new Player(username, this.defaultRole, socket);
        room.addPlayer(player);
        socket.emit("joined", {message: `Successfully joined ${roomId} with role ${this.defaultRole} and username ${username}`})
      });
      //setup other socket events
      _.forOwn(this.events, (callback, name) => {
        socket.on(name, (data) => {
          callback({data, room, player});
        });
      });
    });
  }

  start(server) {
    this.setupSocketIo();
    if(server)
      io.listen(server);
    else
      io.listen(this.port);
  }
}
