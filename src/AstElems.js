/**
 * Simple classes used for building the Abstract Syntax Tree
 * that represents the JSON structure.
 */

/**
 * Class representing an object.
 * @edges contains key-value pairs
 * @pendingKey stores a pending key if one has not yet been processed
 */
class Obj {
  constructor() {
    this.edges = {};
    this.pendingKey = null;
  }
}

/**
 * Class representing an array.
 * @edges contains elements of the array
 */
class Arr {
  constructor() {
    this.edges = [];
  }
}

module.exports = {
  Obj,
  Arr,
};
