export enum TokenType {
	// literals
	Number,
	Identifier,
	String,
	// symbols/characters
	ExlamationMark,
	QuestionMark,
	Equals,
	OpenParen, // (
	CloseParen, // )
	OpenBrace, // {
	CloseBrace, // }
	OpenBracket, // [
	CloseBracket, // ]
	BinaryOperator,
	Semicolon,
	Colon,
	Period,
	Comma,
	// keywords
	Let,
	Const,
	Function,
	Async,
	Return,
	While,
	For,
	If,
	Break,

	// just an end of file. thats it.
	EndOfFile,
}
const keywords: Record<string, TokenType> = {
	let: TokenType.Let,
	const: TokenType.Const,
	function: TokenType.Function,
	async: TokenType.Async,
	return: TokenType.Return,
	while: TokenType.While,
	for: TokenType.For,
	if: TokenType.If,
	break: TokenType.Break,
};

export interface Token {
	value: string;
	type: TokenType;
}

function token(value = "", type: TokenType): Token {
	return { value, type } as Token;
}

function isalpha(value: string): boolean {
	return value.toUpperCase() !== value.toLowerCase();
}

function isint(value: string): boolean {
	const curCode = value.charCodeAt(0);
	const bounds = ["0".charCodeAt(0), "9".charCodeAt(0)];
	return curCode >= bounds[0] && curCode <= bounds[1]; // in between 0 and 9
}

function iswhitespace(value: string): boolean {
	return value == "\t" || value == "\n" || value == "\r" || value == " ";
}

export function tokenize(sourceCode: string, debugMode: boolean): Token[] {
	const tokens = new Array<Token>();
	const src = sourceCode.split("");
	if (debugMode) console.log(`reading ${src.length} characters`);
	while (src.length > 0) {
		if (src[0] == "(") {
			tokens.push(token(src.shift(), TokenType.OpenParen));
		} else if (src[0] == "{") {
			tokens.push(token(src.shift(), TokenType.OpenBrace));
		} else if (src[0] == "}") {
			tokens.push(token(src.shift(), TokenType.CloseBrace));
		} else if (src[0] == "[") {
			tokens.push(token(src.shift(), TokenType.OpenBracket));
		} else if (src[0] == "]") {
			tokens.push(token(src.shift(), TokenType.CloseBracket));
		} else if (src[0] == ")") {
			tokens.push(token(src.shift(), TokenType.CloseParen));
		} else if (src[0] == ";") {
			tokens.push(token(src.shift(), TokenType.Semicolon));
		} else if (src[0] == ":") {
			tokens.push(token(src.shift(), TokenType.Colon));
		} else if (src[0] == ",") {
			tokens.push(token(src.shift(), TokenType.Comma));
		} else if (src[0] == "?") {
			if (src[1] == "?") {
				src.shift(); // remove first question mark
				src.shift(); // remove second question mark
				tokens.push(token("??", TokenType.BinaryOperator)); // Nullish Coalescing operator (google it)
			} else {
				tokens.push(token(src.shift(), TokenType.QuestionMark));
			}
		} else if (src[0] == "!") {
			if (src[1] == "=") {
				src.shift();
				src.shift();
				tokens.push(token("!=", TokenType.BinaryOperator)); // Not Equal To operator
			} else {
				tokens.push(token("!", TokenType.ExlamationMark)); // inverts boolean values. (bonus: using !! will translate your value to boolean directly)
			}
		} else if (src[0] == ".") {
			tokens.push(token(src.shift(), TokenType.Period));
		} else if (">=<=".includes(src[0])) {
			if (src[1] == "=") {
				tokens.push(token(src.shift() + "=", TokenType.BinaryOperator));
				src.shift(); // account for the equal sign
			} else if (src[0] == "=") {
				tokens.push(token(src.shift(), TokenType.Equals));
			} else {
				tokens.push(token(src.shift(), TokenType.BinaryOperator));
				// great.
			}
		} else if (src[0] == '"') {
			// quotation mark! woohoo
			let string = "";
			src.shift(); // remove the quote
			while (src.length > 0 && src[0] !== '"') {
				string += src.shift();
			}
			if (src[0] !== '"') {
				// They never closed the quote!
				// Let's error to let them know.
				throw "oh no! an error! you forgot to close a quotation mark, and now i don't know when to stop";
			}
			src.shift(); // remove the quote
			tokens.push(token(string, TokenType.String));
		} else if (isalpha(src[0])) {
			let str = "";
			while (src.length > 0 && (isalpha(src[0]) || isint(src[0]))) {
				// Do while current letter is alphanumeric
				str += src.shift();
			}
			if (keywords[str]) {
				tokens.push(token(str, keywords[str]));
			} else {
				tokens.push(token(str, TokenType.Identifier));
			}
		} else if (isint(src[0])) {
			let num = "";
			while (src.length > 0 && isint(src[0])||src[0]==".") {
				// Do while current letter is alphanumeric
				num += src.shift();
			}

            if (num.indexOf(".")!==num.lastIndexOf(".")) {
                // There's 2 decimal points! That's not supposed to happen.
                throw "tokenizer: cannot have multiple decimal points in one number literal"
            }

			tokens.push(token(num, TokenType.Number));
		} else if (iswhitespace(src[0])) {
			src.shift();
		} else if ("+-/*%".includes(src[0])) {
			if (src[0] == "+" && src[1] == "+") {
				src.shift();
				tokens.push(token(src.shift() + "+", TokenType.BinaryOperator));
			} else if (src[0] == "-" && src[1] == "-") {
				src.shift();
				tokens.push(token(src.shift() + "-", TokenType.BinaryOperator));
			} else if (src[1] == "=") {
				tokens.push(token(src.shift() + "=", TokenType.BinaryOperator));
				src.shift();
			} else if (src[0] == "/" && src[1] == "/") {
                // It's a comment. Don't add any tokens until we reach a newline.
                while (src.length > 0 && src[0]!=="\n"&&src[0]!=="\r") {
                    src.shift()
                }
			} else {
				tokens.push(token(src.shift(), TokenType.BinaryOperator));
			}
		} else {
			throw (
				"invalid token, here's what i got:" +
				src[0] +
				src[0].charCodeAt(0)
			);
		}
	}

	tokens.push(token("eof", TokenType.EndOfFile));
	if (debugMode) console.log("done tokenizing, your turn parser");
	return tokens;
}
