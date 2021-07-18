const fs = require("fs");
const util = require("util");
const path = require("path");

/**
 * Takes a relative filename and makes it absolute using the path module.
 * @param {*} fname filename to make absolute
 * @returns absolute file path
 */
const relative = (fname) => path.join(__dirname, fname);

/**
 * Gets the last element in an array if it is not empty, otherwise returns null.
 * @param {*} arr array to find last element of
 * @returns last element of array, or null
 */
const last = (arr) => (arr.length > 0 ? arr[arr.length - 1] : null);

/**
 * Allows running console.log to arbitrary levels of depth in nested objects.
 * @param  {...any} objs objects to inspect
 * @returns nothing
 */
const inspect = (...objs) =>
  console.log(...objs.map((obj) => util.inspect(obj, true, null)));

/**
 * Loads a file's contents as a string
 * @param {*} fname relative filename/path to load
 * @returns file contents as a string
 */
const read = (fname) => fs.readFileSync(relative(fname)).toString();

/**
 * Writes a JavaScript object to the given filename/path
 * @param {*} fname relative filename/path to write to
 * @param {*} data JS object to write
 * @returns nothing
 */
const write = (fname, data) =>
  fs.writeFileSync(relative(fname), JSON.stringify(data));

/**
 * Composes several functions together and pipes a value through each of them,
 * using the output of each as the input for the next.
 * @param {*} init initial value to pipe through
 * @param {*} funcs functions to pipe along
 * @returns output of the last function
 */
const pipe = (init, funcs) => {
  let out = init;
  funcs.forEach((func) => {
    out = func(out);
  });
  return out;
};

/**
 * Replaces all occurrences of a substring in a string
 * with another specified substring.
 * Native to NodeJS 15+, this is a replica of this functionality for older
 * versions.
 * @param {*} from initial substring to replace
 * @param {*} to substring to replace with
 * @param {*} str string to search within
 * @returns new string with values replaced
 */
const replaceAll = (from, to) => (str) =>
  str.replace(new RegExp(from, "g"), to);

/**
 * a function similar to Array.map, but over an object's values.
 * @param {*} obj object to map over
 * @param {*} mapFunc function to each of the object's values with
 * @returns mapped object
 */
const objMap = (obj, mapFunc) => {
  const newObj = {};
  Object.keys(obj).forEach((key) => {
    const val = obj[key];
    newObj[key] = mapFunc(val);
  });
  return newObj;
};

module.exports = { last, inspect, read, write, pipe, replaceAll, objMap };
