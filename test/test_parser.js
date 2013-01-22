var assert = require('assert'),
    async = require('async'),
    base = require('./test_base'),
    parser = require('../lib/parser');

describe('parser', function() {
    describe('#parse', function() {
        it('valid cases', function() {
            for(var filename in base.schema_sets.valid) {
                var file = base.schema_sets.valid[filename];

                parser.parse(file, function(err, data) {
                    if(err) {
                        assert(false, "Failed to parse " + file + ", " + err + ", " + err.stack);
                    }
                });
            }
        });

        it('invalid cases', function() {
            for(var filename in base.schema_sets.valid) {
                var file = base.schema_sets.valid[filename];

                parser.parse(file, function(err, data) {
                    if(!err) {
                        assert(false, "Failed to detect invalid case " + file);
                    }
                });
            }
        });

/*
        it('custom test', function() {
            parser.parse(base.get_test_schema('duplicate_id'), function(err, data) {
                if(err) {
                    assert(false, "Failed to parse " +  err + ", " + err.stack);
                }
            });
        });
        */
    });
});
