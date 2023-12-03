# DUM Documentation

## Overview

DUM is a programming language that can run basic programs that you can probably make in JavaScript or Python (if you cut corners...)
Link to README [here](./README.md), and link to a therapist [here](https://betterhelp.com).

### What can DUM do?

DUM can do what many other languages can do, at least in principle. For example, it can:

- Create and refer to variables
- Create and refer to functions
- Do basic math

However, before learning DUM, you need to understand "strict mode". Strict mode restricts how much predicting and how much freedom your code can get. Strict mode will return more errors than having it off, but having the errors show can help you understand some overlooked parts of your code.

## Comments

Comments in DUM are typed using a double forward slash `//`. Every character until a newline symbol (`\r` or `\n`) is found is considered a comment and will not be evaluated.

## Strict mode examples and errors

### Math

- Dividing by zero will error rather than return NaN
- Running numeric operations on non-numeric values will error, even with strict mode off. (other than string concatinations)

### Native Functions

- Native functions such as `evaluate` and `evalFile` will run the code in strict mode, even if the code doesn't contain "strict on". (this can be turned off)

Now that you understand how strict mode works, it is recommended to use as it may better your code/cause it to break less often. This can be achieved by simply adding the follwoing to the top of your code.

```typescript
"strict on";
```

Strict mode is off by default, but if you have it on in one place and you want it disabled in another, you can run the following:

```typescript
"strict off";
```

Even though it is off by default, it is recommended that you type "strict off" anyway just to clarify readers of your code.

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

Functions in DUM are declared similarly to JavaScript, with a `function` keyword, a function name, list of parameters, and braces `{` `}` containing your code inside. You can call these functions by their name,, followed by parenthesis containing arguments. Calling a function and using the wrong amount of arguments will result in an error.

example.dum

```typescript
"strict on";
function foo(i) {
    print(i)
}

foo(10) // Prints 10
foo("abc") // Prints abc
// Errors in strict mode,
// but sends null to the
// function in normal mode
foo()
foo(10, "abc") // Errors every time
```

Keep in mind that if you name a parameter after an already-declared variable in a higher scope, it will use the one passed in the function rather than the higher-scoped definition.

However, in strict mode, it will simply error as if you were revaluing a constant.

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
abc(10) // Expected to print '10' in the console
```

## For loops, While loops, and If Statemenets

What do those 3 statements have in common? They run code only if a certain condition is true.
Neither for loops, while loops, nor if statements' behavior is affected by strict mode.
Let's look at how to declare these.

### For loops

For loops are the most complicated of the three, as its condition has 3 parts.

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

The loop above runs the contents (the print) every time that `true`` is true. This is a terrible idea and will pprobably break or at least lag your computer.
You can create a for loop using a while loop, even though it might not be as clean as a for loop, like so:

```typescript
"strict on"; // This doesn't affect the loop
let i = 0 // has to be non-constant, of course
while (i < 10) {
    print(i)
    i = i + 1
} // Expected 0, 1, 2, 3, 4, 5, 6, 7, 8, 9
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

Is It Christmas?

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
Importing code from other files is as easy as calling the global [evalFile( )](#global-variables) and passing the location of the module into it.

superCoolNumber.dum

```typescript
let reallyAwesomeNumber = 123
DUM .exports = reallyAwesomeNumber
```

main.dum

```typescript
const superCoolNumber = evalFile("superCoolNumber.dum")
print(superCoolNumber) // Expected 123
```

## Classes

Making classes in DUM is probably one of the most advanced things you can do in this language. While DUM is not exactly object-oriented, it is not impossible to create simple classes.

Sections:

- [Public/Private Relationships](#publicprivate-variables-and-functions)
- [Constructors](#constructor)
- [Creating A Class](#creating-a-class)

### Public/Private Variables and Functions

Unlike regular variables, using let and const in the global scope, a class is its own scope with `private let` and `public const`.
Declaring a variable or function in a class must declare its publicity, except for the [constructor function](#constructor).

As a bonus, in functions you can `return this`, which allows chaining of methods.

Example:

```ts
class foo {
    public const bar = 12
    private let foobar = 34 // Must be referenced with "this"
    let barfoo = 56 // Parser error

    public function addOne() {
        this.foobar++
        print(this.foobar)
        return this // foo.addOne().addOne().addOne() ...
    }

    function abc() { // Parser error
        print("How did we get here?")
    }
}
```

### Constructor

Constructors for classes in DUM are not "public" or "private" like [variables and functions](#publicprivate-variables-and-functions), but instead are left completely blank(other than the name).

For those who don't know, a class' constructor is a function that is run when your code is [instantiated](#creating-a-class) using `new Example()`. It is typically used for setting variables in the class or getting it ready for use.

As mentioned before, constructors in DUM are declared like regular functions but don't use "public" or "private".

Example:

```ts
class foo {
    public const bar = 12
    private let foobar = 34
    let barfoo = 56 // Parser error

    public function addOne() {
        this.foobar++
        print(this.foobar)
        return this // foo.addOne().addOne().addOne() ...
    }

    function abc() { // Parser error
        print("How did we get here?")
    }

    function constructor(foobar) { // No publicity type, no error
        this.foobar = foobar;
    }
}
```

### Creating a Class

Instantiating a class in DUM is actually quite easy. Just like in JavaScript or TypeScript, classes can easily be constructed using the `new` keyword.

Example:

```ts
class foo {
    public const bar = 12
    private let foobar = 34
    let barfoo = 56 // Parser error

    public function addOne() {
        this.foobar++
        print(this.foobar)
        return this // foo.addOne().addOne().addOne() ...
    }

    function abc() { // Parser error
        print("How did we get here?")
    }

    function constructor(foobar) { // No publicity type, no error
        this.foobar = foobar;
    }
}

// ---------------------------------

// This is all it takes!
let bar = new foo(345) // Runs foo.constructor(345)
bar.addOne() // Runs foo.addOne()
print(bar.bar) // 12
```

### Recap: Classes

Classes in DUM, while being one of the hardest things to implement(you, the user and me, the developer of DUM) is not as hard as you think.

Creating a class only needs 2 words: `class Example { }`

Adding methods or properties to a class requires the use of `public` or `private` before its constructor keyword (`let`, `const`, or `function`)

Creating a constructor to your class, or the method that is called when you instantiate it requires that you DON'T use `public` or `private`.

Instantiating a class only needs 2 words again: `new Example()`.
Passing arguments through `new Example()` will be used as paramters for `Example.constructor`.

With all of that being said, you can now create classes in DUM!

## Recap: DUM
