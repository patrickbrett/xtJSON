# xtJSON

eXTended JSON - JSON with comments, function calls, mathematical expression evaluation and embedded remote data

[![npm version](https://badge.fury.io/js/xtjson.svg)](https://npmjs.com/package/xtjson)

## About

This project is the natural extension of [JSON Parser](https://github.com/patrickbrett/json-parser), which aims for feature parity with the `JSON.parse` command. The first project was built to understand how parsers work, whereas this project was built to extend on that knowledge and see how far JSON as a format can be pushed.

xtJSON allows for some pretty expressive and flexible constructs:

## Supported features

-   `{ "comments": "both" /* inline */ }`
-   `// and on their own line...`
-   `{ "sets": (1, 2, 3, 4) }`
-   `` { "functions": `(a, b) => a + b` } ``
-   `` { "evaluation-of-inline-expressions": `1 + 2 + 3 / 8 * 15` } ``
-   `{ "requests-for": ~"https://remote.json.documents" }`
-   plus everything normal JSON can do 😊

## Should I use this in my project?

Sure, I'm not going to stop you. This parser can do some pretty cool stuff and I can think of plenty of interesting use cases.

Just be aware that there are some security concerns. xtJSON is powerful enough that it effectively allows you to embed arbitrary JavaScript code in config files, and the parser itself makes web requests that the documents specify. It's enough to give your company's compliance department an aneurysm or three, even with the 'safe mode' option which blocks the more dangerous features.

Not to mention this is just a side project and I don't plan on maintaining it actively. The parser loads the whole document in one go and hasn't been tested on large files.

I just wanted to learn about syntax trees, mkay? 😉

## Feature syntax

### At a glance

```
{
  // xtJSON is a superset of JSON
  "array": [1, "string", true, { "nested": { "objects": "also work" }}],

  // It supports JavaScript sets
  "JavaScript sets": (1, 2, 3, "sets are supported!"),

  // As well as functions and maths expressions
  "add": `(a, b) => a + b`,
  "multiply": `(a, b) => a * b`,
  "seven": `2 * 10 - 13`,

  // You can embed remote JSON documents and they will be loaded when parsed
  "e.g.": ~"https://raw.githubusercontent.com/patrickbrett/json-parser/main/src/data/complex1.json"

  /*
  And finally, it supports "safe mode" which turns off the remote embedding and functions
  while keeping the comments and sets. This is useful for documents you don't fully trust.
  */
}
```

### Comments

```
// this is a comment at the top
{
  "key": "value",
  // this is a comment
  "something": { "one": [2, 3] /* this is a nested comment */ },
  "another": "comments in // strings are not removed",
  "and": "neither /* are nested */ comments"
}
// this is another comment
```

Comment like you would in a regular JavaScript file. Easy!

### Sets

```
{
  "array": [1, 2, 3, 4, 5],
  "set": (1, 2, 3, "string"),
  "obj": {},
}
```

Sets are denoted by rounded brackets: `(` and `)`. They resolve into regular JavaScript sets.

### Functions and mathematical expressions

```
{
  "add": `(a, b) => a + b`,
  "multiply": `(a, b) => a * b`,
  "seven": `2 * 10 - 13`
}
```

Any valid JavaScript expression, including mathematical expressions and functions, can be placed in backticks and they will be imported into the object as their resolved values.

The first two of the examples above result in functions that can be called on the parsed JavaScript object. The third resolves to the number 7.

Safe mode disables this feature.

### Remote document embedding

```
{
  "local": {
    "here": "is",
    "some": "data"
  },
  "remote": ~"https://raw.githubusercontent.com/patrickbrett/json-parser/main/src/data/complex1.json"
}
```

This resolves to:

```
{
  "local": { "here": "is", "some": "data" },
  "remote": {
    "glossary": {
      "title": "example glossary",
      "GlossDiv": {
        "title": "S",
        "GlossList": {
          "GlossEntry": {
            "ID": "SGML",
            "SortAs": "SGML",
            "GlossTerm": "Standard Generalized Markup Language",
            "Acronym": "SGML",
            "Abbrev": "ISO 8879:1986",
            "GlossDef": {
              "para": "A meta-markup language, used to create markup languages such as DocBook.",
              "GlossSeeAlso": ["GML", "XML"]
            },
            "GlossSee": "markup"
          }
        }
      }
    }
  }
}
```

This feature is disabled in safe mode.

Note that embedded data is _itself_ treated as xtJSON, and therefore allows comments, sets, etc. However, by default, remote data is automatically loaded using safe mode, so it can't resolve function expressions or more remote data. If you _really_ want to load remote data unsafely, then call `jsonParser.remoteUnsafe(...)` instead of just `jsonParser`. This behaviour has not been tested and could lead to infinite self-referential loops or long loading times. Externally loaded JSON files can also embed arbtirary code which may be dangerous - only load data from trusted sources!

## How to use

### Using the module

Install like this:

`npm i xtjson`

Then import:

```
const jsonParser = require('xtjson');

const run = async () => {
  const parsed = await jsonParser('{ "test": "value" }');
  console.log(parsed);
};

run();
```

Note that invocations are async for consistency whether or not remote data is imported.

See `src/example.js` for a more elaborate example that reads a file, parses the output and writes back to another file.

### Safe mode

Naturally, remote requests and arbitrary function execution aren't particularly safe. If you'd like to use xtJSON without them, call the module like this instead:

```
const parsed = await jsonParser.safe('{ "test": "value" }');
```

### Running tests

Unit tests for all major use cases are included. To run them, execute:

`npm test`

## How it works

The parser processes data through four stages:

1. Raw JSON string
2. Token array
3. Abstract Syntax Tree
4. Parsed JavaScript object

Examples of each of these:

### Raw JSON string

```
{
  "key": "value",
  "another": null,
  "nested": {
    "something": null,
    "finally": 2
  },
  "array": [4, 5, "6, 7, 8", null, 21]
}
```

The raw JSON string is the input to the algorithm.

### Token array

```
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
```

The token array represents the JSON data as a list of tokens, each of which may be a value, brace or other symbol. Strings are stored in nested quotes while numbers, null values and other symbols are stored as regular strings. Whitespace outside of strings is removed. This intermediate representation makes the transition to a tree-based structure simpler and more efficient.

### Abstract Syntax Tree

```
Obj {
  edges: {
    key: 'value',
    another: null,
    nested: Obj { edges: { something: null, finally: 2 }, pendingKey: null },
    array: Arr { edges: [ 4, 5, '6, 7, 8', null, 21 ] }
  },
  pendingKey: null
}
```

The Abstract Syntax Tree is a tree-structured, class-based representation of the
data that serves as an intermediate point between the token array representation
and the final JavaScript object.

It contains a few notations that are not seen in
the final output, such as class types (`Obj` and `Arr`) and the `pendingKey` attribute
on `Obj` instances. These are used to allow the data to be structured in the appropriate manner. For example, the `pendingKey` attribute allows the attribute to match object values to their keys, even though these are seen at different times when parsing the JSON.

### Parsed JavaScript Object

```
{
  key: 'value',
  another: null,
  nested: { something: null, finally: 2 },
  array: [ 4, 5, '6, 7, 8', null, 21 ]
}
```

The parsed JavaScript object is the output of the algorithm and is designed to mimic
the output of the native `JSON.parse` function, of course with additional magic features discussed above 🦄

## Areas for improvement

The parser currently assumes all files passed to it are valid xtJSON, and therefore exhibits undefined behaviour if it is passed invalid input.

It also waits individually for each HTTP request to resolve when loading remote data, rather than loading requests concurrently. This was architecturally simpler however has the obvious limitation that xtJSON files with many remote calls will take longer to resolve.

## Further reading

[Abstract Syntax Trees](https://en.wikipedia.org/wiki/Abstract_syntax_tree)

[Parse Trees](https://en.wikipedia.org/wiki/Parse_tree)
