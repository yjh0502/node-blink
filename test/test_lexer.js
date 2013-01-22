var assert = require('assert'),
    async = require('async'),
    base = require('./test_base'),
    lexer = require('../lib/lexer');
    
var test_over = function(set) {
    for(var filename in set) {
        var schema = set[filename];
        var tokens = lexer.tokenize(schema, function(err, data) {
            assert.ifError(err);
            assert(lexer.check_no_error(tokens));
        });
    }
}

describe('tokenize', function() {
    describe('#tokenize', function() {
        it('correctness', function() {
            test_over(base.schema_sets.valid);
            test_over(base.schema_sets.invalid_parser);
        });
    });
});
