# xtJSON

eXTended JSON - JSON with comments, function calls, mathematical expression evaluation and embedded remote data

## About

I was watching [this video](https://www.youtube.com/watch?v=N9RUqGYuGfw) where YouTuber Tsoding builds a JSON parser from scratch in Haskell. I realised I didn't really have a clue how to do this in any language, even one I am very familiar with like JavaScript.

After a few hours sketching ideas in my notebook and playing around with abstract syntax trees, I had something I was happy with. It's not particularly optimised for speed and it hasn't been tested on every edge case in the book, but it works reasonably well and comes in at under 200 lines of code (excluding comments).

The code is designed to be as modular as possible and while mutation is used in some places, data pipelines and functional style are emphasised. The code is thoroughly commented and may be useful as a learning resource.

## Supported features

- { "key": "value pairs" }
- ["arrays"]
- { "nested": { "objects": ["and", "arrays"]}}
- { "escaped": "\\"values\\"" }
- { "values": "that", "are": null }

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
the output of the native `JSON.parse` function.

## How to use

### Using the module

This module is currently not on NPM, so you will need to clone it locally. You can then import like so:

```
const jsonParser = require('./index'); // replace with appropriate path to index of the module

const parsed = jsonParser('{ "test": "value" }');

console.log(parsed);
```

See `src/example.js` for a more elaborate example that reads a file, parses the output and writes back to another file.

### Running tests

Unit tests for all major use cases are included. To run them, execute:

`npm test`

## Areas for improvement

The parser currently assumes all files passed to it are valid JSON, and therefore exhibits undefined behaviour if it is passed invalid input.

## Further reading

[Abstract Syntax Trees](https://en.wikipedia.org/wiki/Abstract_syntax_tree)

[Parse Trees](https://en.wikipedia.org/wiki/Parse_tree)
