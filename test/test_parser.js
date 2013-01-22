var assert = require('assert'),
    async = require('async'),
    base = require('./test_base'),
    parser = require('../lib/parser');

describe('parser', function() {
    describe('#parse', function() {
        it('correctness', function(done) {
            for(var filename in base.schema_sets.valid) {
                var file = base.schema_sets.valid[filename];

                parser.parse(file, function(err, data) {
                    if(err) {
                        assert(false, "Failed to parse " + file + ", " + err + ", " + err.stack);
                    }
                });
            }
            done();
        });

        it('test', function(done) {
            parser.parse(base.get_test_schema('minimal'));
            done();
        });
    });
});
