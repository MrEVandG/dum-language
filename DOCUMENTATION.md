# DUM Documentation

## Overview

DUM is a programming language that can run basic programs that you can probably make it JavaScript or Python (if you cut corners.)
Link to README [here](./README.md)

### What can DUM do?

DUM can do what many other languages can do, at least in principle. For example, it can:

- Create and refer to variables
- Create and refer to functions
- Do basic math

However, before learning DUM, you need to understand "strict mode". Strict mode restricts how much predicting and how much freedom your code can get. Strict mode will return more errors than having it off, but having the errors show can help you understand some overlooked parts of your code.

## Comments

Comments in DUM are typed using a double forward slash `//`. Every character until a newline character is found is considered a comment and will not be evaluated.

## Strict mode examples and errors

### Math

- Dividing by zero will error rather than return NaN
- Running numeric operations on non-numeric values will error, even with strict mode off.

### Native Functions

- Native functions such as `evaluate`, `evalFile`, and `readFile` can all be affected by strict mode (primarily just to run evalFile in strict mode).

Now that you understand how strict mode works, it is recommended to use as it may better your code/cause it to break less often. This can be achieved by simply adding the follwoing to the top of your code.

```typescript
"strict on";
```

Strict mode is off by default, but if you have it on in one place and you want it disabled in another, you can run the following:

```typescript
"strict off";
```

It is also recommended that if you don't want to use strict mode, adding `strict off` can help clarify.

## Variables

Create a new file, preferrably ending in `.dum` or `.dumb`.
For example purposes, my file will be called `example.dum`.
In your .dum file, you can start by declaring a variable just like you would in JavaScript.

example.dum

```typescript
"strict on";
let foo = "String Value"
```

In order to see the value of `foo`, you can use the global native function `print`.

```typescript
"strict on";
let foo = "String Value"
print(foo) // Expected - '"String Value"'
```

You can also change the value of variables, as long as you used `let` and not `const`.

```typescript
"strict on";
let foo = "String Value"
print(foo) // Expected - '"String Value"'
foo = "Different Value"
print(foo) // Expected - '"Different Value"'
```

If you try changing a constant variable, you will see an error.

```typescript
"strict on";
const foo = "String Value"
print(foo) // Expected - '"String Value"'
foo = "Different Value" // Expected error: Cannot reassign constant variables: foo
```

## Functions

Functions in DUM are declared similarly to JavaScript, with a `function` keyword, name, list of parameters, braces `{` `}`, and code inside. You can call these functions by their name. Calling a function and using the wrong amount of arguments will result in an error.

example.dum

```typescript
"strict on";
function foo(i) {
    print(i)
}

foo(10) // Prints 10
foo("abc") // Prints abc
foo() // Errors
foo(10, "abc") // Errors
```

Something about function parameters is how without strict mode, when you use the variable it will use the function. In strict mode, it will error.

Strict mode on:

```typescript
"strict on"; // enable strict mode
const i = 5
// The function below will error for
// declaring a variable with a used name
function abc(i) {
    print(i)
}
abc(10)
```

Strict mode off:

```typescript
"strict off";
const i = 5
function abc(i) {
    print(i) // will print the parameter because it's in a lower scope
}
abc(10)
```

## For loops, While loops, and If Statemenets

What do those 3 statements have in common? They run code only if a certain condition is true.
Neither for loops, while loops, nor if statements are controlled by strict mode.
Let's look at how to declare these.

### For loops

For loops are the most complicated of the 3, as its condition has 3 parts.

- A variable to keep track of
- A condition, usually involving the variable
- An iterator, or an action that happen before each loop

These 3 parts are seperated by semicolons `;` and are used to keep track of the variable and its progress throughout the loop.

For loops, while loops, and if statements

```typescript
"strict on"; // This doesn't affect the loop

for (
    let i = 0;
    i < 10;
    i=i+1
) {
    print(i) // Expected: 0, 1, 2, 3, 4, 5, 6, 7, 8, 9
}
```

### While loops

While loops are extremely similar to for loops, except for that they don't have a variable. These loops are for loops, except only the condition.

```typescript
"strict on"; // This doesn't affect the loop
while (true) {
    print("This will repeat infinitely!")
}
```

The loop above runs the contents (the print) every time that true is true. This is a terrible idea and will eventually break your computer.
You can create a for loop using a while loop, even though it might not be as clean as a for loop, like so:

```typescript
"strict on"; // This doesn't affect the loop
let i = 0 // has to be non-constant, of course
while (i < 10) {
    print(i)
    i = i + 1
}
```

### If Statements

Similar to every other language to ever exist, if statements run code once if something is true. If statements can be run inside loops, functions, or other if statements.

```typescript
"strict on";
let i = 0
while (i < 10) {
    if (i % 2 == 0) {
        print(i+" is divisible by 2!") // Expected: 0, 2, 4, 6, 8
    }
    i = i + 1
}
```

## Objects and Arrays

Objects can be defined using braces `{` `}` and arrays use brackets `[` `]`.
Object properties and array elements are seperated using commas `,`.

If you want to declare a property on an object after an existing variable, you can simply put the name of the variable and it will be evaluated as a key and a value.

Example:

```typescript
let i = 5
const object = {
    abc: 123,
    def: 456,
    i,
    recursion: {
        ghi: 789
    },
    array: [
        123
    ]
}

// Expected
// {
//    abc: 123,
//    def: 456,
//    i: 5,
//    recursion: {
//       ghi: 789
//    },
//    array: [
//      123
//    ]
// }
print(object)
```

Arrays are 1D lists of values, and so they can be declared like one.
Arrays can include objects and other arrays.

```typescript
let i = 5
const array = ["abc", 123, i, {hi:"abc"}, [1,2,3]]

// Expected
// [ "abc", 123, 5, {hi:"abc"}, [ 1, 2, 3 ] ]
print(array)
```

## Global Variables

There are few yet very useful native variables and functions that can be used to add more functionality to your code. Here is one example of the `time` function in action.

Is It UTC Christmas?

```typescript
let currTime = time() // Returns unix timestamp, in milliseconds
if (currTime > 1703484000) { // Past 12/24/24
    if (currTime < 1703570400) { // Before 12/26/24
        print("It's christmas day!")
    }
}
```

The other global native functions are evaluate, eval, evalFile, prompt, and readFile, named respectively after their purpose.

readFile()

```typescript
print(readFile("letter.txt")) // Read text content of file.
// Errors if the inputed directory does not exist or it is not text.
```

evaluate()

```typescript
while (true) {
    let code = prompt("give some code >")
    if (code == "exit") {
        break
    }
    evaluate(prompt)
}
```

evalFile() - Slightly different than evaluate(readFile) (we'll talk about it in [Modules](#modules))

```typescript
evalFile("code.dum")
evaluate(readFile("code.dum")) 
```

There are very few global variables that run functions related to its name, i.e. Object.
Note that running Object.keys() on an array will error in strict mode, but return the values in the array. Object.values() on an array will return the array(because arrays are just that- only values).

```typescript
const object = {
    abc: 123,
    def: 456,
    i: 5,
    recursion: {
        ghi: 789
    },
    array: [
        123
    ]
}
// Expected
// [ "abc", "def", "i", "recursion", "array" ]
print(Object.keys(object))
// Expected
// [ 123, 456, 5, { ghi: 789 }, [ 123 ] ]
print(Object.values(object))
```

The other global variable is `DUM`, mainly used for modules.

## Modules

You can export code to other files using the global `DUM.exports`.

In a main module, you can import using the `evalFile` global function. evalFile returns the value of `DUM.exports` by the time the file is done evaluating, unlike `evaluate(readFile)` which simply evaluates the code and doesn't return exports.

superCoolNumber.dum

```typescript
let abc = 1 / 2
DUM .exports = abc
```

main.dum

```typescript
const superCoolNumber = evalFile("superCoolNumber.dum")
print(superCoolNumber) // Expected 0.5
```
