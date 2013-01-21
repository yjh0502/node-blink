var assert = require('assert'),
    async = require('async'),
    base = require('./test_base'),
    parser = require('../lib/parser');
    
describe('tokenize', function() {
    describe('#tokenize', function() {
        it('correctness', function(done) {
            async.map(base.schemas, parser.tokenize, function(err, results) {
                assert(err == null);

                for(var i = 0; i < results.length; i++) {
                    var tokens = results[i];
                    assert(parser.check_no_error(tokens));
                }

                done();
            });
        });
    });
});
