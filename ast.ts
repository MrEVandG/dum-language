// deno-lint-ignore-file no-empty-interface

export type NodeType =
	| "Program"
	// Literals
	| "Identifier"
	| "NumericLiteral"
	| "NullLiteral"
	| "StringLiteral"
	| "ObjectLiteral"
	| "ArrayLiteral"
	| "ForLoopCondition"
	| "Property"
	// Statements
	| "IfStatement"
	| "ForLoopStatement"
	| "WhileLoopStatement"
    | "BreakStatement"
	| "ReturnStatement"
    // Expressions
	| "MemberExpression"
	| "ReassignmentExpression"
	| "VariableDeclaration"
	| "BinaryExpression"
	| "CallExpression"
	| "FunctionDeclaration";

export interface Statement {
	// will never be used for its direct use - like an abstract class
	kind: NodeType;
}

export interface Program extends Statement {
	kind: "Program";
	body: Statement[];
}

export interface Expression extends Statement {} // expands the tree for seperations of statements/expressions

export interface BinaryExpression extends Expression {
	kind: "BinaryExpression";
	left: Expression;
	right: Expression;
	operator: string;
}

export interface Identifier extends Expression {
	kind: "Identifier";
	symbol: string;
}

export interface NumericLiteral extends Expression {
	kind: "NumericLiteral";
	value: number; // duh
}

export interface NullLiteral extends Expression {
	kind: "NullLiteral";
	value: null; // duh
}

export interface StringLiteral extends Expression {
	kind: "StringLiteral";
	value: string; // obviously
}

export interface VariableDeclaration extends Statement {
	kind: "VariableDeclaration";
	constant: boolean;
	identifier: string;
	value?: Expression;
}

export interface FunctionDeclaration extends Statement {
	kind: "FunctionDeclaration";
	parameters: string[];
	name?: string;
	body: Statement[];
	async: boolean;
}

export interface ReturnStatement extends Statement {
	kind: "ReturnStatement";
	value: Expression;
}
export interface BreakStatement {
    kind: "BreakStatement"
}
export interface ForLoopStatement extends Statement {
	kind: "ForLoopStatement";
	condition: Expression;
    variable: VariableDeclaration;
    iterator: ReassignmentExpression;
	body: Statement[];
}

export interface WhileLoopStatement extends Statement {
	kind: "WhileLoopStatement";
	condition: Expression;
	body: Statement[];
}

export interface IfStatement extends Statement {
	kind: "IfStatement";
	condition: Expression; // more specifically a boolean value
	body: Statement[];
}

export interface ReassignmentExpression extends Expression {
	kind: "ReassignmentExpression";
	target: Expression;
	value: Expression;
}

export interface ObjectLiteral extends Expression {
	kind: "ObjectLiteral";
	properties: Property[];
}

export interface ArrayLiteral extends Expression {
	kind: "ArrayLiteral";
	elements: Expression[];
}

export interface Property extends Expression {
	kind: "Property";
	key: string; // never different
	value?: Expression;
}

export interface CallExpression extends Expression {
	kind: "CallExpression";
	arguments: Expression[];
	target: Expression;
}

export interface MemberExpression extends Expression {
	kind: "MemberExpression";
	object: Expression;
	property: Expression;
	computed: boolean; // Use brackets to get property or not
}