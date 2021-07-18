/**
 * Simple example use of jsonParser.
 * Reads JSON from a file, parses it, and writes it back out to another file.
 * Assuming everything works correctly,
 * the input and output files will contain the same content.
 */

const { read, write, inspect } = require("./util");
const parseJson = require("./jsonParser");

const exampleJson = read("./data/escaped1.json");
const parsed = parseJson(exampleJson);
inspect(parsed);
write("out.json", parsed);
