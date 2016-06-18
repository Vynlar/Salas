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
  }

  addRoom(room) {
    this.rooms.push(room);
  }

  getRoom(id) {
    //if no id is provided, make a new room
    if(_.isNil(id)) {
      const newRoom = new Room();
      this.rooms.push(newRoom);
      return newRoom;
    } else {
      //if an id is provided, then get it
      const room = this.rooms.filter((room) => {
        return room.id = id;
      });
      if(room.length > 1) {
        throw new Error(`Two rooms have the same id: $(id)`);
      }
      if(room.length === 0) {
        throw new Error(`Invalid id $(id)`);
      }
      return room[0];
    }
  }

  on(name, callback) {
    this.events[name] = callback;
  }

  removeEvent(name) {
    delete this.events[name];
  }

  setupSocketIo() {
    io.on("connection", (socket) => {
      Object.keys(this.events).forEach((event) => {
        _.forOwn(this.events, (name, callback) => {
          socket.on(name, (data) => {
            callback(data);
          });
        });
      });
    });
  }

  start() {
    this.setupSocketIo();
    io.listen(this.port);
  }
}
