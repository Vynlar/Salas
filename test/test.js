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

  it("should get a player from the room", () => {
    const room = new Room();
    const player = new Player("Vynlar", "player");
    room.addPlayer(player);
    const player2 = new Player("Vynlar2", "player");
    room.addPlayer(player2);
    room.getPlayer("Vynlar").should.equal(player);
    room.getPlayer("Vynlar2").should.equal(player2);
  });

  it("should be able to get players from multiple roles", () => {
    const room = new Room();
    const player = new Player("Vynlar", "player");
    room.addPlayer(player);
    const gm = new Player("Vynlar2", "gm");
    room.addPlayer(gm);

    room.getPlayersByRole("player")[0].should.equal(player);
    room.getPlayersByRole("player").should.have.length(1);

    room.getPlayersByRole(["player", "fake"]).should.have.length(1);
    room.getPlayersByRole(["player", "fake"])[0].should.equal(player);

    room.getPlayersByRole(["player", "gm"]).should.have.length(2);
    room.getPlayersByRole(["player", "gm"]).should.containEql(player);
    room.getPlayersByRole(["player", "gm"]).should.containEql(gm);
  });

  it("should send events to a single role", () => {
    const room = new Room();
    const clients = [
      {
        emit: sinon.spy()
      },
      {
        emit: sinon.spy()
      },
      {
        emit: sinon.spy()
      }
    ];
    room.addPlayer(new Player("p1", "player", clients[0]));
    room.addPlayer(new Player("p2", "player", clients[1]));
    room.addPlayer(new Player("gm1", "gm", clients[2]));
    room.emitToRole("player", "message", "data");
    clients[0].emit.should.be.calledWith("message", "data");
    clients[1].emit.should.be.calledWith("message", "data");
    clients[2].emit.should.not.be.called;
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
  const gm = new GameManager(7070);

  it("should get a game if getgame is called with a valid roomid", () => {
    const room = new Room();
    gm.rooms.push(room);
    gm.getRoom(room.id).should.be.an.instanceOf(Room);
  });

  it("should create a new game if getGame is called with an invalid room id", () => {
    gm.getRoom("newRoomId").id.should.be.equal("newRoomId");
  });

  it("should add a new event listener", () => {
    const callback = sinon.spy();
    gm.on("message", callback);
    gm.events.should.have.keys("message");
    gm.events.message.should.be.equal(callback);
    callback.should.not.be.called;
  });

  it("should remove an event listener", () => {
    const callback = sinon.spy();
    gm.on("message", callback)
    gm.removeEvent("message");
    should(gm.events.message).not.be.ok();
    callback.should.not.be.called;
  });

});

describe("Sockets", () => {
  const gm = new GameManager(7070);
  gm.start();

  afterEach(() => {
    gm.rooms = [];
    gm.events = {};
    gm.roles = [];
  });

  it("should connect", (done) => {
    const socket = ioClient.connect("http://localhost:7070");
    socket.on("connect", () => {
      socket.disconnect();
      done();
    });
  });

  it("should trigger an event when a message is sent", (done) => {
    //server
    gm.on("eventName", () => {
      socket.disconnect();
      done();
    });
    //client
    const socket = ioClient.connect("http://localhost:7070");
    socket.on("connect", () => {
      socket.emit("eventName");
    });
  });

  it("should send an event", (done) => {
    const requestData = "this is some data";
    //server
    gm.on("message", ({data}) => {
      data.should.be.equal(requestData);
      socket.disconnect();
      done();
    });
    //client
    const socket = ioClient.connect("http://localhost:7070");
    socket.on("connect", () => {
      socket.emit("message", requestData);
    });

  });

  it("should join a room", (done) => {
    //client
    const socket = ioClient.connect("http://localhost:7070");
    socket.on("connect", () => {
      socket.emit("join", {
        roomId: "fakeRoomId",
        username: "Vynlar"
      });

      socket.on("joined", () => {
        gm.rooms.filter((room) => {
          return room.id = "fakeRoomId";
        })[0]
        .players.forEach((player) => {
          if(player.username === "Vynlar") {
            socket.disconnect();
            done();
          } else {
            done(new Error("Player Vynlar not found"));
          }
        });
      });
    });
  });
});
