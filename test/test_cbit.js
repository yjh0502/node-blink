var assert = require('assert'),
    cbit = require('../lib/cbit');

describe('cbit', function() {
    describe('decode_unsigned', function() {
        it('correctness', function() {
            assert(cbit.decode_signed(new Buffer('40', 'hex')), 64);
            assert(cbit.decode_signed(new Buffer('8040', 'hex')), 64);
            assert(cbit.decode_signed(new Buffer('808040', 'hex')), 64);
            assert(cbit.decode_signed(new Buffer('80808040', 'hex')), 64);
            assert(cbit.decode_signed(new Buffer('8080808040', 'hex')), 64);

            assert(cbit.decode_signed(new Buffer('a467', 'hex')), 4711);
        });
    });

    describe('decode_signed', function() {
        it('correctness', function() {
            assert(cbit.decode_signed(new Buffer('01', 'hex')), 1);
            assert(cbit.decode_signed(new Buffer('40', 'hex')), -64);
            assert(cbit.decode_signed(new Buffer('8040', 'hex')), 64);
            assert(cbit.decode_signed(new Buffer('db19', 'hex')), -4711);

            assert(cbit.decode_signed(new Buffer('f880808000', 'hex')), -2147483648);
        });
    });
});
