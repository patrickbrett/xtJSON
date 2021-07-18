# xtJSON

eXTended JSON - JSON with comments, function calls, mathematical expression evaluation and embedded remote data

## About

This project is the natural extension of my bare bones [JSON Parser](https://github.com/patrickbrett/json-parser), which aims for feature parity with the `JSON.parse` command.

xtJSON allows for some pretty expressive and flexible constructs:
## Supported features

- `{ "comments": "both" /* inline */ }`
- `// and on their own line...`
- ```{ "functions": `(a, b) => a + b` }```
- ```{ "evaluation-of-inline-expressions": `1 + 2 + 3 / 8 * 15` }```
- `{ "requests-for": ~(https://remote.json.documents) }`
- plus everything normal JSON can do 😊

## Should I use this in my project?

Sure, I'm not going to stop you. However, there are a number of inherent security issues about the approaches taken here which mean you really shouldn't use this for anything important, especially if you plan on loading xtJSON documents you didn't write yourself.

xtJSON is powerful enough that it effectively allows you to embed arbitrary JavaScript code in config files, and the parser itself makes web requests that the documents specify. It's enough to give your company's compliance department an aneurysm or three.

Not to mention this is just a side project and I don't plan on maintaining it actively.

I just wanted to learn about syntax trees, mkay? 😉

## Feature syntax

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

### Functions and mathematical expressions

```
{
  "add": `(a, b) => a + b`,
  "multiply": `(a, b) => a * b`,
  "seven": `2 * 10 - 13`
}
```

The first two result in functions that can be called on the parsed JavaScript object. The third resolved to the number 7.

### Remote document embedding

```
{
  "local": {
    "here": "is",
    "some": "data"
  },
  "remote": ~(https://raw.githubusercontent.com/patrickbrett/json-parser/main/src/data/complex1.json)
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

Note that embedded data is *itself* treated as xtJSON, and can therefore contain further remote requests. This behaviour has not been tested and could lead to infinite self-referential loops or long loading times. Externally loaded JSON files can also embed expressions which may be dangerous - only load data from trusted sources!
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

## How to use

### Using the module

This module is currently not on NPM, so you will need to clone it locally. You can then import like so:

```
const jsonParser = require('./index'); // replace with appropriate path to index of the module

const run = async () => {
  const parsed = await jsonParser('{ "test": "value" }');
  console.log(parsed);
};

run();
```

See `src/example.js` for a more elaborate example that reads a file, parses the output and writes back to another file.

### Running tests

Unit tests for all major use cases are included. To run them, execute:

`npm test`

## Areas for improvement

The parser currently assumes all files passed to it are valid xtJSON, and therefore exhibits undefined behaviour if it is passed invalid input.

It also waits individually for each HTTP request to resolve when loading remote data, rather than loading requests concurrently. This was architecturally simpler however has the obvious limitation that xtJSON files with many remote calls will take longer to resolve.

## Further reading

[Abstract Syntax Trees](https://en.wikipedia.org/wiki/Abstract_syntax_tree)

[Parse Trees](https://en.wikipedia.org/wiki/Parse_tree)
