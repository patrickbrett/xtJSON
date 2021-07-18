const { expect } = require("@jest/globals");
const jsonParser = require("../xtJsonParser");
const { read } = require("../util");

const regularTests = [
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

const extendedTests = [
  ["comments", "correctly parses file with comments"],
  ["comments-multiline", "correctly parses file with multiline comments"],
];

regularTests.forEach(([fname, desc]) => {
  test(`regular - ${desc}`, () => {
    const jsonString = read(`./data/regular/${fname}.xtjson`);
    const parsed = jsonParser(jsonString);
    expect(parsed).toEqual(JSON.parse(jsonString));
  });
});

extendedTests.forEach(([fname, desc]) => {
  test(`extended - ${desc}`, () => {
    const jsonString = read(`./data/extended/${fname}.xtjson`);
    const expectedJsonString = read(`./data/extended/${fname}-expected.xtjson`);
    const parsed = jsonParser(jsonString);
    expect(parsed).toEqual(JSON.parse(expectedJsonString));
  });
});
