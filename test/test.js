const should = require("should");
const Player = require("../player.js");
const Room = require("../room.js");
const GameManager = require("../index.js");
const ioClient = require("socket.io-client");
const sinon = require("sinon");
require("should-sinon");

describe("Room", () => {
  it("should add a player to a room", () => {
    const player = new Player("Vynlar", "player");
    const room = new Room();
    room.addPlayer(player);
    room.getPlayer("Vynlar").should.be.exactly(player);
  });

  it("should remove a player from the room", () => {
    const player = new Player("Vynlar", "player");
    const room = new Room();
    room.addPlayer(player);
    room.removePlayer("Vynlar");
    should(room.getPlayer("Vynlar")).not.be.ok();
  });
});

describe("Player", () => {
  it("should save the role", () => {
    const player = new Player("Vynlar", "player");
    player.role.should.be.exactly("player");
  });

  it("should save the username", () => {
    const player = new Player("Vynlar", "player");
    player.username.should.be.exactly("Vynlar");
  });

  it("should have a uuid", () => {
    const player = new Player("Vynlar", "player");
    should(player.uuid).not.be.ok();
  });
});

describe("GameManager", () => {
  it("should create a game if getGame is called with no arguments", () => {
    const gm = new GameManager(7070);
    gm.getRoom().should.be.an.instanceOf(Room);
  });

  it("should get a game if getGame is called with a valid roomId", () => {
    const gm = new GameManager(7070);
    const room = new Room();
    gm.rooms.push(room);
    gm.getRoom(room.id).should.be.an.instanceOf(Room);
  });

  it("should throw an error if getGame is called with an invalid room id", () => {
    const gm = new GameManager(7070);
    gm.getRoom.bind(null, "invalid id").should.throw();
  });

  it("should add a new event listener", () => {
    const gm = new GameManager(7070);
    const callback = () => console.log("never called");
    gm.on("message", callback);
    gm.events.should.have.keys("message");
    gm.events.message.should.be.equal(callback);
  });

  it("should remove an event listener", () => {
    const gm = new GameManager(7070);
    gm.on("message", () => () => console.log("never called"));
    gm.removeEvent("message");
    should(gm.events.message).not.be.ok();
  });

  it("should register events on a socket", (done) => {
    const gm = new GameManager(7070);
    gm.start();
    const socket = ioClient("http://localhost:7070");
    socket.on("connect", () => {
      done();
    });
  });

  it("should trigger an event when a message is sent", () => {
    const gm = new GameManager(7070);
    const callback = sinon.spy();
    gm.on("eventName", callback);
    gm.start();
    const socket = ioClient("http://localhost:7070");
    socket.emit("message");
  });
});
