var parser = require('./parser');

var print_list = function(l, prefix) {
    var str = '';
    for(var i = 0; i < l.length; i++) {
        var lines = l[i].toString().split('\n');
        for(var j = 0; j < lines.length; j++) {
            str += prefix + lines[j] + '\n';
        }
    }
    return str;
}

var Annotation = function(name, literal) {
    this.name = name;
    this.literal = literal;
}

Annotation.prototype.toString = function() {
    return "[Annotation " + this.name + ": " + print_list(this.literal) + "]";
}

var Name = function(name, id) {
    this.name = name;
    this.id = id;
}

Name.prototype.toString = function() {
    return "[Name " + this.name + "/" + this.id + "]";
}

var Field = function() {
    this.name = new Name('', -1);
    this.type = '';
    this.ref = false;
    this.dynamic = false;
    this.sequence = false;
    this.opt = false;
}

Field.prototype.toString = function() {
    var ret = "[Field " + this.name + " type:" + this.type;
    if(this.ref == true) {
        ret += " ref";
    }
    if(this.dynamic == true) {
        ret += " dynamic";
    }
    if(this.sequence == true) {
        ret += " sequence";
    }
    if(this.opt == true) {
        ret += " opt";
    }
    ret += "]";

    return ret;
}

function Group(name) {
    this.name = name;
    this.fields = [];
}

Group.prototype.toString = function() {
    var ret = "[Group " + this.name + "\n";
    for(var i = 0; i < this.fields.length; i++) {
        ret += "\t" + this.fields[i] + "\n";
    }
    ret += "]";

    return ret;
}

function Define(name, type) {
    this.name = name;
    this.type = type;
}

Define.prototype.toString = function() {
    return "[Define " + this.name + ": " + this.type + "]";
}

function EnumValue(name, value) {
    this.name = name;
    this.value = value;
}

EnumValue.prototype.toString = function() {
    return "[EnumValue " + this.name + ":" + this.value + "]";
}

function Enum(name, values) {
    this.name = name;
    this.values = values;
}

Enum.prototype.toString = function() {
    return "[Enum " + this.name + "\n\tvalues:\n" + print_list(this.values, '\t') + "]"; 
}

function Schema() {
    this.namespace = '';
    this.defines = [];
    this.enums = [];
    this.groups = [];
}

Schema.prototype.toString = function() {
    var ret = "[Schema namespace:" + this.namespace;

    if(this.defines.length > 0) {
        ret += "\n\tdefines:\n" + print_list(this.defines, '\t');
    }
    if(this.enums.length > 0) {
        ret += "\n\tenums:\n" + print_list(this.enums, '\t');
    }
    if(this.groups.length > 0) {
        ret += "\n\tgroups:\n" + print_list(this.groups, '\t');
    }

    ret += ']';
    return ret;
}

var handle_tokens = function(tokens, cb) {
    var i = 0;
    var token = tokens[i];
    var sym = token[0];
    var accept = function(s) {
        if(sym == s) {
            var token_prev = tokens[i];
            token = tokens[++i];
            if(token == undefined) {
                token = ['eof'];
            }
            sym = token[0];

            return token_prev;
        }
        return null;
    }

    var accept_list = function(l) {
        var t = null;
        for(var i = 0; i < l.length; i++) {
            t = accept(l[i]);
            if(t != null) {
                break;
            }
        }

        return t;
    }

    var expect = function(sym) {
        var t = accept(sym);
        if(t == null) {
            throw new Error("Expect " + sym);
        }
        return t;
    }
    
    var expect_list = function(l) {
        var t = accept_list(l);
        if(t == null) {
            throw new Error("Expect " + sym);
        }
        return t;
    }

    var _field = function() {
        var field = new Field();

        var annots1 = _annots();
        var t = accept_list(parser.keywords);
        if(t != null) {
            field.type = t[0];

            if(t[0] == 'string') {
                var t_contype = accept('contype');
                if(t_contype != null) {
                    field.contype = t_contype[1];
                }
            }
        } else {
            field.ref = true;
            field.type = _qname();

            if(accept('*')) {
                field.dynamic = true;
            }
        }

        if(accept('[')) {
            expect(']');
            field.sequence = true;
        }

        var annots2 = _annots();

        field.name = _namewithid();

        if(accept('?')) {
            field.opt = true;
        }

        return field;
    }

    var _fields = function(schema) {
        while(true) {
            var field = _field();
            schema.fields.push(field);
            if(accept(',') == null) {
                break;
            }
        }
    }

    var _body = function(schema) {
        if(accept('->')) {
            _fields(schema);
        }
    }

    var _qname = function() {
        var t = expect('name');
        var name = t[1];
        if(accept(':')) {
            t = expect('name');
            name += ':' + t[1];
        }

        return name;
    }

    var _super = function(schema) {
        if(accept(':')) {
            schema.super = _qname();
        }
    }

    var _id = function() {
        if(accept('/')) {
            var t = expect_list(['uint', 'hex']);
            return Number(t[1]);
        }
        return -1;
    }

    var _namewithid = function() {
        var name = new Name();
        var t = expect('name');
        var name = t[1];
        var id = _id();

        return new Name(name, id);
    }

    var _groupdef = function(schema) {
        _super(schema);
        _body(schema);
    }

    var _val = function() {
        expect('/');
        var t = expect_list(['int', 'uint', 'hex']);
        return Number(t[1]);
    }

    var _sym = function() {
        var annot = _annots();

        var name = expect('name');
        var id = _val();

        return new EnumValue(name, id);
    }

    var _annots = function() {
        var list = [];
        
        while(true) {
            var t = accept('annotname');
            if(t == null) {
                break;
            }

            expect('=');

            var literal = [];
            while(true) {
                var l = accept('litseg');
                if(l == null) {
                    break;
                }
                literal.push(l[1]);
            }

            list.push(new Annotation(t[1], literal));
        }

        return list;
    }

    var _def = function() {
        _annots();

        var name = _namewithid();
        if(accept('=')) {

            var annots = _annots();

            var t = accept_list(parser.keywords);
            if(t != null) { //define
                var annots2 = _annots();
                return new Define(name, t[0]);
            } else { // enum
                accept('|');
                var list = [];
                do {
                    var enumval = _sym();
                    list.push(enumval);
                } while(accept('|'));

                return new Enum(name, list);
            }
        } else {
            var group = new Group(name);
            _groupdef(group);
            return group;
        }
    }

    var _defs = function(schema) {
        while(sym != 'eof') {
            var def = _def();
            if(def instanceof Define) {
                schema.defines.push(def);
            } else if(def instanceof Enum) {
                schema.enums.push(def);
            } else if (def instanceof Group) {
                schema.groups.push(def);
            } else {
                throw new Error("Invalid return value with _def");
            }
        }
        return schema;
    }

    var _schema = function() {
        var schema = new Schema();

        if(accept('namespace') != null) {
            var namespace = expect('name');
            schema.namespace = namespace;
        }

        return _defs(schema);
    }

    try {
        var s = _schema();
        console.log(s.toString());

        if(sym != 'eof') {
            cb(new Error("Not all tokens are digested: " + token));
        } else {
            cb(null, s);
        }
    } catch(e) {
        cb(e);
    }
}

var parse = function(schema, cb) {
    parser.tokenize(schema, function(err, tokens) {
        console.log(tokens);
        if(err) { cb(err); return; }

        handle_tokens(tokens, cb);
    });
}

module.exports = {
    Schema: Schema,
    Group: Group,
    Define: Define,
    Enum: Enum,

    parse: parse,
    Field: Field,
}