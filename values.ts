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
	type: "return";
	value?: RuntimeValue;
}

export interface BreakValue extends RuntimeValue {
	type: "break";
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
	env: Environment
) => RuntimeValue; // makes it asynchronous for some reason (frick you typescript)
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

export function convert_to_object(value: ObjectValue) {
    const result = {}
    value.properties.forEach((value, key)=>{
        Object.assign(result,{[key]:convert_to_native(value)})
    })
    return result
}

export function convert_to_array(value: ArrayValue) {
    const result = []
    value.elements.forEach(value=>{
        result.push(convert_to_native(value))
    })
}

export function convert_to_native(value: RuntimeValue) {
        switch (value.type) {
            case "array":
                return (convert_to_array(value as ArrayValue))
            case "object":
                return (convert_to_object(value as ObjectValue))
            case "boolean":
                return ((value as BooleanValue).value)
            case "function":
                return ((value as FunctionValue).name??"anonymous function")
            case "native-function":
                return ("native function")
            case "null":
                return (null)
            case "number":
                return ((value as NumberValue).value)
            case "string":
                return (`"${(value as StringValue).value}"`)
        }
}

export function convert_to_boolean(value: RuntimeValue) {
	switch (value.type) {
        case "boolean":
            return (value as BooleanValue).value
        case "array":
            return (value as ArrayValue).elements.length>0
        case "function":
            return (value as FunctionValue).body.length>0 // return if function is empty (never)
        case "native-function":
            return true // every native function does *something*
        case "null":
            return false
        case "number":
            return (value as NumberValue).value!==0 // any less, any more, is true
        case "object":
            return (value as ObjectValue).properties.size>0
        case "string":
            return (value as StringValue).value!==""
        case "break":
            // This should never be evaluated, so lets error.
            throw "how do you convert the keyword break into a boolean?"
        case "return":
            throw "how do you convert the keyword return into a boolean?"
        default:
            return false // until more values are created and added
    }
}
