var fs = require('fs'),
    assert = require('assert'),
    async = require('async');

var blink = require('../lib/blink');

var schema_dir = './test/schema/';

var schema_filenames = fs.readdirSync(schema_dir);
var schemas = [];
for(var i = 0; i < schema_filenames.length; i++) {
    var filename = schema_filenames[i];
    if(filename[0] == '.') {
        continue;
    }
    var schema = fs.readFileSync(schema_dir + filename, 'utf8');
    schemas.push(schema);
}

describe('general', function() {
    it('schema folder should contains .blink files only', function() {
        for(var i = 0; i < schema_filenames; i++) {
            var filename = schema_filenames[i];
            assert(filename.indexOf('.blink') === (filename.length -  6));
        }
    });
});

describe('tokenize', function() {
    describe('#tokenize', function() {
        it('correctness', function(done) {
            async.map(schemas, blink.tokenize, function(err, results) {
                assert(err == null);

                for(var i = 0; i < results.length; i++) {
                    var tokens = results[i];
                    assert(blink.check_no_error(tokens));
                }

                done();
            });
        });
    });
});
