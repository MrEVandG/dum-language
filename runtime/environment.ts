import { evaluate } from "./interpreter.ts";
import Parser from "../compile/parser.ts";
import {
	ArrayValue,
	ObjectValue,
	RuntimeValue,
	StringValue,
	convert_to_native,
	make_boolean,
	make_native_function,
	make_null,
	make_number,
	make_string,
} from "./values.ts";

export default class Environment {
	public parent?: Environment;
	private variables: Map<string, RuntimeValue>;
	private constantVariables: Set<string>;
	constructor(parent?: Environment) {
		this.parent = parent;
		this.variables = new Map();
		this.constantVariables = new Set();
	}

	public declareGlobalFunctions(
		parser: Parser,
		DEBUG_MODE: boolean
	): Environment {
		if (DEBUG_MODE) {
			console.log("declaring global environment variables");
			console.time("setupEnvironment");
		}
		this.declareVariable("true", make_boolean(true), true, true);
		this.declareVariable("false", make_boolean(false), true, true);
		this.declareVariable("null", make_null(), true, true);
		this.declareVariable(
			"print",
			make_native_function(
				(
					args: RuntimeValue[],
					_env: Environment,
					_strictMode: boolean
				) => {
					for (const arg of args) {
						console.log(convert_to_native(arg));
					}
					return make_null();
				}
			),
			true,
			true
		);
		this.declareVariable(
			"time",
			make_native_function(
				(
					_args: RuntimeValue[],
					_env: Environment,
					_strictMode: boolean
				) => {
					return make_number(Date.now());
				}
			),
			true,
			true
		);
		this.declareVariable(
			"evalFile",
			make_native_function(
				(
					args: RuntimeValue[],
					env: Environment,
					strictMode: boolean
				) => {
					if (args.length > 1) {
						throw "cannot run more than 1 file at a time";
					}
					if (args.length < 1) {
						throw "what am i supposed to run?";
					}
					if (args[0].type !== "string") {
						throw "i cant find a path to a file that isnt a string";
					}
					const data = Deno.readTextFileSync(
						(args[0] as StringValue).value
					);
					return evaluate(
						parser.produceAST(data, DEBUG_MODE),
						new Environment(env),
						strictMode
					);
				}
			),
			true,
			true
		);
		this.declareVariable(
			"readFile",
			make_native_function(
				(
					args: RuntimeValue[],
					_env: Environment,
					_strictMode: boolean
				) => {
					if (args.length > 1) {
						throw "cannot run more than 1 file at a time";
					}
					if (args.length < 1) {
						throw "what am i supposed to read?";
					}
					if (args[0].type !== "string") {
						throw "i cant find a path to a file that isnt a string";
					}

					const data = Deno.readTextFileSync(
						(args[0] as StringValue).value
					);
					return { type: "string", value: data } as StringValue;
				}
			),
			true,
			true // Strict mode, although constant variables don't really matter for this...
		);
		this.declareVariable(
			"evaluate",
			make_native_function(
				(
					args: RuntimeValue[],
					env: Environment,
					strictMode: boolean
				) => {
					for (const arg of args) {
						if (arg.type !== "string") {
							throw "if you're going to evaluate something, it has to be a string";
						}
					}
					return evaluate(
						parser.produceAST(args.join(" "), false),
						new Environment(env),
						strictMode
					); // so you can, for example, change the contents of a variable
				}
			),
			true,
			true
		);
		this.declareVariable(
			"prompt",
			make_native_function(
				(
					args: RuntimeValue[],
					_env: Environment,
					_strictMode: boolean
				) => {
					for (const arg of args) {
						if (arg.type !== "string") {
							throw "if you give multiple arguments, they're gonna be combined into one. make sure the args you DO pass are strings.";
						}
					}
					return {
						type: "string",
						value: prompt(
							"prompt (never enter passwords): " +
								args
									.map((arg) => (arg as StringValue).value)
									.join(" ")
						),
					} as StringValue;
				}
			),
			true,
			true
		);
		this.declareVariable(
			"Object",
			{
				type: "object",
				properties: new Map<string, RuntimeValue>()
					.set(
						"has",
						make_native_function(
							(
								args: RuntimeValue[],
								_env: Environment
							): RuntimeValue => {
								if (args.length < 2) {
									throw `cannot run "has" function without object and key`;
								}
								if (args.length > 2) {
									throw `cannot run "has" on multiple objects. use a for loop to check each one or use "hasAll"`;
								}
								if (args[0].type === "object") {
									throw `cannot run "has" function on object without knowing what the key is`;
								}
								if (args[0].type !== "string") {
									throw "the key to search for has to be a string";
								}
								for (const obj of args.slice(1)) {
									if (
										(obj as ObjectValue).properties.has(
											(args[0] as StringValue).value
										)
									) {
										return make_boolean(true);
									}
								}
								return make_boolean(false);
							}
						)
					)
					.set(
						"allHas",
						make_native_function(
							(
								args: RuntimeValue[],
								_env: Environment
							): RuntimeValue => {
								if (args[0].type !== "string") {
									throw `cannot run "has" function on object without knowing what the key is`;
								}
								const objects = args.slice(1);
								for (const obj of objects) {
									if (obj.type !== "object") {
										throw `cannot run "has" function on a ${obj.type}`;
									}
								}
								return make_boolean(
									objects.every((value) =>
										(value as ObjectValue).properties.has(
											(args[0] as StringValue).value
										)
									)
								);
							}
						)
					)
					.set(
						"keys",
						make_native_function(
							(
								args: RuntimeValue[],
								_env: Environment
							): RuntimeValue => {
								if (args.length > 1) {
									throw "cannot check multiple objects keys (use a for loop instead)";
								}
								if (args.length < 1) {
									throw `cannot check for keys without an object to check on`;
								}
								if (args[0].type !== "object") {
									throw `cannot check for keys on a ${args[0].type}`;
								}
								const elements: StringValue[] = [];
								(args[0] as ObjectValue).properties.forEach(
									(_value, key) => {
										elements.push(make_string(key));
									}
								);
								return {
									type: "array",
									elements,
								} as ArrayValue;
							}
						)
					)
					.set(
						"values",
						make_native_function(
							(
								args: RuntimeValue[],
								_env: Environment
							): RuntimeValue => {
								if (args.length > 1) {
									throw "cannot check multiple objects' values";
								}
								if (args.length < 1) {
									throw `cannot check for values without an object to check on`;
								}
								if (args[0].type !== "object") {
									throw `cannot check for values on a ${args[0].type}`;
								}
								const elements: RuntimeValue[] = [];
								(args[0] as ObjectValue).properties.forEach(
									(value) => {
										elements.push(value);
									}
								);
								return {
									type: "array",
									elements,
								} as ArrayValue;
							}
						)
					),
			} as ObjectValue,
			true,
			true
		);
		this.declareVariable(
			"DUM",
			{
				type: "object",
				properties: new Map<string, RuntimeValue>(),
			} as ObjectValue,
			true,
			true
		);
		if (DEBUG_MODE) {
			console.timeEnd("setupEnvironment");
			console.log("Environment done setting up");
		}
		return this;
	}

	public declareVariable(
		name: string,
		value: RuntimeValue,
		constant: boolean,
		strictMode: boolean
	): RuntimeValue {
		if (this.variables.has(name) && strictMode) {
			throw `${name} is already defined`;
		}
		this.variables.set(name, value);
		if (constant) {
			this.constantVariables.add(name);
		}
		return value;
	}

	public reassignVariable(name: string, value: RuntimeValue): RuntimeValue {
		if (this.constantVariables.has(name)) {
			throw `Cannot reassign constant variables: ${name}`;
		}
		this.findVariable(name).variables.set(name, value);
		return value;
	}

	public findVariable(name: string, ): Environment {
		if (this.variables.has(name)) {
			return this;
		}
		if (this.parent == undefined) {
			throw `Cannot find ${name} in any environment. Change the name, owo`;
		}
		return this.parent.findVariable(name);
	}

	public valueOfVariable(name: string): RuntimeValue {
		return this.findVariable(name).variables.get(name) as RuntimeValue;
	}
}
