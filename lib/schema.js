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
    this.incrannots = [];
}

Schema.prototype.toString = function() {
    var ret = "[Schema namespace:" + this.namespace;

    ret += print_if_exists(this, 'defines');
    ret += print_if_exists(this, 'enums');
    ret += print_if_exists(this, 'groups');
    ret += print_if_exists(this, 'incrannots');

    ret += ']';
    return ret;
}

module.exports = {
    Schema: Schema,

    Group: Group,
    Field: Field,

    Define: Define,

    Enum: Enum,
    EnumValue: EnumValue,

    Name: Name,

    IncrAnnotation: IncrAnnotation,
    Annotation: Annotation,
}
