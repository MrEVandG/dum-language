import Environment from "./environment.ts";
import { evaluate } from "./interpreter.ts";
import Parser from "./parser.ts";
import { tokenize } from "./tokenizer.ts";
import {
	make_string,
	make_number,
	make_boolean,
	make_null,
	make_native_function,
	RuntimeValue,
} from "./values.ts";

const DEBUG_MODE = false;

const globalEnv = new Environment();
// GLOBAL ENVIRONMENT VARIABLES AND FUNCTIONS
globalEnv.declareVariable(
	"meth",
	make_string("Oh yeah, that's the good stuff."),
	false
);
globalEnv.declareVariable("x", make_number(45), false);
globalEnv.declareVariable("true", make_boolean(true), true);
globalEnv.declareVariable("false", make_boolean(false), true);
globalEnv.declareVariable("null", make_null(), true);
globalEnv.declareVariable(
	"print",
	make_native_function((args, _env: Environment) => {
		for (const arg of args) {
            console.log(arg)
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
async function repl() {
	const parser = new Parser();
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
	const data = await Deno.readTextFile("code.dum");
	if (data) {
		console.log("wOwOrking! ^_^");
		if (mode == 1) {
			console.log(tokenize(data, DEBUG_MODE));
		} else if (mode == 2) {
			console.log(
				JSON.stringify(parser.produceAST(data, DEBUG_MODE), null, 2)
			);
		} else if (mode == 3) {
			evaluate(parser.produceAST(data, DEBUG_MODE), globalEnv); // no console log- we already have a print() function :)
		}
        return
	} else {
		console.log("file does not exist. UwU.");
		repl();
	}
	while (true) {
		const input = prompt("repl owo 👉") ?? "";
		if (["cls", "", "exit", "exit()"].includes(input)) {
			throw "sorry to see you gowo";
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
