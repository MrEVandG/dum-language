import { NullLiteral, Statement } from "./ast.ts";
import Environment from "./environment.ts";
// "Primitive" Types
export type ValueType =
	| "null"
	| "number"
	| "string"
	| "boolean"
	| "object"
	| "array"
	| "function"
    | "break"
    | "return"
	| "native-function";

export interface RuntimeValue {
	type: ValueType;
}

export interface ReturnValue extends RuntimeValue {
    type: "return",
    value?: RuntimeValue
}

export interface BreakValue extends RuntimeValue {
    type: "break"
}

export interface NullValue extends RuntimeValue {
	type: "null";
	value: "null";
}

export interface NumberValue extends RuntimeValue {
	type: "number";
	value: number; // duh
}

export interface StringValue extends RuntimeValue {
	type: "string";
	value: string; // duh
}

export interface BooleanValue extends RuntimeValue {
	type: "boolean";
	value: boolean; // duh
}

export interface ObjectValue extends RuntimeValue {
	type: "object";
	properties: Map<string, RuntimeValue>;
}

export interface ArrayValue extends RuntimeValue {
	type: "array";
	elements: RuntimeValue[];
}

export type FunctionCall = (
    args: RuntimeValue[],
    env: Environment,
) => RuntimeValue // makes it asynchronous for some reason (frick you typescript)
export interface NativeFunctionValue extends RuntimeValue {
	type: "native-function";
	call: FunctionCall;
}

export interface FunctionValue extends RuntimeValue {
	type: "function";
	name?: string;
	parameters: string[];
	declarationEnv: Environment;
	body: Statement[];
	async: boolean;
}
export function make_native_function(call: FunctionCall): NativeFunctionValue {
	return { type: "native-function", call } as NativeFunctionValue;
}
// make functions

export function make_null(): NullValue {
	return { type: "null", value: "null" } as NullValue;
}
export function make_null_literal(): NullLiteral {
	return { kind: "NullLiteral", value: null } as NullLiteral;
}
export function make_string(value: string): StringValue {
	return { type: "string", value } as StringValue;
}

export function make_number(value: number): NumberValue {
	return { type: "number", value } as NumberValue;
}

export function make_boolean(value: boolean): BooleanValue {
	return { type: "boolean", value } as BooleanValue;
}

export function convert_to_boolean(value:RuntimeValue) {
    if (value.type=="null"||(value as NumberValue).value==0||(value as BooleanValue).value==false||(value as StringValue).value=="") {
        // empty string, null, false, and 0 are all considered "falsey"
        return false
    }
    return true
}