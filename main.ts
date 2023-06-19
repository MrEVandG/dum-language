// deno-lint-ignore-file
import Environment from "./environment.ts";
import { evaluate } from "./interpreter.ts";
import Parser from "./parser.ts";
import { tokenize } from "./tokenizer.ts";

// If enabled will fill your console, but gives important tips on when and where things are happening.
// Primarily shows when code is passed from lexer to parser to interpreter.
const DEBUG_MODE = true;

const parser = new Parser();
const globalEnv = new Environment().declareGlobalFunctions(parser, DEBUG_MODE);

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
			evaluate(parser.produceAST(input, DEBUG_MODE), globalEnv, false); // off by default, but may be edited
		}
	}
}

repl();
