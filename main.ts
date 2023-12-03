//- Rework time!!!
//- Implement some sort of basic "CLI" such as "tokenize", "ast", "evaluate", "run", or no parameters at all for a repl

import Parser from "./compile/parser.ts";
import { token_array_to_json, tokenize } from "./compile/tokenizer.ts";
import Environment from "./runtime/environment.ts";
import { evaluate } from "./runtime/interpreter.ts";

const QUIT_KEYWORDS = ["exit", "exit()", "quit", "quit()", ""];

// FLAGS
const args = structuredClone(Deno.args); // I hate javascript "references." They suck.
let DEBUG_MODE = false;
for (let i = 0; i < args.length; i++) {
    if (
        [
            "--debug-mode",
            "-debug-mode",
            "--debug-on",
            "-debug-on",
            "--debug-mode-on",
            "-debug-mode-on",
        ].includes(args[i].toLowerCase())
    ) {
        DEBUG_MODE = true;
        args.splice(i, 1); // good enough 👍
    }
}
console.log("------FLAGS------");
console.log("DEBUG MODE: " + DEBUG_MODE); //: true or false

// CLI commands
if (args[0] == "tokenizefile" || Deno.args[0] == "tfile") {
    const filename = args.slice(1).join(" ");
    console.log("TARGET FILE TOKENS(relative path): " + filename);
    console.log(token_array_to_json(tokenize(Deno.readTextFileSync(filename), DEBUG_MODE)));
} else if (args[0] == "tokenizeline" || args[0] == "tline") {
    while (true) {
        const input = prompt("Tokenize >") ?? "";
        console.log(token_array_to_json(tokenize(input, DEBUG_MODE)));
        if (QUIT_KEYWORDS.includes(input.trim().toLowerCase())) {
            console.log("Tokenized, but still exiting.");
            break;
        }
    }
} else if (args[0] == "astfile" || args[0] == "afile") {
    const parser = new Parser();
    const filename = args.slice(1).join(" ");
    console.log("TARGET FILE AST(relative path): " + filename);
    console.log(
        JSON.stringify(parser.produceAST(Deno.readTextFileSync(filename), DEBUG_MODE), null, 2)
    );
} else if (args[0] == "astline" || args[0] == "aline") {
    const parser = new Parser();
    while (true) {
        const input = prompt("AST >") ?? "";
        console.log(JSON.stringify(parser.produceAST(input, DEBUG_MODE)),null,2);
        if (QUIT_KEYWORDS.includes(input.trim().toLowerCase())) {
            console.log("Parsed, but still exiting.");
            break;
        }
    }
} else if (
    args[0] == "evaluatefile" ||
    args[0] == "evalfile" ||
    args[0] == "efile" ||
    args[0] == "run"
) {
    const parser = new Parser(); // Still need one of these for the job ¯\_(ツ)_/¯
    const filename = args.slice(1).join(" ");
    const env = new Environment();
    env.declareGlobalFunctions(parser, DEBUG_MODE); // don't ask why i need these 2 parameters
    console.log("TARGET FILE EVALUATE(relative path): " + filename);
    console.log("DUM.exports =",
        JSON.stringify(
            evaluate(
                parser.produceAST(Deno.readTextFileSync(filename), DEBUG_MODE),
                env,
                false
            )
        )
    ); // Strict mode is on by default
} else if (
    args[0] == "evaluateline" ||
    args[0] == "evalline" ||
    args[0] == "eline" ||
    args[0] == ""
) {
    const parser = new Parser();
    const env = new Environment();
    env.declareGlobalFunctions(parser, DEBUG_MODE);
    while (true) {
        const input = prompt("Evaluate >") ?? "";
        if (QUIT_KEYWORDS.includes(input.trim().toLowerCase())) {
            break;
        }
        // Evaluate this stuff AFTER it's been checked for exit words
        if (DEBUG_MODE) {
            console.log("Evaluation timer started")
            console.time("evaluation")
        }
        evaluate(parser.produceAST(input, DEBUG_MODE), env, false); // strict mode off by default. Also use the same environment.
        if (DEBUG_MODE) {
            console.log("Evaluation timer started")
            console.timeEnd("evaluation")
        }
    }
} else if (args[0] == "help") {
    if (args.length == 1) {
        console.log("Help page for DUM CLI");
        console.log("Commands include:");
        console.log("tokenizefile, tfile: Tokenizes the given file");
        console.log("tokenizeline, tline: Tokenizes lines entered in a repl");
        console.log("astfile, afile: Produces AST for the given file");
        console.log("astline, aline: Produces AST for lines entered in a repl");
        console.log("evaluatefile, evalfile, efile: Evaluates the given file");
        console.log(
            "evaluateline, evalline, eline: Evaluates lines entered in a repl. This will use the same environment for each line."
        );
        console.log(
            "--debug-mode, -debug-mode, --debug-on, -debug-on, --debug-mode-on, -debug-mode-on: Enables debug mode."
        );
    } else if (["tokenizefile", "tfile"].includes(args[1].toLowerCase())) {
        console.log("Help page for TokenizeFile command");
        console.log(
            "Tokenize File (tfile for short) will return an array of tokens for the given file, entered through filename."
        );
        console.log("Usage:");
        console.log("deno run main.ts tfile foo.dum");
    } else if (["tokenizeline", "tline"].includes(args[1].toLowerCase())) {
        console.log("Help page for TokenizeLine command");
        console.log(
            "Tokenize Line (tline for short) returns an array of tokens like TokenizeFile, but tokenizes lines in a repl."
        );
        console.log("Usage:");
        console.log("deno run main.ts tline");
    } else if (["astfile", "afile"].includes(args[1].toLowerCase())) {
        console.log("Help page for ASTFile command");
        console.log(
            "AST File (afile for short) outputs an Abstract Syntax Tree based on contents of a file. An AST is basically a tree of different types of nodes that tell the interpreter what to do."
        );
        console.log("Usage:");
        console.log("deno run main.ts afile code.dum");
    } else if (["astline", "aline"].includes(args[1].toLowerCase())) {
        console.log("Help page for ASTLine command");
        console.log(
            "AST Line (aline for short) outputs an Abstract Syntax Tree for every line entered in a repl."
        );
        console.log("Usage:");
        console.log("deno run main.ts aline");
    } else if (
        ["evaluatefile", "evalfile", "efile", "run"].includes(args[1].toLowerCase())
    ) {
        console.log("Help page for EvaluateFile command");
        console.log(
            "Evaluate File (efile, evalfile, or run for short) evaluates, or runs all code in a file. If a script contains the `evalFile` global function, it will also run that file, too."
        );
        console.log("Usage:");
        console.log("deno run main.ts efile code.dum");
    } else if (
        ["evaluateline", "evalline", "eline"].includes(args[1].toLowerCase())
    ) {
        console.log("Help page for EvalutateLine command");
        console.log(
            "Evaluate Line (eline or evalline for short) evaluates code entered in a repl. This is the default functionality for the script if no arguments are passed."
        );
        console.log("Usage:");
        console.log("deno run main.ts | deno run main.ts eline");
    } else if (
        [
            "--debug-mode",
            "-debug-mode",
            "--debug-on",
            "-debug-on",
            "--debug-mode-on",
            "-debug-mode-on",
            "debug-mode",
        ].includes(args[1].toLowerCase())
    ) {
        console.log("Help page for Debug Mode")
        console.log("Debug Mode is a flag that can be activated many different ways, but has one function. Debug Mode will simply tell you how much time it takes to evaluate your code, from each step of processing and then the end result.")
        console.log("You can run Debug Mode in any command; tfile, tline, afile, aline, efile, and eline can all be timed with a stopwatch using any of the following:")
        console.log("--debug-mode, --debug-on, --debug-mode-on, -debug-mode, -debug-on, or -debug-mode-on.")
        console.log("Keep in mind that debug mode will never change the way your actual code runs. Debug Mode is a stopwatch for tokenizing, producing asts, and evaluating.")
    }
} else {
    console.log("That is not a command. Make sure you spelled it right, or check the help menu.")
    console.log("deno run main.ts help")
}