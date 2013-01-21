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

var tokenize = function(schema, cb) {
    var tokens = [];

    var parse_uint = function() {
        var token = '';

        var ch = schema[i];
        while(is_num(ch)) {
            token += ch;
            ch = schema[++i];
        }

        parse_name(); //numSufix
        return token;
    }

    var parse_hex = function() {
        var token = '';

        var ch = schema[i];
        while(is_hex(ch)) {
            token += ch;
            ch = schema[++i];
        }

        parse_name(); //numSufix
        return token;
    }

    var parse_name = function() {
        var token = '';

        var ch = schema[i];
        while(is_namechar(ch) || is_num(ch)) {
            token += ch;
            ch = schema[++i];
        }

        return token;
    }

    var parse_until = function(term) {
        var token = '';
        var ch = schema[i];
        while(!is_newline(ch) && ch != term) {
            token += ch;
            ch = schema[++i];
        }

        return token;
    }

    var push_when_match = function(keyword) {
        if(Array.isArray(keyword)) {
            for(var j = 0; j < keyword.length; j++) {
                if(push_when_match(keyword[j])) {
                    return true;
                }
            }

            return false;
        }

        for(var j = 0; j < keyword.length; j++) {
            if(keyword[j] != schema[i+j]) {
                return false;
            }
        }

        i += j;
        tokens.push([keyword]);
        return true;
    }

    var len = schema.length;
    for(var i = 0; i < len;) {
        while(push_when_match(terminals)) {}

        switch(schema[i]) {
            //line separators
        case '#':
            while(schema[i] != '\n') { ++i; }
        case ' ':
        case '\t':
        case '\n':
            ++i;
            break;

        case '-':
            tokens.push(['int', '-' + parse_uint()]);
            break;

        case '0':
            if(schema[i+1] == 'x') {
                i += 2; tokens.push(['hex', '0x' + parse_hex()]);
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
            tokens.push(['uint', parse_uint()]);
            break;

        case '\\':
            ++i; tokens.push(['name', parse_name()]);
            break;

        case '(':
            ++i; tokens.push(['contype', parse_until(')')]); i += 2;
            break;
        case '"':
            ++i; tokens.push(['litseg', parse_until('"')]); i += 2;
            break;
        case "'":
            ++i; tokens.push(['litseg', parse_until("'")]); i += 2;
            break;

        case '@':
            ++i; tokens.push(['annotname', parse_name()]);
            break;

        default:
            var name = parse_name();
            if(keywords.indexOf(name) != -1) {
                tokens.push([name]);
            } else {
                tokens.push(['name', name]);
            }
        }
    }

    cb(null, tokens);
}

var check_token = function(token) {
    if(keywords.indexOf(token[0]) != -1) {
        return true;
    }

    if(terminals.indexOf(token[0]) != -1) {
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
