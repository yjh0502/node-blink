var fs = require('fs'),
    assert = require('assert'),
    async = require('async');

var parser = require('../lib/parser');

var schema_dir_valid = './test/schemas/valid/';
var schema_dir_invalid_lexer = './test/schemas/invalid_lexer/';
var schema_dir_invalid_parser = './test/schemas/invalid_parser/';

var get_schemas = function(schema_dir) {
    var schema_filenames = fs.readdirSync(schema_dir);
    var schemas = [];
    var map = {};
    for(var i = 0; i < schema_filenames.length; i++) {
        var filename = schema_filenames[i];
        if(filename[0] == '.') {
            continue;
        }
        var schema = fs.readFileSync(schema_dir + filename, 'utf8');
        schemas.push(schema);

        map[filename] = schema;
    }

    return map;
}

var schema_sets = {
    valid: get_schemas(schema_dir_valid),
    invalid_lexer: get_schemas(schema_dir_invalid_lexer),
    invalid_parser: get_schemas(schema_dir_invalid_parser),
};

describe('general', function() {
    it('schema folder should contains .blink files only', function(done) {
        for(var set_id in schema_sets) {
            var schemas = schema_sets[set_id];
            for(var filename in schemas) {
                assert.equal(filename.indexOf('.blink'), (filename.length -  6));
            }

        }

        done();
    });
});


module.exports = {
    schema_sets: schema_sets,

    get_test_schema: function(name) {
        for(var set_id in schema_sets) {
            var schemas = schema_sets[set_id];
            for(var filename in schemas) {
                if(filename == name || filename == (name + ".blink")) {
                    return schemas[filename];
                }
            }
        }

        return null;
    },
}
