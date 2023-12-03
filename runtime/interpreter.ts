import {
	RuntimeValue,
	NumberValue,
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
} from "../compile/ast.ts";
import Environment from "./environment.ts";

function evaluate_numeric_binary_expression(
	left: NumberValue,
	right: NumberValue,
	operator: string,
	_env: Environment,
    strictMode: boolean
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
                if (strictMode)
				    throw "interpreter: you can't divide by zero!";
                return make_number(NaN) // NaN is somehow has a primitive type of "number"?! It literally stands for "Not a Number"!
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
	env: Environment,
	strictMode: boolean
): RuntimeValue {
	return env.declareVariable(
		declaration.identifier,
		evaluate(declaration.value ?? make_null_literal(), env, strictMode),
		declaration.constant, strictMode
	);
}

function evaluate_object_expression(
	obj: ObjectLiteral,
	env: Environment,
	strictMode: boolean
): RuntimeValue {
	const object = { type: "object", properties: new Map() } as ObjectValue;
	for (const { key, value } of obj.properties) {
		const runtimeVal =
			value == undefined
				? env.valueOfVariable(key)
				: evaluate(value, env, strictMode);

		object.properties.set(key, runtimeVal);
	}

	return object;
}

function evaluate_array_expression(
	arr: ArrayLiteral,
	env: Environment,
	strictMode: boolean
): RuntimeValue {
	return {
		type: "array",
		elements: arr.elements.map((element) =>
			evaluate(element, env, strictMode)
		),
	} as ArrayValue;
}

function evaluate_reassignment_statement(
	assignment: ReassignmentExpression,
	env: Environment,
	strictMode: boolean
): RuntimeValue {
	if (assignment.target.kind == "Identifier") {
		const name = (assignment.target as Identifier).symbol;
		return env.reassignVariable(
			name,
			evaluate(assignment.value, env, strictMode)
		);
	} else if (assignment.target.kind == "MemberExpression") {
		// object[123] = "value"
		const memberExpr: MemberExpression =
			assignment.target as MemberExpression;
		if (strictMode) {
			// this function automatically errors if an object property is not defined
			evaluate_member_expression(memberExpr, env, strictMode);
		}
		/*object[123] = "value" //* set the 124th value to "value", if there is a 124th property to set
          object["abc"] = "value" //* set object.abc to value
          object.abc = value //* also set object.abc to value */
		const object = evaluate(
			// object[123] = "value" //* the `object`
			memberExpr.object,
			env,
			strictMode
		) as ObjectValue;
		const value = evaluate(
			// object[123] = "value" //* the `"value"`
			assignment.value,
			env,
			strictMode
		);
		if (memberExpr.computed) {
			// object["abc"] = "value" //* the `[]`
			const property = evaluate(memberExpr.property, env, strictMode);
			if (property.type == "string") {
				// object["abc"] = "value" //* the "abc"
				if (memberExpr.object.kind == "Identifier") {
					// we are reassigning a variable!!!
					env.reassignVariable(
						(memberExpr.object as Identifier).symbol,
						{
							type: "object",
							properties: object.properties.set(
								(property as StringValue).value,
								value
							),
						} as ObjectValue
					);
				}
			} else {
				throw `cannot get computed object property if the property is a ${property.type}`;
			}
		} else if (memberExpr.property.kind == "Identifier") {
			// object.abc //* object
			if (memberExpr.object.kind == "Identifier") {
				// object.abc //* abc
				// we are reassigning a variable!!!
				env.reassignVariable((memberExpr.object as Identifier).symbol, {
					type: "object",
					properties: object.properties.set(
						(memberExpr.property as Identifier).symbol,
						value
					),
				} as ObjectValue);
			}
		} else {
			throw `cannot reassign object property if the object property is a ${memberExpr.property.kind}`;
		}
		return make_null();
	} else {
		throw `interpreter: unknown reassignment target; cannot reassign a ${assignment.target.kind}`;
	}
}

function evaluate_call_expression(
	call: CallExpression,
	env: Environment,
	strictMode: boolean
): RuntimeValue {
	const args = call.arguments.map((argument) =>
		evaluate(argument, env, strictMode)
	);
	const fn = evaluate(call.target, env, strictMode);
	if (fn.type == "native-function") {
		return (fn as NativeFunctionValue).call(args, env, strictMode);
	}
	if (fn.type == "function") {
		// user-defined function
		const func = fn as FunctionValue;
		const scope = new Environment(func.declarationEnv);
		if (func.parameters.length > args.length) {
			throw `interpreter: Missing ${
				func.parameters.length - args.length
			} parameters to call function`;
		}
		for (let i = 0; i < func.parameters.length; i++) {
			scope.declareVariable(func.parameters[i], args[i], false,strictMode);
		}
		let result: RuntimeValue = make_null();
		for (const statement of func.body) {
			if (statement.kind=="StringLiteral") {
                if ((statement as StringLiteral).value == "strict on") {
                    strictMode = true
                    continue
                }
                if ((statement as StringLiteral).value == "strict off") {
                    strictMode = false
                    continue
                }
            }
            const evaluatedStatement = evaluate(statement, scope, strictMode);
		    if (statement.kind == "ReturnStatement") {
				// lets return!
				result = evaluatedStatement ?? make_null();
				// the ?? will never be used for its function, but really only to make TypeScript shut up :)
				break;
			}
            if (statement.kind == "BreakStatement") {
                return evaluatedStatement
            }
		}
		return result;
	}
	throw `interpreter: ${fn.type} is not a function`;
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
	env: Environment,
	strictMode: boolean
): RuntimeValue {
	const left = evaluate(binExpr.left, env, strictMode);
	const right = evaluate(binExpr.right, env, strictMode);
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
			throw "interpreter: cannot compare values to native functions, i just wont let you.";
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
			throw "interpreter: cannot compare values to native functions, i just wont let you.";
		}
		return make_boolean(left.value !== right.value);
	} else if (operator == "??") {
		if (left.type == "null") {
			return right;
		} // nullish coalesce operator. One side is null, use the other.
		return left;
	}
	if (left.type == "number" && right.type == "number") {
		return evaluate_numeric_binary_expression(
			left as NumberValue,
			right as NumberValue,
			operator,
			env,
            strictMode
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
		"%": "modulo",
	};
	throw `interpreter: Cannot ${operatorNames[operator]} value of type ${left.type} to value of type ${right.type}. (${left.type} ${operator} ${right.type})`;
}

function evaluate_program(
	program: Program,
	env: Environment,
	strictMode: boolean
): RuntimeValue {
    strictMode = false // off by default :)
	for (const statement of program.body) {
        if (statement.kind=="StringLiteral") {
            if ((statement as StringLiteral).value == "strict on") {
                strictMode = true
                continue
            }
            if ((statement as StringLiteral).value == "strict off") {
                strictMode = false
                continue
            }
        }
		if (statement.kind == "ReturnStatement") {
			throw "interpreter: cannot return global scope (who are you returning to?). If you would like to return something as a module, use `DUM.expotrs = {value}`";
		}
		if (statement.kind == "BreakStatement") {
			throw "interpreter: cannot break global scope (what are you breaking out of?)";
		}
        evaluate(statement, env, strictMode)
	}
	return (env.valueOfVariable("DUM") as ObjectValue).properties.get("exports") ?? make_null()
}
function evaluate_function_declaration(
	declaration: FunctionDeclaration,
	env: Environment,
	strictMode: boolean
): RuntimeValue {
	// function abc(a,b) {} // makes a runnable function abc(1,2)
	// function (a,b) {} // is only meant to be used once(such as an object member or a function argument)- you cant call this for a name
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
			true,
            strictMode
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

function get_array_value_from_numeric_index(
	index: number,
	array: ArrayValue,
	strictMode: boolean
): RuntimeValue {
	if (index >= array.elements.length) {
		// 0+
		if (strictMode) {
			throw `Cannot evaluate ${index}th property of ${array.elements.length}-long array`;
		}
		// just sorta wrap around the array using the % operator
		// imagine if `array` has 10 properties
		// array[45] //* this gets the 5th property of `array` (45%10 = 5)
		return (
			Object.values(array.elements).at(index % array.elements.length) ??
			make_null()
		);
	}
	if (index < 0) {
		if (strictMode) {
			throw "index out of bounds";
		}
		// 0-
		/* let's imagine `object` has 10 properties
           object[-1] // should get the last property (the 10th)
           object[-2] // should get the second-to-last property (the 9th)
           object[-11] // should wrap around (the 10th)*/
		const position =
			array.elements.length -
			(Math.abs(array.elements.length - Math.abs(index)) %
				array.elements.length);
		return Object.values(array.elements).at(position) ?? make_null();
	}
	return Object.values(array.elements).at(index) ?? make_null();
}

function evaluate_member_expression(
	member: MemberExpression,
	env: Environment,
	strictMode: boolean
): RuntimeValue {
	const object = evaluate(member.object, env, strictMode);
    if (object.type == "object") {
        if (member.property.kind !== "Identifier") {
            throw `cannot get property of object is property is a(n) ${member.property.kind}`
        }
        const property = (member.property as Identifier).symbol;
        if (!(object as ObjectValue).properties.has(property)) {
            throw "interpreter: object does not have property " + property;
        }
        return (object as ObjectValue).properties.get(property) as RuntimeValue;
    } else if (object.type == "array") {
        const array = object as ArrayValue;
        if (!member.computed) {
            throw "cannot get element of array using dot (.). Use [] for a computed value instead."
        }
        if (member.property.kind !== "NumericLiteral") {
            throw `cannot get element of array is computed value is a(n) ${member.property.kind}`
        }
        const arrayIndex = (member.property as NumericLiteral).value
        if (Math.floor(arrayIndex)!==arrayIndex) {
            throw `cannot get decimalth element of array (${arrayIndex}th). Try using \`Math.floor\` or \`Math.ceil\` to calculate index instead.`
        }
        return get_array_value_from_numeric_index(arrayIndex, array, strictMode)

    } else {
        throw `cannot run member expression on a(n) ${object.type}`
    }
}

function evaluate_while_loop_statement(
	loop: WhileLoopStatement,
	env: Environment,
	strictMode: boolean
): RuntimeValue {
	if (!convert_to_boolean(evaluate(loop.condition, env, strictMode))) {
		return make_null(); // dont bother doing the loop
	}
	const scope = new Environment(env);
	whileLoop: while (true) {
		if (!convert_to_boolean(evaluate(loop.condition, scope, strictMode))) {
			break;
		}
		for (const statement of loop.body) {
            if (statement.kind=="StringLiteral") {
                if ((statement as StringLiteral).value == "strict on") {
                    strictMode = true
                    continue
                }
                if ((statement as StringLiteral).value == "strict off") {
                    strictMode = false
                    continue
                }
            }
            if (statement.kind == "BreakStatement") {
				break whileLoop;
			}
            const evaluatedStatement = evaluate(statement, scope, strictMode);
			if (statement.kind == "ReturnStatement") {
				//? maybe this might be returning to a function parent?
				if (env.parent) {
					// send it up to the parent environment.
					return evaluatedStatement;
				} else {
                    throw "interpreter: you can't return in a for loop. use break instead";
				}
			}
		}
	}

	return make_null();
}

function evaluate_for_loop_statement(
	loop: ForLoopStatement,
	env: Environment,
	strictMode: boolean
): RuntimeValue {
	let variable = evaluate(
		loop.variable.value ??
			({ kind: "NumericLiteral", value: 0 } as NumericLiteral),
		env,
		strictMode
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
			loop.variable.constant,
            false // If `i` is already defined in a higher scope, then use the for loop scope instead.
		);
		if (!convert_to_boolean(evaluate(condition, scope, strictMode))) {
			break whileLoop;
		}
		for (const statement of loop.body) {
			if (statement.kind=="StringLiteral") {
                if ((statement as StringLiteral).value == "strict on") {
                    strictMode = true
                    continue
                }
                if ((statement as StringLiteral).value == "strict off") {
                    strictMode = false
                    continue
                }
            }
			if (statement.kind == "BreakStatement") {
                break whileLoop;
			}
            const evaluatedStatement = evaluate(statement, scope, strictMode);
			if (statement.kind == "ReturnStatement") {
				//? maybe this might be returning to a function parent?
				/*
                function abc() {
                    for (let i = 0; i < 10; i++) {
                        if (i > 5) {
                            return true //* this will return `true` to the function
                        }
                    }
                }
                */
				if (env.parent) {
					// send it up to the parent environment and stop the loop.
					// If there is no parent function to return, the loop is stopped.
					// All we would need to do is throw an error for attempting so.
					return evaluatedStatement;
				} else {
					throw "interpreter: you can't return in a for loop. use break instead";
				}
			}
		}
		variable = evaluate(binaryExpression, scope, strictMode) as NumberValue;
	}

	return make_null();
}

function evaluate_if_statement(
	ifStatement: IfStatement,
	env: Environment,
	strictMode: boolean
): RuntimeValue {
	if (convert_to_boolean(evaluate(ifStatement.condition, env, strictMode))) {
		const scope = new Environment(env);
		for (const statement of ifStatement.body) {
			// if it breaks out of the if statement, return that ¯\_(ツ)_/¯
			if (statement.kind=="StringLiteral") {
                if ((statement as StringLiteral).value == "strict on") {
                    strictMode = true
                    continue
                }
                if ((statement as StringLiteral).value == "strict off") {
                    strictMode = false
                    continue
                }
            }
            if (
				statement.kind == "ReturnStatement" ||
				statement.kind == "BreakStatement"
			) {
				return evaluate(statement, scope, strictMode);
			}
			evaluate(statement, scope, strictMode);
		}
	}

	return make_null();
}

function evaluate_break_statement(
	_breakStatment: BreakStatement,
	_env: Environment,
	_strictMode: boolean
): RuntimeValue {
	return make_null();
}
function evaluate_return_statement(
	returnStatment: ReturnStatement,
	env: Environment,
	strictMode: boolean
): RuntimeValue {
	return evaluate(returnStatment.value, env, strictMode);
}

export function evaluate(
	ast: Statement,
	env: Environment,
	strictMode: boolean
): RuntimeValue {
	switch (ast.kind) {
		case "NumericLiteral":
			return {
				type: "number",
				value: (ast as NumericLiteral).value,
			} as NumberValue;
		case "NullLiteral":
			return make_null();
		case "BreakStatement":
			return evaluate_break_statement(
				ast as BreakStatement,
				env,
				strictMode
			);
		case "BinaryExpression":
			return evaluate_binary_expression(
				ast as BinaryExpression,
				env,
				strictMode
			);
		case "Program":
			return evaluate_program(ast as Program, env, strictMode);
		case "Identifier":
			return env.valueOfVariable((ast as Identifier).symbol);
		case "ReassignmentExpression":
			return evaluate_reassignment_statement(
				ast as ReassignmentExpression,
				env,
				strictMode
			);
		case "CallExpression":
			return evaluate_call_expression(
				ast as CallExpression,
				env,
				strictMode
			);
		case "ReturnStatement":
			return evaluate_return_statement(
				ast as ReturnStatement,
				env,
				strictMode
			);
		case "VariableDeclaration":
			return evaluate_variable_declaration(
				ast as VariableDeclaration,
				env,
				strictMode
			);
		case "WhileLoopStatement":
			return evaluate_while_loop_statement(
				ast as WhileLoopStatement,
				env,
				strictMode
			);
		case "ForLoopStatement":
			return evaluate_for_loop_statement(
				ast as ForLoopStatement,
				env,
				strictMode
			);
		case "IfStatement":
			return evaluate_if_statement(ast as IfStatement, env, strictMode);
		case "MemberExpression":
			return evaluate_member_expression(
				ast as MemberExpression,
				env,
				strictMode
			);
		case "FunctionDeclaration":
			return evaluate_function_declaration(
				ast as FunctionDeclaration,
				env,
				strictMode
			);
		case "ObjectLiteral":
			return evaluate_object_expression(
				ast as ObjectLiteral,
				env,
				strictMode
			);
		case "ArrayLiteral":
			return evaluate_array_expression(
				ast as ArrayLiteral,
				env,
				strictMode
			);
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
