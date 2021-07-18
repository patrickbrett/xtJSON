const { expect } = require("@jest/globals");
const jsonParser = require("../jsonParser");
const { read } = require("../util");

const tests = [
  ["single-kv", "correctly parses single key value pair"],
  ["multi-kv", "correctly parses multiple key value pairs"],
  ["nested-kv", "correctly parses nested key value pairs"],
  ["kv-with-array", "correctly parses key value pairs with array"],
  ["escaped1", "correctly parses escaped values [1]"],
  ["escaped2", "correctly parses escaped values [2]"],
  ["complex1", "correctly parses complex json [1]"],
  ["nulls", "correctly handles null values"],
  ["array", "correctly handles array as root element"],
  ["empty", "correctly handles empty object"],
  ["empty-array", "correctly handles empty array"],
];

tests.forEach(([fname, desc]) => {
  test(desc, () => {
    const jsonString = read(`./data/${fname}.json`);
    const parsed = jsonParser(jsonString);
    expect(parsed).toEqual(JSON.parse(jsonString));
  });
});
