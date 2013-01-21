var parser = require('./parser');

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

function Group() {
    this.name = new Name('', -1);
    this.fields = [];
}

Group.prototype.toString = function() {
    var ret = "[Group " + this.name + "\n";
    for(var i = 0; i < this.fields.length; i++) {
        ret += "\t" + this.fields[i] + "\n";
    }
    ret += "]\n";

    return ret;
}

function Define() {
}

function Enum() {
}

function Schema() {
    this.groups = [];
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

    var _define = function() {
        var annot = _annots();

    }

    var _annots = function() {
        return;
    }

    var _def = function() {
        _annots(schema);

        var name = _namewithid();
        if(accept('=')) {
            var define = new Define();
            _define(define);
        } else {
            var schema = new Schema();
            schema.name = name;
            _groupdef(schema);
        }

        return schema;
    }

    var _defs = function() {
        var defs = [];
        while(sym != 'eof') {
            defs.push(_def());
        }
        return defs;
    }

    var _schema = function() {
        if(accept('namespace') != null) {

        }
        return _defs();
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
        if(err) { cb(err); return; }

        handle_tokens(tokens, cb);
    });
}

module.exports = {
    Schema: Schema,
    Group: Group,

    parse: parse,
    Field: Field,
}
