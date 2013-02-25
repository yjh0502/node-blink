var assert = require('assert'),
    async = require('async'),
    base = require('./test_base'),
    parser = require('../lib/parser');

var obj_len = function(obj) {
    return Object.keys(obj).length;
}
describe('parser', function() {
    describe('#parse', function() {
        it('valid cases', function(done) {
            var count = obj_len(base.schema_sets.valid);
            for(var filename in base.schema_sets.valid) {
                var file = base.schema_sets.valid[filename];

                parser.parse(file, function(err, data) {
                    assert.equal(err, null, "Failed to parse: " + filename);

                    if(--count == 0) {
                        done();
                    }
                });
            }
        });

        it('invalid cases', function(done) {
            var cases = base.schema_sets.invalid_parser;
            var count = obj_len(cases);
            for(var filename in cases) {
                var file = cases[filename];

                parser.parse(file, function(err, data) {
                    assert.notEqual(err, null, "Failed to detect invalid case: " + filename);

                    if(--count == 0) {
                        done();
                    }
                });
            }
        });

/*
        it.only('custom test', function(done) {
            var name = 'Blink';
            parser.parse(base.get_test_schema(name), function(err, data) {
                if(err) {
                    assert(false, "Failed to parse\n" +  err.stack);
                }
                done();
            });
        });
    */
    });
});
