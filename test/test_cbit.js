var assert = require('assert'),
    cbit = require('../lib/cbit');

var rand_iter = 100000;

describe('cbit', function() {
    describe('decode_unsigned', function() {
        it('correctness', function() {
            assert.equal(cbit.decode_unsigned(new Buffer('40', 'hex'), 0), 64);
            assert.equal(cbit.decode_unsigned(new Buffer('8040', 'hex'), 0), 64);
            assert.equal(cbit.decode_unsigned(new Buffer('808040', 'hex'), 0), 64);
            assert.equal(cbit.decode_unsigned(new Buffer('80808040', 'hex'), 0), 64);
            assert.equal(cbit.decode_unsigned(new Buffer('8080808040', 'hex'), 0), 64);


            assert.equal(cbit.decode_unsigned(new Buffer('a467', 'hex'), 0), 4711);
        });
    });

    describe('decode_signed', function() {
        it('correctness', function() {
            assert.equal(cbit.decode_signed(new Buffer('01', 'hex'), 0), 1);
            assert.equal(cbit.decode_signed(new Buffer('40', 'hex'), 0), -64);
            assert.equal(cbit.decode_signed(new Buffer('8040', 'hex'), 0), 64);
            assert.equal(cbit.decode_signed(new Buffer('db19', 'hex'), 0), -4711);

            assert.equal(cbit.decode_signed(new Buffer('80ce10', 'hex'), 0), 10000);
            assert.equal(cbit.decode_signed(new Buffer('7e', 'hex'), 0), -2);

            assert.equal(cbit.decode_signed(new Buffer('f880808000', 'hex'), 0), -2147483648);
            assert.equal(cbit.decode_signed(new Buffer('87c5b49f62', 'hex'), 0), 2024607714);
        });
    });

    describe('encode_unsigned', function() {
        it('correctness', function() {
            var buf = new Buffer(10);
            for(var i = 0; i < rand_iter; i++) {
                var max = 0x7FFFFFFF;
                var rand_val = (Math.random() * max)|0;
                var len = cbit.encode_unsigned(rand_val, buf, 0);
                var decoded = cbit.decode_unsigned(buf, 0);

                assert.equal(rand_val, decoded);
            }
        });

        it('boundary', function() {
            var tests = [];
            for(var i = 0; i < 4; i++) {
                var base = (1 << (i * 7));
                tests.push(base-1);
                tests.push(base);
                tests.push(base+1);
            }

            var buf = new Buffer(10);
            for(var i = 0; i < tests.length; i++) {
                var val = tests[i];
                var len = cbit.encode_unsigned(val, buf, 0);
                var decoded = cbit.decode_unsigned(buf, 0);

                assert.equal(val, decoded);
            }
        });
    });

    describe('encode_signed', function() {
        it('correctness', function() {
            var buf = new Buffer(10);
            for(var i = 0; i < rand_iter; i++) {
                var max = 0xFFFFFFFF;
                var rand_val = (Math.random() * max)|0;
                var len = cbit.encode_signed(rand_val, buf, 0);
                var decoded = cbit.decode_signed(buf, 0);

                assert.equal(rand_val, decoded);
            }
        });

        it('boundary', function() {
            var tests = [];
            for(var i = 1; i < 4; i++) {
                var base = (1 << (i * 7 - 1));
                tests.push(base-1);
                tests.push(base);
                tests.push(base+1);
            }

            var buf = new Buffer(10);
            for(var i = 0; i < tests.length; i++) {
                var val = tests[i];
                var len = cbit.encode_signed(val, buf, 0);
                var decoded = cbit.decode_signed(buf, 0);

                assert.equal(val, decoded);
            }
        });
    });
});
