import {
	RuntimeValue,
	NumberValue,
	NullValue,
	StringValue,
	make_null,
	make_number,
	make_string,
	make_boolean,
	make_null_literal,
	ObjectValue,
	NativeFunctionValue,
	FunctionValue,
	ArrayValue,
	convert_to_boolean,
	BreakValue,
	ReturnValue,
} from "./values.ts";
import {
	ArrayLiteral,
	BinaryExpression,
	BreakStatement,
	CallExpression,
	ForLoopStatement,
	FunctionDeclaration,
	Identifier,
	IfStatement,
	MemberExpression,
	NumericLiteral,
	ObjectLiteral,
	Program,
	ReassignmentExpression,
	ReturnStatement,
	Statement,
	StringLiteral,
	VariableDeclaration,
	WhileLoopStatement,
} from "./ast.ts";
import Environment from "./environment.ts";

function evaluate_numeric_binary_expression(
	left: NumberValue,
	right: NumberValue,
	operator: string,
	_env: Environment
): RuntimeValue {
	switch (operator) {
		case "+":
			return make_number(left.value + right.value);
		case "-":
			return make_number(left.value - right.value);
		case "*":
			return make_number(left.value * right.value);
		case "/":
			if (left.value == 0) {
				return make_number(0);
			}
			if (right.value == 0) {
				throw "you can't divide by zero!";
			}
			return make_number(left.value / right.value);
		case "%":
			return make_number(left.value % right.value);
		case ">":
			return make_boolean(left.value > right.value);
		case ">=":
			return make_boolean(left.value >= right.value);
		case "<":
			return make_boolean(left.value < right.value);
		case "<=":
			return make_boolean(left.value <= right.value);
		default:
			throw `interpreter: got binary operator with improper operation, got:${operator}`;
	}
}

function evaluate_variable_declaration(
	declaration: VariableDeclaration,
	env: Environment
): RuntimeValue {
	return env.declareVariable(
		declaration.identifier,
		evaluate(declaration.value ?? make_null_literal(), env),
		declaration.constant
	);
}

function evaluate_object_expression(
	obj: ObjectLiteral,
	env: Environment
): RuntimeValue {
	const object = { type: "object", properties: new Map() } as ObjectValue;
	for (const { key, value } of obj.properties) {
		const runtimeVal =
			value == undefined
				? env.valueOfVariable(key)
				: evaluate(value, env);

		object.properties.set(key, runtimeVal);
	}

	return object;
}

function evaluate_array_expression(
	arr: ArrayLiteral,
	env: Environment
): RuntimeValue {
	return {
		type: "array",
		elements: arr.elements.map((element) => evaluate(element, env)),
	} as ArrayValue;
}

function evaluate_reassignment(
	assignment: ReassignmentExpression,
	env: Environment
): RuntimeValue {
	if (assignment.target.kind !== "Identifier") {
		throw "What are you reassigning? If you want to compare equality, use a double equal sign. x == y";
	}
	const name = (assignment.target as Identifier).symbol;
	return env.reassignVariable(name, evaluate(assignment.value, env));
}

function evaluate_call_expression(
	call: CallExpression,
	env: Environment
): RuntimeValue {
	const args = call.arguments.map((argument) => evaluate(argument, env));
	const fn = evaluate(call.target, env);
	if (fn.type == "native-function") {
		return (fn as NativeFunctionValue).call(args, env);
	}
	if (fn.type == "function") {
		// user-defined function
		const func = fn as FunctionValue;
		const scope = new Environment(func.declarationEnv);
		if (func.parameters.length > args.length) {
			throw `Missing ${
				func.parameters.length - args.length
			} parameters to call function`;
		}
		for (let i = 0; i < func.parameters.length; i++) {
			scope.declareVariable(func.parameters[i], args[i], false);
		}
		let result: RuntimeValue = make_null();
		for (const statement of func.body) {
			const evaluatedStatement = evaluate(statement, scope);
			if (evaluatedStatement.type == "return") {
				// lets return!
				result =
					(evaluatedStatement as ReturnValue).value ?? make_null();
				// the "Nullish Coalescing" will never be used
				// thats what ?? is called btw
				// https://www.w3schools.com/Jsref/jsref_operators.asp#:~:text=The%20Nullish%20Coalescing%20Operator%20(%3F%3F)
				break;
			}
		}
		return result;
	}
	throw `${fn.type} is not a function`;
}

// https://stackoverflow.com/questions/35948335/how-can-i-check-if-two-map-objects-are-equal
function compareObjectValues(
	map1: Map<string, RuntimeValue>,
	map2: Map<string, RuntimeValue>
): boolean {
	let obj2Val;
	let result = true;
	if (map1.size !== map2.size) {
		return false;
	}
	map1.forEach((value, key) => {
		obj2Val = map2.get(key);
		// in cases of an undefined value, make sure the key
		// actually exists on the object so there are no false positives
		if (obj2Val !== value) {
			result = false;
		}
		if (!map2.has(key)) {
			result = false;
		}
	});
	return result;
}

function evaluate_binary_expression(
	binExpr: BinaryExpression,
	env: Environment
): RuntimeValue {
	const left = evaluate(binExpr.left, env);
	const right = evaluate(binExpr.right, env);
	const operator = binExpr.operator;
	if (operator == "==") {
		// compare using equality
		if (left.type == "object") {
			if (right.type == "object") {
				return make_boolean(
					compareObjectValues(
						structuredClone((left as ObjectValue).properties),
						structuredClone((right as ObjectValue).properties)
					)
				);
			}
			return make_boolean(false);
		}
		if (left.type == "array") {
			if (right.type == "array")
				return make_boolean(
					(left as ArrayValue).elements ===
						(right as ArrayValue).elements
				);
			return make_boolean(false);
		}
		if (left.type == "function") {
			if (right.type == "function")
				return make_boolean(
					(left as FunctionValue).body ==
						(right as FunctionValue).body
				);
			return make_boolean(false);
		}
		if (left.type == "native-function" || right.type == "native-function") {
			throw "cannot compare values to native functions, i just wont let you.";
		}
		return make_boolean(left.value === right.value); // i tested every case where the runtimevalue does not have "value". These 2 properties will definitely have values.
	} else if (operator == "!=") {
		if (left.type == "object") {
			if (right.type == "object") {
				return make_boolean(
					!compareObjectValues(
						structuredClone((left as ObjectValue).properties),
						structuredClone((right as ObjectValue).properties)
					)
				);
			}
			return make_boolean(true);
		}
		if (left.type == "array") {
			if (right.type == "array")
				return make_boolean(
					(left as ArrayValue).elements !==
						(right as ArrayValue).elements
				);
			return make_boolean(true);
		}
		if (left.type == "function") {
			if (right.type == "function")
				return make_boolean(
					(left as FunctionValue).body !==
						(right as FunctionValue).body
				);
			return make_boolean(true);
		}
		if (left.type == "native-function" || right.type == "native-function") {
			throw "cannot compare values to native functions, i just wont let you.";
		}
		return make_boolean(left.value !== right.value);
	} else if (operator == "??") {
		if (left.type == "null") {
			return right;
		} // nullish coalesce operator. One side null, use the other.
		return left;
	}
	if (left.type == "number" && right.type == "number") {
		return evaluate_numeric_binary_expression(
			left as NumberValue,
			right as NumberValue,
			operator,
			env
		);
	}
	if (left.type == "string" && right.type == "number" && operator == "+") {
		return make_string(
			(left as StringValue).value +
				(right as NumberValue).value.toString()
		) as StringValue;
	}
	const operatorNames: Record<string, string> = {
		"+": "add",
		"-": "subtract",
		"*": "multiply",
		"/": "divide",
		"%": "mod",
	};
	throw `Cannot evaluate ${operatorNames[operator]} value of type ${left.type} to value of type ${right.type}. (${left.type} ${operator} ${right.type})`;
}

function evaluate_program(program: Program, env: Environment): RuntimeValue {
	let last: RuntimeValue = make_null() as NullValue;
	for (const statement of program.body) {
		last = evaluate(statement, env);
	}
	return last;
}

function evaluate_function_declaration(
	declaration: FunctionDeclaration,
	env: Environment
): RuntimeValue {
	// function abc(a,b) {} // makes a runnable function abc(1,2)
	// function (a,b) {} // is only meant to run once- you cant call this
	if (declaration.name) {
		return env.declareVariable(
			declaration.name,
			{
				type: "function",
				async: declaration.async,
				name: declaration.name,
				parameters: declaration.parameters,
				declarationEnv: env,
				body: declaration.body,
			} as FunctionValue,
			true
		);
	}
	return {
		type: "function",
		async: declaration.async,
		name: declaration.name,
		parameters: declaration.parameters,
		declarationEnv: env,
		body: declaration.body,
	} as FunctionValue;
}

function evaluate_break_statement(
	_ast: BreakStatement,
	_env: Environment
): RuntimeValue {
	return { type: "break" } as BreakValue;
}

function evaluate_member_expression(
	member: MemberExpression,
	env: Environment
): RuntimeValue {
	const object = evaluate(member.object, env) as ObjectValue;
	const property = (member.property as Identifier).symbol;
	if (!object.properties.has(property)) {
		throw "object does not have property " + property;
	}
	return object.properties.get(property) as RuntimeValue;
}

function evaluate_return_statement(
	ast: ReturnStatement,
	env: Environment
): RuntimeValue {
	return { type: "return", value: evaluate(ast.value, env) } as ReturnValue; // wow so easy
}

function evaluate_while_loop_statement(
	loop: WhileLoopStatement,
	env: Environment
): RuntimeValue {
	if (!convert_to_boolean(evaluate(loop.condition, env))) {
		return make_null(); // dont bother doing the loop
	}
	const scope = new Environment(env);
	whileLoop: while (true) {
		if (!convert_to_boolean(evaluate(loop.condition, scope))) {
			break;
		}
		for (const statement of loop.body) {
			const evaluatedStatement = evaluate(statement, scope);
			if (evaluatedStatement.type == "break") {
				break whileLoop;
			}
			if (evaluatedStatement.type == "return") {
				// WHO KNOWS, maybe this might be returning to a function parent?
				if (env.parent) {
					// send it up to the parent environment.
					return evaluatedStatement;
				} else {
					throw "you can't return in a for loop. use break instead";
				}
			}
		}
	}

	return make_null();
}

function evaluate_for_loop_statement(
	loop: ForLoopStatement,
	env: Environment
): RuntimeValue {
	let variable = evaluate(
		loop.variable.value ??
			({ kind: "NumericLiteral", value: 0 } as NumericLiteral),
		env
	) as NumberValue;
	whileLoop: while (true) {
		const scope = new Environment(env);
		const binaryExpression = loop.iterator.value as BinaryExpression;
		const condition = loop.condition as BinaryExpression; // more of a comparison kind of binary expression
		binaryExpression.left = {
			kind: "NumericLiteral",
			value: variable.value,
		} as NumericLiteral;
		condition.left = {
			kind: "NumericLiteral",
			value: variable.value,
		} as NumericLiteral;
		scope.declareVariable(
			loop.variable.identifier,
			variable,
			loop.variable.constant
		);
		if (!convert_to_boolean(evaluate(condition, scope))) {
			break whileLoop;
		}
		for (const statement of loop.body) {
			const evaluatedStatement = evaluate(statement, scope);
			if (evaluatedStatement.type == "break") {
				break whileLoop;
			}
			if (evaluatedStatement.type == "return") {
				// WHO KNOWS, maybe this might be returning to a function parent?
				if (env.parent) {
					// send it up to the parent environment.
					return evaluatedStatement;
				} else {
					throw "you can't return in a for loop. use break instead";
				}
			}
		}
		variable = evaluate(binaryExpression, scope) as NumberValue;
	}

	return make_null();
}

function evaluate_if_statement(
	ifStatement: IfStatement,
	env: Environment
): RuntimeValue {
	if (convert_to_boolean(evaluate(ifStatement.condition, env))) {
		const scope = new Environment(env);
		for (const statement of ifStatement.body) {
			if (
				statement.kind == "ReturnStatement" ||
				statement.kind == "BreakStatement"
			) {
				return evaluate(statement, scope);
			}
			evaluate(statement, scope);
		}
	}

	return make_null();
}

export function evaluate(ast: Statement, env: Environment): RuntimeValue {
	switch (ast.kind) {
		case "NumericLiteral":
			return {
				type: "number",
				value: (ast as NumericLiteral).value,
			} as NumberValue;
		case "NullLiteral":
			return make_null();
		case "BreakStatement":
			return evaluate_break_statement(ast as BreakStatement, env);
		case "BinaryExpression":
			return evaluate_binary_expression(ast as BinaryExpression, env);
		case "Program":
			return evaluate_program(ast as Program, env);
		case "Identifier":
			return env.valueOfVariable((ast as Identifier).symbol);
		case "ReassignmentExpression":
			return evaluate_reassignment(ast as ReassignmentExpression, env);
		case "CallExpression":
			return evaluate_call_expression(ast as CallExpression, env);
		case "ReturnStatement":
			return evaluate_return_statement(ast as ReturnStatement, env);
		case "VariableDeclaration":
			return evaluate_variable_declaration(
				ast as VariableDeclaration,
				env
			);
		case "WhileLoopStatement":
			return evaluate_while_loop_statement(
				ast as WhileLoopStatement,
				env
			);
		case "ForLoopStatement":
			return evaluate_for_loop_statement(ast as ForLoopStatement, env);
		case "IfStatement":
			return evaluate_if_statement(ast as IfStatement, env);
		case "MemberExpression":
			return evaluate_member_expression(ast as MemberExpression, env);
		case "FunctionDeclaration":
			return evaluate_function_declaration(
				ast as FunctionDeclaration,
				env
			);
		case "ObjectLiteral":
			return evaluate_object_expression(ast as ObjectLiteral, env);
		case "ArrayLiteral":
			return evaluate_array_expression(ast as ArrayLiteral, env);
		case "StringLiteral":
			return {
				type: "string",
				value: (ast as StringLiteral).value,
			} as StringValue;
		default:
			console.log(JSON.stringify(ast, null, 2));
			throw `interpreter: wtf is a ${ast.kind}`;
	}
}
