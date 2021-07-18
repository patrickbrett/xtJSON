const { last, pipe, replaceAll, objMap, inspect } = require("./util");

const { Obj, Arr } = require("./AstElems");

const openerTypes = {
  "{": Obj,
  "[": Arr,
};
const closerTypes = {
  "}": Obj,
  "]": Arr,
};
const excludedChars = [":", ","];
const specialChars = ["{", "}", "[", "]", ",", ":", "\\"];

const Strings = {
  ESCAPE: "\\",
  DOUBLE_ESCAPE: "\\\\",
  QUOTE: '"',
  SPACE: " ",
  EMPTY: "",
  NEWLINE: "\n",
  NULL: "null",
};

/**
 * Generates an array containing all relevant tokens in the JSON.
 * This is then used to build the AST.
 * 
 * @param {*} jsonString original stringified JSON to parse
 * @returns array of tokens
 * 
 * Example input:
  {
    "key": "value",
    "another": null,
    "nested": {
      "something": null,
      "finally": 2
    },
    "array": [4, 5, "6, 7, 8", null, 21]
  }
  
 * Example output:
  [
    '{',           '"key"',     ':',
    '"value"',     ',',         '"another"',
    ':',           'null',      ',',
    '"nested"',    ':',         '{',
    '"something"', ':',         'null',
    ',',           '"finally"', ':',
    '2',           '}',         ',',
    '"array"',     ':',         '[',
    '4',           ',',         '5',
    ',',           '"6, 7, 8"', ',',
    'null',        ',',         '21',
    ']',           '}'
  ]
 */
const generatetokenArray = (jsonString) => {
  const noNewlines = replaceAll("\n", "")(jsonString);
  const chars = noNewlines.split(Strings.EMPTY);

  const tokenArray = [];
  let isInsideQuotes = false;
  let currentToken = [];

  chars.forEach((char, i) => {
    const prevChar = i ? chars[i - 1] : null;

    if (char === Strings.QUOTE && prevChar !== Strings.ESCAPE) {
      isInsideQuotes = !isInsideQuotes;
    }

    if (specialChars.includes(char) && !isInsideQuotes) {
      if (currentToken.length) {
        tokenArray.push(currentToken.join(Strings.EMPTY));
        currentToken = [];
      }
      tokenArray.push(char);
    } else if (isInsideQuotes || char !== Strings.SPACE) {
      currentToken.push(char);
    }
  });

  return tokenArray;
};

/**
 * Puts an object key or value into the relevant object or array in the AST.
 *
 * @param {*} stack stack showing current nesting level
 * @param {*} toAdd token to add if an object value
 * @param {*} toAddPendingKey token to add if an object key
 *
 * @returns nothing
 */
const putSubvalue = (stack, toAdd, toAddPendingKey) => {
  const lastElem = last(stack);

  if (lastElem instanceof Arr) {
    // Insert the value into the array
    lastElem.edges.push(toAdd);
  } else if (lastElem instanceof Obj) {
    // If we've already received the key, then insert the value under that key
    if (lastElem.pendingKey) {
      lastElem.edges[lastElem.pendingKey] = toAdd;
      lastElem.pendingKey = null;
    } else {
      // otherwise, the current token is the key
      lastElem.pendingKey = toAddPendingKey;
    }
  }
};

/**
 * @param {*} stack stack showing current nesting level
 * @param {*} elem to process into the tree
 * @returns reference to the relevant object or array in the AST,
 * if a new object/array is inserted into the tree. This always occurs for the
 * first token ('{' or '['), and so the first returned value will be for the root
 * node of the tree.
 */
const processElem = (stack) => (elem) => {
  // Skip colons and commas as they do not directly add meaning
  if (excludedChars.includes(elem)) return;

  // Handle opening braces ('{' and '[')
  if (Object.keys(openerTypes).includes(elem)) {
    // Create the appropriate AST element for the opening brace
    const astElem = new openerTypes[elem]();
    // Go one level deeper in the stack
    stack.push(astElem);
    // Return the AST element we created so that it can be used if it is the root
    return astElem;
  }

  // Handle closing braces ('}' and ']')
  if (Object.keys(closerTypes).includes(elem)) {
    if (last(stack) instanceof closerTypes[elem]) {
      // We move up one level in the stack and insert the relevant subtree into its parent
      putSubvalue(stack, stack.pop());
    }
    return; // no return value if we received a closer type
  }

  // If we've made it to here, the type is a regular value (string, number, null etc)

  // Strip the value of quotes
  const strippedElem = replaceAll(Strings.QUOTE, Strings.EMPTY)(elem);

  // Now identify how the value should be parsed - here is where we handle nulls, escapes, etc
  const parsedVal = (() => {
    // Return null values as-is
    if (elem === Strings.NULL) return null;
    // If the string is escaped, then allow its quotation marks to remain,
    // but strip out the escape characters
    if (elem.includes(Strings.ESCAPE)) {
      // Remove first and last character, which are quotation marks
      const unquoted = elem.substr(1, elem.length - 2);
      return replaceAll(Strings.DOUBLE_ESCAPE, Strings.EMPTY)(unquoted);
    }

    // If the string is not escaped, return the string stripped of all quotes
    // and if it is numeric, format it as a number
    if (Number.isNaN(Number(strippedElem))) return strippedElem;
    return Number(strippedElem);
  })();

  // The value stripped of quotes will always be used as a key, even if the actual value is a number or similar
  putSubvalue(stack, parsedVal, strippedElem);
};

/**
 * Processes the AST token array into a full AST tree.
 * @param {*} tokenArray AST array to process into a nested AST.
 * @returns nested AST built out of Obj and Arr instances.
 * 
 * Example input:
  [
    '{',           '"key"',     ':',
    '"value"',     ',',         '"another"',
    ':',           'null',      ',',
    '"nested"',    ':',         '{',
    '"something"', ':',         'null',
    ',',           '"finally"', ':',
    '2',           '}',         ',',
    '"array"',     ':',         '[',
    '4',           ',',         '5',
    ',',           '"6, 7, 8"', ',',
    'null',        ',',         '21',
    ']',           '}'
  ]
 * 
 * Example output:
  Obj {
    edges: {
      key: 'value',
      another: null,
      nested: Obj { edges: { something: null, finally: 2 }, pendingKey: null },
      array: Arr { edges: [ 4, 5, '6, 7, 8', null, 21, [length]: 5 ] }
    },
    pendingKey: null
  }
 */
const generateAst = (tokenArray) => {
  const stack = [];
  // We reference the first element as processElem will always return the root node
  // of the tree when it is called on the first element.
  // We must process all elements however, as these become children of the root.
  const tree = tokenArray.map(processElem(stack))[0];
  return tree;
};

/**
 * Recursively parses the AST into a JavaScript object.
 * 
 * @param {*} ast the AST to parse
 * @returns parsed AST for the given subtree,
 * or for the entire tree if the root AST is passed in as an argument.
 * 
 * Example input:
  Obj {
    edges: {
      key: 'value',
      another: null,
      nested: Obj { edges: { something: null, finally: 2 }, pendingKey: null },
      array: Arr { edges: [ 4, 5, '6, 7, 8', null, 21 ] }
    },
    pendingKey: null
  }
 *
 * Example output:
  {
    key: 'value',
    another: null,
    nested: { something: null, finally: 2 },
    array: [ 4, 5, '6, 7, 8', null, 21 ]
  }
 */
const parseAst = (ast) => {
  if (ast instanceof Obj) {
    // Dealing with an object, map each of its values
    // over this parseAst function recursively
    return objMap(ast.edges, parseAst);
  } else if (ast instanceof Arr) {
    // Dealing with an array, map each of its elements
    // over this parseAst function recursively
    return ast.edges.map(parseAst);
  } else {
    // Dealing with a raw value (number, string, null etc) so just return it
    return ast;
  }
};

/**
 * Compiles the relevant functions into a pipeline consisting of generating an AST array,
 * turning that array into an actual AST, and then parsing that AST into a JSON object.
 * @param {*} jsonString stringified JSON to parse
 * @returns JavaScript object containing the parsed JSON
 */
const parseJson = (jsonString) =>
  pipe(jsonString, [generatetokenArray, generateAst, parseAst]);

module.exports = parseJson;
