var fs = require('fs'),
    assert = require('assert'),
    async = require('async');

var parser = require('../lib/parser');

var schema_dir = './test/schema/';

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

describe('general', function() {
    it('schema folder should contains .blink files only', function(done) {
        for(var i = 0; i < schema_filenames; i++) {
            var filename = schema_filenames[i];
            assert.equal(filename.indexOf('.blink'), (filename.length -  6));
        }

        done();
    });
});


module.exports = {
    schema_filenames: schema_filenames,
    schemas: schemas,

    get_test_schema: function(name) {
        if(map[name] != null) {
            return map[name];
        } else if(map[name + ".blink"] != null) {
            return map[name + ".blink"];
        }

        return null;
    }
}
