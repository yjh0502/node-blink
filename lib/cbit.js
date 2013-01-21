var assert = require('assert');

var decode_unsigned = function(buf) {
    var value = 0;
    for(var i = 0; i < buf.length; i++) {
        var b = buf[i];

        value = (value << 7) | (b & 0x7F);
        if((b & 0x80) == 0) {
            break;
        }
    }
    return value;
}

var decode_signed = function(buf) {
    if((buf[0] & 0x40) == 0) {
        return decode_unsigned(buf);
    }

    var value = (~buf[0]) & 0x3F;
    for(var i = 1; i < buf.length; i++) {
        var b = buf[i];

        value = (value << 7) | ((~b) & 0x7F);
        if((b & 0x80) == 0) {
            break;
        }
    }

    return ~value;
}

module.exports = {
    decode_unsigned: decode_unsigned,
    decode_signed: decode_signed,

}
