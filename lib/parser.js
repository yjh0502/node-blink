var lexer = require('./lexer'),
    schema = require('./schema');

var Parser = function(tokens) {
    this.i = 0;
    this.tokens = tokens;

    this.token = this.tokens[this.i];
    this.sym = this.token[0];
}

Parser.prototype.accept = function(s) {
    if(this.sym == s) {
        var token_prev = this.token;
        if(this.i < this.tokens.length-1) {
            this.token = this.tokens[++this.i];
            this.sym = this.token[0];
        } else {
            this.token = null;
            this.sym = null;
        }

        return token_prev;
    }
    return null;
}

Parser.prototype.accept_list = function(l) {
    var t = null;
    for(var i = 0; i < l.length; i++) {
        t = this.accept(l[i]);
        if(t != null) {
            break;
        }
    }

    return t;
}

Parser.prototype.ahead = function(sym) {
    if(this.i == this.tokens.length - 1) {
        return false;
    }

    return (this.tokens[this.i+1][0] == sym);
}

Parser.prototype.expect = function(sym) {
    var t = this.accept(sym);
    if(t == null) {
        console.log(this.token);
        throw new Error("Expect " + sym);
    }
    return t;
}
    
Parser.prototype.expect_list = function(l) {
    var t = this.accept_list(l);
    if(t == null) {
        throw new Error("Expect " + this.sym);
    }
    return t;
}

Parser.prototype._field = function() {
    var field = new schema.Field();

    var annots1 = this._annots();
    var t = this.accept_list(lexer.keywords);
    if(t != null) {
        field.type = t[0];

        if(t[0] == 'string') {
            var t_contype = this.accept('contype');
            if(t_contype != null) {
                field.contype = t_contype[1];
            }
        }
    } else {
        field.ref = true;
        field.type = this._qname();

        if(this.accept('*')) {
            field.dynamic = true;
        }
    }

    if(this.accept('[')) {
        this.expect(']');
        field.sequence = true;
    }

    var annots2 = this._annots();

    field.name = this._namewithid();

    if(this.accept('?')) {
        field.opt = true;
    }

    return field;
}

Parser.prototype._fields = function(schema) {
    while(true) {
        var field = this._field();
        schema.fields.push(field);
        if(this.accept(',') == null) {
            break;
        }
    }
}

Parser.prototype._body = function(schema) {
    if(this.accept('->')) {
        this._fields(schema);
    }
}

Parser.prototype._qname = function() {
    var t = this.expect('name');
    var name = t[1];
    if(this.accept(':')) {
        t = this.expect('name');
        name += ':' + t[1];
    }

    return name;
}

Parser.prototype._super = function(schema) {
    if(this.accept(':')) {
        schema.super = this._qname();
    }
}

Parser.prototype._id = function() {
    if(this.accept('/')) {
        var t = this.expect_list(['uint', 'hex']);
        return Number(t[1]);
    }
    return -1;
}

Parser.prototype._namewithid = function() {
    var name = new schema.Name();
    var t = this.expect('name');
    var name = t[1];
    var id = this._id();

    return new schema.Name(name, id);
}

Parser.prototype._groupdef = function(schema) {
    this._super(schema);
    this._body(schema);
}

Parser.prototype._val = function() {
    this.expect('/');
    var t = this.expect_list(['int', 'uint', 'hex']);
    return Number(t[1]);
}

Parser.prototype._sym = function() {
    var annot = this._annots();

    var name = this.expect('name');
    var id = this._val();

    return new schema.EnumValue(name, id);
}

Parser.prototype._annot = function() {
    var t = this.expect('annotname');
    this.expect('=');

    var literal = [];
    while(true) {
        var l = this.accept('litseg');
        if(l == null) {
            break;
        }
        literal.push(l[1]);
    }
    
    return new schema.Annotation(t[1], literal);
}

Parser.prototype._annots = function() {
    var list = [];
    
    while(this.sym == 'annotname') {
        list.push(this._annot());
    }

    return list;
}

Parser.prototype._compref = function() {
    if(this.accept('schema')) {
        return 'schema';
    }

    var qname = this._qname();
    this.expect('.');
    if(this.accept('type')) {
        return qname + ".type";
    }

    var name = this.expect('name');
    if(this.accept('.')) {
        this.expect('type');
        return qname + '.' + name + '.type';
    }

    return qname + '.' + name;
}

Parser.prototype._incrannotitem = function() {
    var t = this.accept_list(['int', 'uint', 'hex']);
    if(t != null) {
        return Number(t[1]);
    }

    return this._annot();
}

Parser.prototype._incrannotlist = function() {
    var list = [];

    do {
        list.push(this._incrannotitem());
    } while(this.accept('<-'));

    return list;
}

Parser.prototype._incrannot = function() {
    var compref = this._compref();
    this.expect('<-');
    var annotlist = this._incrannotlist();

    var list = [];
    for(var i = 0; i < annotlist.length; i++) {
        var item = annotlist[i];
        if(item instanceof schema.Annotation) {
            list.push(new schema.IncrAnnotation(compref, item, 0));
        } else {
            list.push(new schema.IncrAnnotation(compref, null, item));
        }
    }

    return list;
}

Parser.prototype._def = function() {
    this._annots();
    
    //CHEAT: single token look-ahead
    if(this.i < this.tokens.length-1 && this.ahead('<-')) {
        return this._incrannot();
    } else {
        var annots = this._annots();

        var name = this._namewithid();
        if(this.accept('=')) {
            var t = this.accept_list(lexer.keywords);
            if(t != null) { //define
                var annots2 = this._annots();
                return new schema.Define(name, t[0]);
            } else { // enum
                this.accept('|');
                var list = [];
                do {
                    var enumval = this._sym();
                    list.push(enumval);
                } while(this.accept('|'));

                return new schema.Enum(name, list);
            }
        } else {
            var group = new schema.Group(name);
            this._groupdef(group);
            return group;
        }
    }
}

Parser.prototype._defs = function(s) {
    while(!this.accept('eof')) {
        var def = this._def();
        if(def instanceof schema.Define) {
            s.defines.push(def);
        } else if(def instanceof schema.Enum) {
            s.enums.push(def);
        } else if (def instanceof schema.Group) {
            s.groups.push(def);
        } else if(Array.isArray(def)) {
            s.incrannots = s.incrannots.concat(def);
        }
    }
    return s;
}

Parser.prototype._schema = function() {
    var s = new schema.Schema();

    if(this.accept('namespace') != null) {
        var namespace = this.expect('name');
        s.namespace = namespace;
    }
    return this._defs(s);
}

var parse = function(schema, cb) {
    lexer.tokenize(schema, function(err, tokens) {
        try {
            var parser = new Parser(tokens);
            var s = parser._schema();

            cb(null, s);
        } catch(e) {
            cb(e);
        }
    });
}

module.exports = {
    parse: parse,
}
