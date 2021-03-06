const Player = require("./player");
const Room = require("./room");
const _ = require("lodash");
const io = require("socket.io")();
const winston = require('winston');
winston.level = "debug";

module.exports = class GameManager {
  constructor(port) {
    this.port = port;
    this.rooms = [];
    this.roles = [];
    this.events = {};
    this.defaultRole = "player";
    this.timeout = 90000;
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
    if(name === "join") {
      this.joinCallback = callback;
    } else {
      this.events[name] = callback;
    }
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
        winston.debug(`Player joining '${roomId}' with username '${username}'`)
        //if the player already is in the room, set it to connected
        if(room.getPlayer(username)) {
          winston.debug('Player found in room.')
          player = room.getPlayer(username);
          player.socket = socket;
          player.disconnected = false;
        } else {
          //otherwise, make a new player and add it to the room
          winston.debug('New player being created.')
          player = new Player(username, this.defaultRole, socket);
          room.addPlayer(player);
        }
        //call the join callback
        if(this.joinCallback)
          this.joinCallback({room, player});

        socket.emit("joined", {message:
          `Successfully joined ${roomId} with role ${this.defaultRole} and username ${username}`});
      });
      //setup other socket events
      _.forOwn(this.events, (callback, name) => {
        socket.on(name, (data) => {
          callback({data, room, player});
        });
      });

      //handle disconnects
      io.on("disconnect", function() {
        if(!player) return;
        player.disconnected = true;
        setTimeout(() => {
          //if the player is still disconnected after the timeout, remove it from the room
          if(player.disconnected) {
            room.removePlayer(player.username);
          }
        }, this.timeout);
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
