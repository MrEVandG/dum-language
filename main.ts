// deno-lint-ignore-file
import Environment from "./environment.ts";
import { evaluate } from "./interpreter.ts";
import Parser from "./parser.ts";
import { tokenize } from "./tokenizer.ts";
import {
	make_number,
	make_boolean,
	make_null,
	make_native_function,
	RuntimeValue,
	StringValue,
	convert_to_native,
} from "./values.ts";

// If enabled will fill your console, but gives important tips on when and where things are happening.
// Primarily shows when code is passed from lexer to parser to interpreter.
const DEBUG_MODE = false;

const globalEnv = new Environment();
const parser = new Parser();
// NATIVE VARIABLES AND FUNCTIONS (GLOBAL ENVIRONMENT)
globalEnv.declareVariable("true", make_boolean(true), true);
globalEnv.declareVariable("false", make_boolean(false), true);
globalEnv.declareVariable("null", make_null(), true);
globalEnv.declareVariable(
	"print",
	make_native_function((args: RuntimeValue[], env: Environment) => {
		for (const arg of args) {
			console.log(convert_to_native(arg));
		}
		return make_null();
	}),
	true
);
globalEnv.declareVariable(
	"time",
	make_native_function((_args: RuntimeValue[], _env: Environment) => {
		return make_number(Date.now());
	}),
	true
);
globalEnv.declareVariable(
	"evalFile",
	make_native_function((args: RuntimeValue[], env: Environment) => {
		if (args.length > 1) {
			throw "cannot run more than 1 file at a time";
		}
		if (args.length < 1) {
			throw "what am i supposed to run?";
		}
		if (args[0].type !== "string") {
			throw "i cant find a path to a file that isnt a string";
		}
		const data = Deno.readTextFileSync((args[0] as StringValue).value);
		return evaluate(parser.produceAST(data, DEBUG_MODE), new Environment(env));
	}),
	true
);
globalEnv.declareVariable(
	"readFile",
	make_native_function((args: RuntimeValue[], _env: Environment) => {
		if (args.length > 1) {
			throw "cannot run more than 1 file at a time";
		}
		if (args.length < 1) {
			throw "what am i supposed to read?";
		}
		if (args[0].type !== "string") {
			throw "i cant find a path to a file that isnt a string";
		}
		const data = Deno.readTextFileSync((args[0] as StringValue).value);
		return { type: "string", value: data } as StringValue;
	}),
	true
);
globalEnv.declareVariable(
	"evaluate",
	make_native_function((args: RuntimeValue[], env: Environment) => {
		for (const arg of args) {
			if (arg.type !== "string") {
				throw "if you're going to evaluate something, it has to be a string";
			}
		}
		return evaluate(parser.produceAST(args.join(" "), false), new Environment(env)); // so you can, for example, change the contents of a variable
	}),
	true
);
globalEnv.declareVariable(
	"prompt",
	make_native_function((args: RuntimeValue[], env: Environment) => {
		for (const arg of args) {
			if (arg.type !== "string") {
				throw "if you give multiple arguments, they're gonna be combined into one. make sure the args you DO pass are strings.";
			}
		}
		return {
			type: "string",
			value: prompt(
				"prompt (never enter passwords): " +
					args.map((arg) => (arg as StringValue).value).join(" ")
			),
		} as StringValue;
	}),
	true
);
function repl() {
	const mode = parseInt(
		(
			prompt(
				"What mode would you like? (1:tokens,2:ast,3:result) owo 👉"
			) ?? "3"
		).trim()
	);
	if (isNaN(mode) || mode > 3 || mode < 1) {
		console.log("that number is out of bounds or not a number.");
		repl();
	}
	if (mode == 2) {
		console.log(
			JSON.stringify(
				parser.produceAST(
					Deno.readTextFileSync(prompt("file name") ?? "code.dum"),
					false
				),
				null,
				2
			)
		);
	}
	while (true) {
		const input = prompt("enter some code 👉") ?? "";
		if (["cls", "", "exit", "exit()"].includes(input)) {
			throw "sorry to see you go";
		}
		if (mode == 1) {
			console.log(tokenize(input, DEBUG_MODE));
		} else if (mode == 2) {
			console.log(JSON.stringify(parser.produceAST(input, DEBUG_MODE)));
		} else if (mode == 3) {
			evaluate(parser.produceAST(input, DEBUG_MODE), globalEnv);
		}
	}
}

repl();
