// deno-lint-ignore-file
import { NullLiteral, Statement } from "../compile/ast.ts";
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
    | "method"
    | "class"
    | "class-property"
	| "native-function";

export interface RuntimeValue {
	type: ValueType;
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

export interface ClassValue extends RuntimeValue {
    type: "class",
    superClass: ClassValue; // ¯\_(ツ)_/¯
    properties: Map<string, RuntimeValue>,
    privateProperties: Set<string> // Define which properties/methods are private; all others are public.
}

export interface ArrayValue extends RuntimeValue {
	type: "array";
	elements: RuntimeValue[];
}

export type FunctionCall = (
	args: RuntimeValue[],
	env: Environment,
    strictMode: boolean
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

export function convert_to_object(value: ObjectValue):Object {
    const result = {}
    value.properties.forEach((value, key)=>{
        Object.assign(result,{[key]:convert_to_native(value)})
    })
    return result
}

export function convert_to_array(value: ArrayValue):Array<any> {
    const elements: any[] = []
    value.elements.forEach(value=>elements.push(convert_to_native(value)))
    return elements
}

export function convert_to_native(value: RuntimeValue) {
        switch (value.type) {
            case "array":
                return convert_to_array(value as ArrayValue)
            case "object":
                return convert_to_object(value as ObjectValue)
            case "boolean":
                return (value as BooleanValue).value
            case "function":
                return `${(value as FunctionValue).name??""}`
            case "native-function":
                return "native function code"
            case "null":
                return null
            case "number":
                return (value as NumberValue).value
            case "string":
                return `"${(value as StringValue).value}"`
        }
}

export function convert_to_boolean(value: RuntimeValue) {
	switch (value.type) {
        case "boolean":
            return (value as BooleanValue).value
        case "array":
            return (value as ArrayValue).elements.length>0
        case "function":
            return (value as FunctionValue).body.length>0 // return if function is empty (hopefully never)
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
        default:
            return false // until more values are created and added
    }
}
