const { expect } = require("@jest/globals");
const xtJsonParser = require("../xtJsonParser");
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
  ["bools", "correctly handles boolean values"],
  ["array", "correctly handles array as root element"],
  ["empty", "correctly handles empty object"],
  ["empty-array", "correctly handles empty array"],
];

const extendedTests = [
  ["comments", "correctly parses file with comments"],
  ["comments-multiline", "correctly parses file with multiline comments"],
  ["remote", "correctly parses file with reference to remote json"],
];

regularTests.forEach(([fname, desc]) => {
  test(`regular - ${desc}`, async () => {
    const jsonString = read(`./data/regular/${fname}.xtjson`);
    const parsed = await xtJsonParser(jsonString);
    expect(parsed).toEqual(JSON.parse(jsonString));
  });
});

extendedTests.forEach(([fname, desc]) => {
  test(`extended - ${desc}`, async () => {
    const jsonString = read(`./data/extended/${fname}.xtjson`);
    const expectedJsonString = read(`./data/extended/${fname}-expected.xtjson`);
    const parsed = await xtJsonParser(jsonString);
    expect(parsed).toEqual(JSON.parse(expectedJsonString));
  });
});

test("extended - safe - does not load remote file", async () => {
  const jsonString = read(`./data/extended/remote.xtjson`);
  const expectedJsonString = read(
    `./data/extended/remote-expected-safe.xtjson`
  );
  const parsed = await xtJsonParser.safe(jsonString);
  expect(parsed).toEqual(JSON.parse(expectedJsonString));
});

test("extended - correctly parses file with functions", async () => {
  const jsonString = read(`./data/extended/functions.xtjson`);
  const parsed = await xtJsonParser(jsonString);

  expect(parsed.add(2, 56)).toEqual(58);
  expect(parsed.multiply(3, 7)).toEqual(21);
  expect(parsed.seven).toEqual(7);
});

test("extended - safe - loads function as string", async () => {
  const jsonString = read(`./data/extended/functions.xtjson`);
  const expectedJsonString = read(
    `./data/extended/functions-expected-safe.xtjson`
  );
  const parsed = await xtJsonParser.safe(jsonString);

  expect(parsed).toEqual(JSON.parse(expectedJsonString));
});

test("extended - correctly parses set [1]", async () => {
  const jsonString = read(`./data/extended/sets.xtjson`);
  const parsed = await xtJsonParser(jsonString);
  expect(parsed.set).toEqual(new Set([1, 2, 3, "string"]));
});

test("extended - correctly parses set [2]", async () => {
  const jsonString = read(`./data/extended/sets-nested.xtjson`);
  const parsed = await xtJsonParser(jsonString);
  expect(parsed.set).toEqual(new Set([1, 2, 3, "string", [5, 6, 7], { 8: 9 }]));
});
