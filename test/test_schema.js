var assert = require('assert'),
    async = require('async'),
    base = require('./test_base'),
    schema = require('../lib/schema');
    
describe('schema', function() {
    describe('#parse', function() {
        it('correctness', function(done) {
            async.map(base.schemas, schema.parse, function(err, results) {
                assert(err == null);
                done();
            });
        });

        it('test', function(done) {
            schema.parse(base.get_test_schema('types'), done);
        });
    });
});
