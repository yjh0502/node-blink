var assert = require('assert'),
    async = require('async'),
    base = require('./test_base'),
    parser = require('../lib/parser');

describe('parser', function() {
    describe('#parse', function() {
        it('correctness', function(done) {
            async.map(base.schemas, parser.parse, function(err, results) {
                assert(err == null);

                done();
            });
        });

        it('test', function(done) {
            parser.parse(base.get_test_schema('types'), done);
        });
    });
});
