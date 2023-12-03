import { tokenize, Token, TokenType, token_to_json } from "./tokenizer.ts";
import {
    Statement,
    Program,
    BinaryExpression,
    NumericLiteral,
    Expression,
    Identifier,
    StringLiteral,
    VariableDeclaration,
    ReassignmentExpression,
    Property,
    ObjectLiteral,
    CallExpression,
    MemberExpression,
    FunctionDeclaration,
    ArrayLiteral,
    ReturnStatement,
    IfStatement,
    WhileLoopStatement,
    ForLoopStatement,
    BreakStatement,
    ClassDeclaration,
    ClassInstantiation,
} from "./ast.ts";
import { make_null_literal } from "../runtime/values.ts"; // make_null returns a RuntimeValue, which cannot be evaluated.

export default class Parser {
    private tokens: Token[] = [];

    private at() {
        return this.tokens[0] as Token;
    }
    private eat() {
        return this.tokens.shift() as Token;
    }
    private not_eof(): boolean {
        return this.at().type != TokenType.EndOfFile || this.tokens.length == 0;
    }
    /**
     * Eats the current token and errors if its type does not match.
     * If they do not match, throw the custom error message.
     * @private
     * @param {TokenType} type The type to expect
     * @param {string} errMsg The message of the error if the types do not match
     * @return {Token}  Returns the token if its type matches
     * @memberof Parser
     */
    private expect(type: TokenType, errMsg: string, functionName: string): Token {
        const token = this.eat();
        if (!token || token.type !== type) {
            throw `oh no! you needed token of type ${TokenType[type]}, but got ${TokenType[token.type]} (value ${token.value}). More details: parse_${functionName}() errored with message "${errMsg}" at pos ${token.position}`;
        }
        return token;
    }
    public produceAST(sourceCode: string, debugMode: boolean): Program {
        this.tokens = tokenize(sourceCode, debugMode); // waow
        if (debugMode) {
            console.log("parser is parsing, timer started");
            console.time("parser");
        }
        const program = {
            kind: "Program",
            body: [],
        } as Program;
        while (this.not_eof()) {
            program.body.push(this.parse_statement());
        }
        if (debugMode) {
            console.timeEnd("parser");
            console.log("parser is done parsing.");
        }
        return program;
    }

    private parse_statement(isPublic?: boolean): Statement {
        // switch statement for different types of loops and declarations
        switch (this.at().type) {
            case TokenType.Private:
                this.eat();
                return this.parse_statement(false);
            case TokenType.Public:
                this.eat();
                return this.parse_statement(true);
            case TokenType.Let:
                return this.parse_variable_declaration(isPublic);
            case TokenType.Const:
                return this.parse_variable_declaration(isPublic);
            case TokenType.Function:
                return this.parse_function_declaration(isPublic);
            case TokenType.Class:
                return this.parse_class_declaration();
            case TokenType.Async:
                return this.parse_function_declaration(isPublic); // but as an asynchronous
            case TokenType.Return:
                return this.parse_return_statement();
            case TokenType.Break:
                this.eat();
                return { kind: "BreakStatement" } as BreakStatement;
            // you cannot return a value in a break statement, unlike `return`. also 100th line teehee
            case TokenType.While:
                return this.parse_conditionary_statement();
            case TokenType.For:
                return this.parse_for_loop_statement();
            case TokenType.If:
                return this.parse_conditionary_statement();
            default:
                return this.parse_expression();
        }
    }
    private parse_for_loop_statement(): ForLoopStatement {
        this.eat(); // eat the "for" token
        this.expect(
            TokenType.OpenParen,
            "expected open parenthesis for for loop condition",
            "for_loop_statement"
        );
        if (
            this.at().type !== TokenType.Const &&
            this.at().type !== TokenType.Let
        ) {
            throw "expected variable declaration for for loop variable (let i / const i)";
        }
        const variable =
            this.parse_variable_declaration() as VariableDeclaration; // if the variable is not assigned an immediate value (let i;) it will end in a semicolon
        if (!variable.value || variable.value.kind !== "NumericLiteral") {
            // variables have to be defined and have a value of type number.
            throw "for loop variables must be defined and have a value of number";
        }
        if (this.at().type == TokenType.Semicolon) {
            this.eat(); // eat the semicolon to parse the for loop condition
        }
        const condition = this.parse_expression(); // could techincally be like an object or something but uhhhh who cares
        this.expect(
            TokenType.Semicolon,
            "you have to have an iterator on your for loop; for (let i=0; i<10; --> i++ <--) { }",
            "for_loop_statement"
        );
        const iterator = this.parse_assignment_expression(true); // i = i + 1 OR i ++
        this.expect(
            TokenType.CloseParen,
            "you need to close your for loop condition parenthesis",
            "for_loop"
        );
        // The hard part is done! Now we need to loop over the body and get this all over with.
        this.expect(
            TokenType.OpenBrace,
            "you need to open your for loop, or what is it gonna do, right?",
            "for_loop_statement"
        );
        const body: Statement[] = [];
        while (this.not_eof() && this.at().type !== TokenType.CloseBrace) {
            body.push(this.parse_statement());
        }
        this.expect(
            TokenType.CloseBrace,
            "you need to close your for loop brace someday, dude",
            "for_loop_statement"
        );
        return {
            kind: "ForLoopStatement",
            condition,
            iterator,
            variable,
            body,
        } as ForLoopStatement;
    }
    private parse_conditionary_statement(): Statement {
        const type = this.eat().type;
        this.expect(
            TokenType.OpenParen,
            "expected open parenthesis when declaring " +
            TokenType[type] +
            " condition",
            "conditionary_statement"
        );
        const condition = this.parse_expression();
        this.expect(
            TokenType.CloseParen,
            "expected closing parenthesis after declaring " +
            TokenType[type] +
            " condition",
            "conditionary_statement"
        );
        // ok now handle the body
        // (copy and paste from function body lmao)
        const body: Statement[] = [];
        this.expect(
            TokenType.OpenBrace,
            `without a brace, what is your ${type == TokenType.If ? "if statement" : "loop"
            } gonna do?`,
            "conditionary_statement"
        );
        while (this.not_eof() && this.at().type !== TokenType.CloseBrace) {
            body.push(this.parse_statement()); // could have other conditionary statements inside
        }
        this.expect(
            TokenType.CloseBrace,
            "you gotta close your brace someday, dude",
            "conditionary_statement"
        );
        if (type == TokenType.If) {
            return {
                kind: "IfStatement",
                condition,
                body,
            } as IfStatement;
        } else if (type == TokenType.While) {
            return {
                kind: "WhileLoopStatement",
                condition,
                body,
            } as WhileLoopStatement;
        }
        return make_null_literal(); // This will never be reached, but i need to make the typescript compiler shut up.
    }
    private parse_return_statement(): Statement {
        this.eat(); // eat the `return` keyword
        if (
            this.at().type == TokenType.CloseBrace ||
            this.at().type == TokenType.Semicolon ||
            this.at().type == TokenType.EndOfFile
        ) {
            return {
                kind: "ReturnStatement",
                value: make_null_literal(),
            } as ReturnStatement;
        }
        return {
            kind: "ReturnStatement",
            value: this.parse_object_expression(),
        } as ReturnStatement; // what do I return? this thing.
    }
    private parse_expression(): Expression {
        if (this.at().type == TokenType.Function)
            return this.parse_function_declaration();
        return this.parse_assignment_expression(false);
    }
    // Constant or mutable, identifier, equal sign and value or just semicolon
    private parse_variable_declaration(
        isPublicKeywordUsed?: boolean
    ): Statement {
        const constant = this.eat().type == TokenType.Const;
        const identifier = this.expect(
            TokenType.Identifier,
            "what am i gonna call the variable?!",
            "variable_declaration"
        ).value;
        if (this.at().type == TokenType.Semicolon) {
            this.eat();
            if (constant) {
                throw `you have to define a constant variable (const ${identifier} = value)`;
            } else {
                return {
                    kind: "VariableDeclaration",
                    identifier,
                    constant,
                    value: undefined,
                } as VariableDeclaration;
            }
        }
        this.expect(TokenType.Equals, `you have to assign a value to ${identifier}; if intentional, end declaration with semicolon. (let ${identifier};)`, "variable_declaration");
        const declaration = {
            kind: "VariableDeclaration",
            identifier,
            constant,
            public: isPublicKeywordUsed,
            value: this.parse_expression(),
        } as VariableDeclaration;
        if (this.at().type == TokenType.Semicolon) {
            this.eat();
        }
        return declaration;
    }

    private parse_class_declaration() {
        // Lord please help me.
        this.eat(); // Eat the `class` keyword
        const className = this.expect(
            TokenType.Identifier,
            "class names have to be... well, names",
            "class_declaration"
        ).value; // Idenntifier value
        let superClassName: string | null = null;
        if (this.at().type == TokenType.OpenParen) {
            throw `A class is not a function. You can't do \`class ${className}() { }..!\``
        }
        if (this.at().type !== TokenType.OpenBrace) {
            this.expect(TokenType.Extends, "If you are not extending or creating a class, what are you doing?", "class_declaration");
            superClassName = this.expect(TokenType.Identifier, "you need to enter the name of the class you are extending", "class_declaration").value;
        }
        this.expect(TokenType.OpenBrace, "surely you have to be opening a class by now", "class_declaration");
        const properties: Statement[] = [];
        while (this.not_eof() && this.at().type !== TokenType.CloseBrace) {
            const currentStatement = this.parse_statement();
            if (currentStatement.kind == "VariableDeclaration") {
                if ((currentStatement as VariableDeclaration).public == undefined) {
                    throw "you have to define a variable in a class as either private or public, but you can't leave it blank";
                }
                properties.push(currentStatement);
            }
            else if (currentStatement.kind == "FunctionDeclaration") {
                if ((currentStatement as FunctionDeclaration).public == undefined) { // Not public OR private
                    if ((currentStatement as FunctionDeclaration).name == "constructor") { // If function name is "constructor"
                        (currentStatement as FunctionDeclaration).public = true // Make it public so it can actually be referred to.
                        for (const statement of (currentStatement as FunctionDeclaration).body) {
                            if (statement.kind=="ReturnStatement") {
                                throw "You cannot return from a constructor. It has to return the new class."
                            }
                        }
                    } else {
                        throw "you have to define a function in a class as either private or public, but not blank"
                    }
                }
                properties.push(currentStatement);
            }
            else {
                throw `cannot parse statement of kind ${currentStatement.kind} in class scope; only method and property declarations allowed.`
            }
        }
        this.expect(TokenType.CloseBrace, "you have to close the class someday, y'know?", "class_declaration") // Eat the }
        return {
            kind: "ClassDeclaration",
            identifier: className,
            superClass: superClassName,
            properties,
        } as ClassDeclaration;
    }

    private parse_function_declaration(
        isPublicKeywordUsed?: boolean
    ): Statement {
        const async = this.eat().type == TokenType.Async; // eat the keyword - if its "async" eat another
        if (async) {
            this.expect(
                TokenType.Function,
                "if you use async, you have to be defining a function, right?",
                "function_declaration"
            );
        }
        const name = this.at().type == TokenType.Identifier
            ? this.eat().value
            : undefined; // inline or global function
        const args = this.parse_args(); // read arguments from parenthesis to parenthesis
        const params: string[] = [];
        for (const argument of args) {
            if (argument.kind !== "Identifier") {
                console.log(argument);
                throw `parameter names have to be... well, names. ${argument} is not a name`;
            }
            params.push((argument as Identifier).symbol);
        }
        this.expect(
            TokenType.OpenBrace,
            "your function has to do something..!",
            "function_declaration"
        );
        const body: Statement[] = [];
        while (this.not_eof() && this.at().type !== TokenType.CloseBrace) {
            body.push(this.parse_statement());
        }
        this.expect(
            TokenType.CloseBrace,
            "you have to close your function someday, dude",
            "function_declaration"
        );
        if (name) {
            return {
                kind: "FunctionDeclaration",
                async,
                name,
                parameters: params,
                public: isPublicKeywordUsed,
                body,
            } as FunctionDeclaration;
        }
        return { //! Don't include private/public! It will error for not including if used in a class! (you cannot declare a function to be anonymous)
            kind: "FunctionDeclaration",
            async,
            name,
            parameters: params,
            body,
        } as FunctionDeclaration;
    }

    private parse_assignment_expression(onlyIdentifier: boolean): Expression {
        let left;
        if (onlyIdentifier) {
            left = {
                kind: "Identifier",
                symbol: this.expect(
                    TokenType.Identifier,
                    "reassignment variable must be... well, a variable",
                    "assignment_expression"
                ).value,
            } as Identifier;
        } else {
            left = this.parse_object_expression();
        }
        if (this.at().type == TokenType.BinaryOperator) {
            if ("++--".includes(this.at().value)) {
                return {
                    kind: "ReassignmentExpression",
                    target: left,
                    value: {
                        kind: "BinaryExpression",
                        operator: this.eat().value.charAt(0),
                        left,
                        right: {
                            kind: "NumericLiteral",
                            value: 1
                        } as NumericLiteral
                    } as BinaryExpression
                } as ReassignmentExpression
            } else if (["+=", "-=", "*=", "/=", "%="].includes(this.at().value)) {
                const operator = this.eat().value.charAt(0)
                return {
                    kind: "ReassignmentExpression",
                    target: left,
                    value: {
                        kind: "BinaryExpression",
                        operator,
                        left,
                        right: this.parse_object_expression()
                    } as BinaryExpression
                } as ReassignmentExpression
            }
        } else if (this.at().type == TokenType.Equals) {
            this.eat();
            const value = this.parse_object_expression();
            if (this.at().type == TokenType.Semicolon) {
                this.eat();
            }
            return {
                kind: "ReassignmentExpression",
                target: left,
                value,
            } as ReassignmentExpression;
        }
        return left;
    }

    private parse_object_expression(): Expression {
        // { Properties[] }
        if (this.at().type !== TokenType.OpenBrace) {
            // it's not an object.
            return this.parse_array_expression();
        }
        this.eat(); // eat the open brace to get to the properties inside
        const properties = new Array<Property>();
        while (this.not_eof() && this.at().type !== TokenType.CloseBrace) {
            const key = this.expect(
                TokenType.Identifier,
                "what is the property key going to be called?",
                "object_expression"
            ).value;
            // { key }
            if (this.at().type == TokenType.Comma) {
                // { key, }
                this.eat(); // bye bye comma.
                properties.push({ kind: "Property", key } as Property); // ¯\_(ツ)_/¯
                continue; // we already added the property; onto the next now
            } else if (this.at().type == TokenType.CloseBrace) {
                // { key }
                properties.push({ kind: "Property", key } as Property); // ¯\_(ツ)_/¯
                continue;
            }

            // { key: value }
            this.expect(
                TokenType.Colon,
                "you need a colon to define key:value. or maybe you just forgot to put a closing brace.",
                "object_expression"
            );
            const value = this.parse_expression();

            properties.push({ kind: "Property", key, value } as Property);
            if (this.at().type !== TokenType.CloseBrace) {
                this.expect(
                    TokenType.Comma,
                    "you have to seperate object key/value pairs with a comma",
                    "object_expression"
                );
            }
        }

        this.expect(TokenType.CloseBrace, "you need to close your braces! {}", "object_expression");
        return { kind: "ObjectLiteral", properties } as ObjectLiteral;
    }

    private parse_array_expression(): Expression {
        if (this.at().type !== TokenType.OpenBracket) {
            return this.parse_class_instantiation();
        }
        this.eat();
        const elements = new Array<Expression>(); // haha an array inside an array
        while (this.not_eof() && this.at().type !== TokenType.CloseBracket) {
            const element = this.parse_expression();
            if (this.at().type == TokenType.Comma) {
                this.eat(); // bye bye comma
                elements.push(element);
                continue;
            } else if (this.at().type == TokenType.CloseBracket) {
                // we closed it- push it, but keep the bracket so the while look will stop.
                elements.push(element);
                continue;
            }
            elements.push(element);
            if (this.at().type !== TokenType.CloseBracket) {
                this.expect(
                    TokenType.Comma,
                    "you need to seperate array elements with commas",
                    "array_expression"
                );
            }
        }
        this.expect(
            TokenType.CloseBracket,
            "you have to close your array brackets!",
            "array_expression"
        );
        return { kind: "ArrayLiteral", elements } as ArrayLiteral;
    }

    private parse_class_instantiation(): Expression {
        const className = this.parse_equality() //? Why? Because it could be of type "Identifier", OR it could be a MemberExpression! "new obj.Example()"!
        if (this.at().type !== TokenType.New) {
            return className // in this case, it wouldn't be a class' name but for the real purpose of "==", math, memberexpr, calls, etc.
        }
        const args: Expression[] = this.parse_args()
        return {
            kind: "ClassInstantiation",
            classTarget: className,
            constructorArguments: args
        } as ClassInstantiation
    }

    private parse_equality(): Expression {
        let left = this.parse_additive_expression();
        while (["==", "<=", "<", ">", ">=", "!="].includes(this.at().value)) {
            const operator = this.eat().value;
            const right = this.parse_additive_expression();
            left = {
                kind: "BinaryExpression",
                operator,
                left,
                right,
            } as BinaryExpression;
        }
        return left;
    }

    private parse_additive_expression(): Expression {
        let left = this.parse_multiplicative_expression();
        while ("+-".includes(this.at().value)) {
            const operator = this.eat().value;
            const right = this.parse_multiplicative_expression();
            left = {
                kind: "BinaryExpression",
                operator,
                left,
                right,
            } as BinaryExpression;
        }

        return left;
    }

    private parse_multiplicative_expression(): Expression {
        let left = this.parse_call_member_expression();
        while ("/*%".includes(this.at().value)) {
            const operator = this.eat().value;
            const right = this.parse_call_member_expression();
            left = {
                kind: "BinaryExpression",
                operator,
                left,
                right,
            } as BinaryExpression;
        }

        return left;
    }

    private parse_call_member_expression(): Expression {
        const member = this.parse_member_expression();
        if (this.at().type == TokenType.OpenParen) {
            return this.parse_call_expression(member);
        }

        return member;
    }

    private parse_call_expression(target: Expression): Expression {
        let callExpression: Expression = {
            kind: "CallExpression",
            target,
            arguments: this.parse_args(),
        } as CallExpression;

        if (this.at().type == TokenType.OpenParen) {
            callExpression = this.parse_call_expression(callExpression);
        }

        return callExpression;
    }

    private parse_args(): Expression[] {
        this.expect(TokenType.OpenParen, "you need a parenthesis in arguments list", "args");
        const args =
            this.at().type == TokenType.CloseParen
                ? []
                : this.parse_args_list();
        this.expect(
            TokenType.CloseParen,
            "you have to close your parenthesis in argument list",
            "args"
        );
        return args;
    }

    private parse_args_list(): Expression[] {
        const args = [this.parse_object_expression()];
        while (this.at().type == TokenType.Comma && this.eat()) {
            args.push(this.parse_expression());
        }
        return args;
    }

    private parse_member_expression(): Expression {
        let object = this.parse_primary_expression();
        while (
            this.at().type == TokenType.Period ||
            this.at().type == TokenType.OpenBracket
        ) {
            const operator = this.eat();
            let property: Expression;
            let computed: boolean;
            if (operator.type == TokenType.Period) {
                computed = false;
                property = this.parse_primary_expression();

                if (property.kind !== "Identifier") {
                    throw "you have to have an identifier after a period while getting object property";
                }
            } else {
                // must be a open bracket, so its computed
                computed = true;
                property = this.parse_expression();
                this.expect(
                    TokenType.CloseBracket,
                    "you have to close an open bracket when getting computed object properties",
                    "member_expression"
                );
            }
            object = {
                kind: "MemberExpression",
                object,
                property,
                computed,
            } as MemberExpression;
        }
        return object;
    }

    private parse_primary_expression(): Expression {
        const token = this.at();
        switch (token.type) {
            case TokenType.Identifier:
                return {
                    kind: "Identifier",
                    symbol: this.eat().value,
                } as Identifier;
            case TokenType.Number:
                return {
                    kind: "NumericLiteral",
                    value: parseFloat(this.eat().value),
                } as NumericLiteral;
            case TokenType.String:
                return {
                    kind: "StringLiteral",
                    value: this.eat().value,
                } as StringLiteral;
            case TokenType.OpenParen: {
                this.eat();
                const value = this.parse_expression();
                this.expect(
                    TokenType.CloseParen,
                    "you need to close your parenthesis!1!1",
                    "primary_expression"
                );
                return value;
            }
            default: {
                throw `parser: what is a TokenType.${token_to_json(this.at()).type} at pos ${this.at().position}?`;
            }
        }
    }
}
