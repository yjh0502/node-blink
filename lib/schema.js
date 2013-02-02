var util = require('util');

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

var print_if_exists = function(obj, name) {
    if(obj[name] != null && obj[name].length > 0) {
        return "\n\t" + name + ":\n" + print_list(obj[name], '\t');
    }
    return "";
}

var IncrAnnotation = function(target, annotation, value) {
    this.target = target;
    this.annotation = annotation;
    this.value = value;
}

IncrAnnotation.prototype.toString = function() {
    var ret = "[IncrAnnotation " + this.target + " <- ";
    if(this.annotation != null) {
        ret += this.annotation + "]";
    } else {
        ret += this.value + "]";
    }
    return ret;
}

var Annotation = function(name, literal) {
    this.name = name;
    this.literal = literal;
}

Annotation.prototype.toString = function() {
    return "[Annotation " + this.name + ": " + print_list(this.literal, '') + "]";
}

var Name = function(name, id) {
    var split = name.split(':');
    if(split.length == 1) {
        this.namespace = "_local";
        this.name = split[0];
    } else {
        this.namespace = split[0];
        this.name = [1];
    }

    this.id = id;
}

Name.prototype.fullName = function() {
    return this.namespace + ":" + this.name;
}

Name.prototype.toString = function() {
    return "[Name " + this.name + "/" + this.id + "]";
}

var Type = function() {
    this.type = '';
    this.ref = false;
    this.dynamic = false;
    this.sequence = false;
    this.opt = false;
}

Type.prototype.toString = function() {
    var ret = "[Type " + this.type;
    if(this.ref == true) {
        ret += " (ref)";
    }
    if(this.dynamic == true) {
        ret += " *";
    }
    if(this.sequence == true) {
        ret += " []";
    }
    if(this.opt == true) {
        ret += " ?";
    }
    ret += "]";

    return ret;
}

var Field = function(name, type) {
    this.name = name;
    this.type = type;
    this.opt = false;
}

Field.prototype.toString = function() {
    var ret = "[Field " + this.name;
    if(this.opt) {
        ret += "?";
    }
    ret += ", " + this.type + "]";

    return ret;
}

function GroupDef(name, parent, body) {
    this.name = name;
    this.parent = parent;
    this.fields = body;
}

GroupDef.prototype.toString = function() {
    var ret = "[GroupDef " + this.name + "\n";
    for(var i = 0; i < this.fields.length; i++) {
        ret += "\t" + this.fields[i] + "\n";
    }
    ret += "]";

    return ret;
}

function TypeDef(name, type) {
    this.name = name;
    this.type = type;
}

TypeDef.prototype.toString = function() {
    return "[TypeDef " + this.name + ": " + this.type + "]";
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
    this.namespace = '_local';
    this.typedefs = [];
    this.enums = [];
    this.groups = [];
    this.incrannots = [];

    this.symbols = {};
}

Schema.prototype.toString = function() {
    var ret = "[Schema namespace:" + this.namespace;

    ret += print_if_exists(this, 'typedefs');
    ret += print_if_exists(this, 'enums');
    ret += print_if_exists(this, 'groups');
    ret += print_if_exists(this, 'incrannots');

    ret += ']';
    return ret;
}

Schema.prototype.add = function(obj) {
    if(Array.isArray(obj)) {
        this.incrannots = this.incrannots.concat(obj);
        return;
    }
    //Add to symbol list

    if(obj.name.namespace == '_local') {
        obj.name.namespace = this.namespace;
    }
    var name = obj.name.fullName();

    if(this.symbols[name] != null) {
        throw new Error("Name already exists");
    }
    this.symbols[name] = obj;

    if(obj instanceof TypeDef) {
        this.typedefs.push(obj);
    } else if(obj instanceof Enum) {
        var occupied = {};
        for(var i = 0; i < obj.values.length; i++) {
            var value = obj.values[i];
            if(value.value == -1) {
                value.value = i + 1;
            }

            if(occupied[value.value]) {
                throw new Error("Enum should have a distinct value for all cases");
            }
            occupied[value.value] = true;
        }

        this.enums.push(obj);
    } else if (obj instanceof GroupDef) {
        if(name.id == -1) {
            name.id = (0x0fffffff * Math.random())|0;
        }

        for(var i = 0; i < this.groups.length; i++) {
            var group = this.groups[i];
            if(group.name.id == name.id) {
                throw new Error("Duplicated id for GroupDef " + name + ", with " + group);
            }
        }

        this.groups.push(obj);
    }
}

Schema.prototype.resolve_type_with_name = function(typename) {
    if(typename.indexOf(':') == -1) {
        typename = this.namespace + ':' + typename;
    }

    var symbol = this.symbols[typename];
    if(symbol == null) {
        throw new Error("Invalid symbol name: '" + typename + "', should be group name or type name");
    }
    if(this.cache[typename] != null) {
        return this.cache[typename];
    }

    if(symbol instanceof GroupDef) {
        this.build_layout(symbol);
        return this.cache[typename];
    } else if(symbol instanceof TypeDef) {
        return this.resolve_type(symbol.type);
    }

    return null;
}

Schema.prototype.resolve_type = function(type) {
    if(type.ref == false) {
        return {
            name: type.type,
            primitive: true,
            sequence: false,
            optional: false,
        }
    }

    return this.resolve_type_with_name(type.type);
}

Schema.prototype.build_layout = function(group) {
    var name = group.name.name;
    var fullname = group.name.fullName();
    var cache = this.cache[fullname];

    if(cache == '_marked') {
        throw new Error("Recursive definition: " + name);
    } else if(cache != null) {
        return cache;
    }
    this.cache[fullname] = '_marked';

    var layout = [];
    var add_to_layout = function(name, resolved_type, type) {
        if(type == null) {
            type = {
                sequence: false,
                dynamic: false,
                optional: false,
                opt: false,
            };
        }

        if(resolved_type.primitive) {
            layout.push({
                name: name.name,
                type: resolved_type.name,
                primitive: resolved_type.primitive,
                sequence: type.sequence,
                optional: type.opt,
            });
        } else {
            var seq = resolved_type.sequence;
            var resolved_sequence = seq ? seq : false;
            layout.push({
                name: name.name,
                type: resolved_type.name,
                primitive: resolved_type.primitive,
                dynamic: type.dynamic,
                sequence: type.sequence || resolved_type.sequence,
                optional: type.opt,
                layout: resolved_type.layout,
            });
        }
    }

    if(group.parent != null) {
        var resolved_type = this.resolve_type_with_name(group.parent);
        if(resolved_type.primitive) {
            throw new Error("Inheritence parent should a group, not primitive type\n" +
                "type " + group.parent + " resolved into:\n" + 
                util.inspect(resolved_type, false, null));
        }

        add_to_layout(new Name('_parent', -1), resolved_type);
    }

    for(var i = 0; i < group.fields.length; i++) {
        var field = group.fields[i];
        var type = field.type;
        var resolved_type = this.resolve_type(type);

        if(resolved_type.primitive && type.dynamic) {
            throw new Error("primitive type could not be defined as a dynamic");
        }

        if(type.sequence && resolved_type.sequence) {
            throw new Error("Type could not be a double-sequence (2-d array)");
        }

        add_to_layout(field.name, resolved_type, type);
    }

    var type_info = {
        name: group.name,
        primitive: false,
        layout: layout,
    }

    this.cache[name] = type_info;
}

Schema.prototype.build = function() {
    this.cache = {};

    for(var i = 0; i < this.groups.length; i++) {
        var group = this.groups[i];
        if(this.cache[group.name.name] == null) {
            this.build_layout(group);
        }
    }
//    console.log(util.inspect(this.cache, false, null));
    console.log(this.cache);
}

module.exports = {
    Schema: Schema,

    GroupDef: GroupDef,
    Field: Field,

    TypeDef: TypeDef,

    Enum: Enum,
    EnumValue: EnumValue,

    Name: Name,
    Type: Type,

    IncrAnnotation: IncrAnnotation,
    Annotation: Annotation,
}
