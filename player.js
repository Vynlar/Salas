const uuid = require('node-uuid');
const _ = require("lodash");

module.exports = class Player {
  constructor(username, role, socket) {
    this.username = username;
    this.role = role;
    this.id = uuid.v1();
    this.socket = socket;
    this.disconnected = false;
    this.properties = {};
  }

  addProp(name, value) {
    if(this.properties[name]) {
      throw new Error(`Cannot create property ${name}: Duplicate property.`);
    }
    this.properties[name] = value;
  }

  removeProp(name) {
    delete this.properties[name];
  }

  setProp(name, value) {
    this.properies[name] = value;
  }

  incrementProp(name, amount=1) {
    if(_.isNil(this.properies[name])) {
      this.properies[name] = 0;
    }
    if(_.isNumeric(this.properies[name])) {
      this.properies[name] += amount;
    } else {
      throw new Error("Cannot increment a non-numeric property.")
    }
  }

  decrementProp(name, amount=1) {
    this.incrementProp(name, -amount);
  }
}
