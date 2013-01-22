var is_line_sep = function(ch) {
    return ch == '#' || ch == ' ' || ch == '\t' || ch == '\n';
}

var is_newline = function(ch) {
    return ch == '\n';
}

var is_namechar = function(ch) {
    return (ch >= 'A' && ch <= 'Z') || (ch >= 'a' && ch <= 'z') || ch == '_';
}

var is_num = function(ch) {
    return (ch >= '0' && ch <= '9');
}

var is_hex = function(ch) {
    return is_num(ch) || (ch >= 'a' && ch <= 'f') || (ch >= 'A' && ch <= 'F');
}

var keywords = ['i8', 'u8', 'i16', 'u16', 'i32', 'u32', 'i64', 'u64',
    'f64', 'decimal', 'date', 'timeOfDay', 'nanotime', 'millitime',
    'bool', 'string', 'object'];

var terminals = ['->', '<-', ':', '=', '[', ']', '*', '|', '/', '.', ',', '?', 'namespace', 'type', 'schema'];
var nonterminals = ['name', 'annotname', 'hex', 'int', 'uint', 'contype', 'litseg'];

var Lexer = function(schema) {
    this.schema = schema;
    this.i = 0;
    this.len = schema.length;

    this.tokens = [];
}

Lexer.prototype.parse_uint = function() {
    var token = '';

    var ch = this.schema[this.i];
    while(is_num(ch)) {
        token += ch;
        ch = this.schema[++this.i];
    }

    this.parse_name(); //numSufix
    return token;
}

Lexer.prototype.parse_hex = function() {
    var token = '';

    var ch = this.schema[this.i];
    while(is_hex(ch)) {
        token += ch;
        ch = this.schema[++this.i];
    }

    this.parse_name(); //numSufix
    return token;
}

Lexer.prototype.parse_name = function() {
    var token = '';

    var ch = this.schema[this.i];
    while(is_namechar(ch) || is_num(ch)) {
        token += ch;
        ch = this.schema[++this.i];
    }

    return token;
}

Lexer.prototype.parse_until = function(term) {
    var token = '';
    var ch = this.schema[this.i];
    while(!is_newline(ch) && ch != term) {
        token += ch;
        ch = this.schema[++this.i];
    }

    return token;
}

Lexer.prototype.push_when_match = function(keyword) {
    for(var i = 0; i < keyword.length; i++) {
        if(keyword[i] != this.schema[this.i+i]) {
            return false;
        }
    }

    this.i += i;
    this.tokens.push([keyword]);
    return true;
}

Lexer.prototype.push_when_match_list = function(keywords) {
    for(var i = 0; i < keywords.length; i++) {
        if(this.push_when_match(keywords[i])) {
            return true;
        }
    }

    return false;
}

Lexer.prototype.tokenize = function() {
    while(this.i < this.len) {
        while(this.push_when_match_list(terminals)) {}

        switch(this.schema[this.i]) {
            //line separators
        case '#':
            while(this.schema[this.i] != '\n') { ++this.i; }
        case ' ':
        case '\t':
        case '\n':
            ++this.i;
            break;

        case '-':
            this.tokens.push(['int', '-' + this.parse_uint()]);
            break;

        case '0':
            if(this.schema[this.i+1] == 'x') {
                this.i += 2; this.tokens.push(['hex', '0x' + this.parse_hex()]);
                break;
            }
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
            this.tokens.push(['uint', this.parse_uint()]);
            break;

        case '\\':
            ++this.i; this.tokens.push(['name', this.parse_name()]);
            break;

        case '(':
            ++this.i; this.tokens.push(['contype', this.parse_until(')')]); this.i += 2;
            break;
        case '"':
            ++this.i; this.tokens.push(['litseg', this.parse_until('"')]); this.i += 2;
            break;
        case "'":
            ++this.i; this.tokens.push(['litseg', this.parse_until("'")]); this.i += 2;
            break;

        case '@':
            ++this.i; this.tokens.push(['annotname', this.parse_name()]);
            break;

        default:
            var name = this.parse_name();
            if(keywords.indexOf(name) != -1) {
                this.tokens.push([name]);
            } else {
                this.tokens.push(['name', name]);
            }
        }
    }

    this.tokens.push(['eof']);

    return this.tokens;
}

var tokenize = function(schema) {
    return new Lexer(schema).tokenize();
}

var check_token = function(token) {
    if(keywords.indexOf(token[0]) != -1) {
        return true;
    }

    if(terminals.indexOf(token[0]) != -1) {
        return true;
    }

    if(token[0] == 'eof') {
        return true;
    }

    var val = token[1];
    if(val == null || typeof(val) !== 'string') {
        return false;
    }

    switch(token[0]) {
        case 'name':
            return true;
        case 'hex':
        case 'uint':
            return !isNaN(val) && (Number(val) > 0);
        case 'int':
            return !isNaN(val);
        case 'contype':
            return true;
        case 'itseg':
            return true;
        default:
            return false;
    }

    return false;
}

var check_no_error = function(tokens) {
    for(var i = 0; i < tokens; i++) {
        if(check_token(tokens[i]) == false) {
            return false;
        }
    }

    return true;
}

module.exports = {
    keywords: keywords,
    terminals: terminals,
    nonterminals: nonterminals,

    tokenize: tokenize,
    check_no_error: check_no_error,
}
