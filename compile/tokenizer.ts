export enum TokenType {
	//- literals
	Number,
	Identifier,
	String,
	//- symbols/characters
	ExlamationMark,
	QuestionMark,
	Equals,
	OpenParen, //- (
	CloseParen, //- )
	OpenBrace, //- {
	CloseBrace, //- }
	OpenBracket, //- [
	CloseBracket, //- ]
	BinaryOperator,
	Semicolon,
	Colon,
	Period,
	Comma,
	//- keywords
	Let,
	Const,
	Function,
	Async,
	Return,
	While,
	For,
	If,
	Break,
	//- Class Keywords
	New,
	Extends,
	This,
	Class,
	Public,
	Private,
	Super, //- will not implement because no.
	//- Parser-only
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
	class: TokenType.Class,
	public: TokenType.Public,
	private: TokenType.Private,
	super: TokenType.Super,
	new: TokenType.New,
	this: TokenType.This,
	extends: TokenType.Extends,
};

export interface Token {
	value: string;
	type: TokenType;
    position: string;
}

function token(value = "", type: TokenType, line:number, column: number): Token {
	return { value, type, position: `${line}:${column}`} as Token;
}

function isalpha(value: string): boolean {
	return value.toUpperCase() !== value.toLowerCase();
}

function isint(value: string): boolean {
	const curCode = value.charCodeAt(0);
	const bounds = ["0".charCodeAt(0), "9".charCodeAt(0)];
	return curCode >= bounds[0] && curCode <= bounds[1]; // in between 0 and 9
}

function isnewline(value:string) {
    return value == "\n"
}

function iswhitespace(value: string): boolean {
	return value == "\t" || value == "\n" || value == "\r" || value == " ";
}

export function token_to_json(token: Token) {
    return {value: token.value, type: TokenType[token.type], position: token.position}
}

export function token_array_to_json(tokenArray:Token[]) {
    return tokenArray.map(token=>{return token_to_json(token)})
}

export function tokenize(sourceCode: string, debugMode: boolean): Token[] {
	const tokens = new Array<Token>();
    let lineNum = 1;
    let columnNum = 1;
	const src = sourceCode.split("");
	if (debugMode) {
        console.log(`tokenizing ${src.length} characters`);
        console.time("lexer");
	}
	while (src.length > 0) {
        if (src[0] == "(") {
            columnNum++;
            tokens.push(token(src.shift(), TokenType.OpenParen, lineNum, columnNum));
		} else if (src[0] == "{") {
            columnNum++;
			tokens.push(token(src.shift(), TokenType.OpenBrace, lineNum, columnNum));
		} else if (src[0] == "}") {
            columnNum++;
			tokens.push(token(src.shift(), TokenType.CloseBrace, lineNum, columnNum));
		} else if (src[0] == "[") {
            columnNum++;
			tokens.push(token(src.shift(), TokenType.OpenBracket, lineNum, columnNum));
		} else if (src[0] == "]") {
            columnNum++;
            tokens.push(token(src.shift(), TokenType.CloseBracket, lineNum, columnNum));
		} else if (src[0] == ")") {
            columnNum++;
			tokens.push(token(src.shift(), TokenType.CloseParen, lineNum, columnNum));
		} else if (src[0] == ";") {
            columnNum++;
			tokens.push(token(src.shift(), TokenType.Semicolon, lineNum, columnNum));
		} else if (src[0] == ":") {
            columnNum++;
            tokens.push(token(src.shift(), TokenType.Colon, lineNum, columnNum));
		} else if (src[0] == ",") {
            columnNum++;
			tokens.push(token(src.shift(), TokenType.Comma, lineNum, columnNum));
		} else if (src[0] == "?") {
			if (src[1] == "?") {
				src.shift(); // remove first question mark
				src.shift(); // remove second question mark
                columnNum++;
                columnNum++;
				tokens.push(token("??", TokenType.BinaryOperator, lineNum, columnNum)); // Nullish Coalescing operator (google it)
			} else {
                columnNum++;
				tokens.push(token(src.shift(), TokenType.QuestionMark, lineNum, columnNum));
			}
		} else if (src[0] == "!") {
			if (src[1] == "=") {
				src.shift();
				src.shift();
                columnNum++;
                columnNum++;
				tokens.push(token("!=", TokenType.BinaryOperator, lineNum, columnNum)); // Not Equal To operator
			} else {
                columnNum++;
				tokens.push(token("!", TokenType.ExlamationMark, lineNum, columnNum)); // inverts boolean values. (bonus: using !! will translate your value to boolean directly)
            }
		} else if (src[0] == ".") {
            columnNum++;
			tokens.push(token(src.shift(), TokenType.Period, lineNum, columnNum));
		} else if (">=<=".includes(src[0])) {
			if (src[1] == "=") {
                src.shift(); // account for the equal sign
                columnNum++;
                columnNum++;
                tokens.push(token(src.shift() + "=", TokenType.BinaryOperator, lineNum, columnNum));
			} else if (src[0] == "=") {
                columnNum++;
                tokens.push(token(src.shift(), TokenType.Equals, lineNum, columnNum));
			} else {
                columnNum++;
                tokens.push(token(src.shift(), TokenType.BinaryOperator, lineNum, columnNum));
				// great.
			}
		} else if (src[0] == '"') {
			// quotation mark! woohoo
			let string = "";
			src.shift(); // remove the quote
            columnNum++; // count for the quote
			while (src.length > 0 && src[0] !== '"') {
				string += src.shift();
                columnNum++;
			}
			if (src[0] !== '"') {
				// They never closed the quote!
				// Let's error to let them know.
				throw "oh no! an error! you forgot to close a quotation mark, and now i don't know when to stop";
			}
			src.shift(); // remove the quote
            columnNum++;
			tokens.push(token(string, TokenType.String, lineNum, columnNum));
		} else if (isalpha(src[0])) {
			let str = "";
			while (src.length > 0 && (isalpha(src[0]) || isint(src[0]))) {
				// Do while current letter is alphanumeric
				str += src.shift();
                columnNum++;
			}
			if (keywords[str]!=undefined&&typeof keywords[str]!="function") { // Certain strings like "constructor" are built into every JS and TS class, meaning "keywords["constructor"]" would return a function(ew)
				tokens.push(token(str, keywords[str], lineNum, columnNum));
			} else {
				tokens.push(token(str, TokenType.Identifier, lineNum, columnNum));
			}
		} else if (isint(src[0])) {
			let num = "";
			while ((src.length > 0 && isint(src[0])) || src[0] == ".") {
				// Do while current letter is alphanumeric
				num += src.shift();
                columnNum++;
			}

			if (num.indexOf(".") !== num.lastIndexOf(".")) {
				// There's 2 decimal points! That's not supposed to happen.
				throw "tokenizer: cannot have multiple decimal points in one number literal";
			}

			tokens.push(token(num, TokenType.Number, lineNum, columnNum));
		} else if (iswhitespace(src[0])) {
            columnNum++ // in case it is just a space
            if (isnewline(src[0])) { // in case it is a newline
                columnNum = 1; 
                lineNum++
            }
            src.shift();
		} else if ("+-/*%".includes(src[0])) {
			if (src[0] == "+" && src[1] == "+") {
				src.shift();
				tokens.push(token(src.shift() + "+", TokenType.BinaryOperator, lineNum, columnNum));
                columnNum++;
			} else if (src[0] == "-" && src[1] == "-") {
				src.shift();
				tokens.push(token(src.shift() + "-", TokenType.BinaryOperator, lineNum, columnNum));
                columnNum++;
                columnNum++;
			} else if (src[1] == "=") {
				src.shift();
				tokens.push(token(src.shift() + "=", TokenType.BinaryOperator, lineNum, columnNum));
                columnNum++;
                columnNum++;
			} else if (src[0] == "/" && src[1] == "/") {
				// It's a comment. Don't add any tokens until we reach a newline.
                columnNum++; // Still gotta add column number tho.
                columnNum++;
				while (src.length > 0 && src[0] !== "\n" && src[0] !== "\r") {
					src.shift();
                    columnNum++;
				}
			} else {
                columnNum++;
				tokens.push(token(src.shift(), TokenType.BinaryOperator, lineNum, columnNum));
			}
		} else {
			throw (
				"invalid token, here's what i got:" +
				src[0] +
				src[0].charCodeAt(0) +
                `${lineNum}:${columnNum}`
			);
		}
	}

	tokens.push(token("eof", TokenType.EndOfFile, lineNum, columnNum));
	if (debugMode) {
        console.timeEnd("lexer");
        console.log("done tokenizing, your turn parser");
    }
	return tokens;
}
