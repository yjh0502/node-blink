var assert = require('assert');

var decode_unsigned = function(buf, i) {
    var value = buf[i] & 0x7F;
    if((buf[i] & 0x80) == 0) {
        return value;
    }

    while(++i < buf.length) {
        var b = buf[i];

        value = (value << 7) | (b & 0x7F);
        if((b & 0x80) == 0) {
            break;
        }
    }
    return value;
}

var decode_signed = function(buf, i) {
    if((buf[i] & 0x40) == 0) {
        return decode_unsigned(buf, i);
    }

    var value = (~buf[i]) & 0x3F;
    if((buf[i] & 0x80) == 0) {
        return ~value;
    }

    while(++i < buf.length) {
        var b = buf[i];

        value = (value << 7) | ((~b) & 0x7F);
        if((b & 0x80) == 0) {
            break;
        }
    }

    return ~value;
}

var encode_unsigned = function(num, buf, i) {
    if(num < ((1<<7))) { //1 byte
        buf[i++] = num;
        return 1;
    } else if(num < (1<<14)) { //2 bytes
        buf[i++] = 0x80 | (num >> 7);
        buf[i++] = num & 0x7F;
        return 2;
    } else if(num < (1<<21)) { //3 bytes
        buf[i++] = 0x80 | (num >> 14);
        buf[i++] = (0x7F & (num >> 7)) | 0x80;
        buf[i++] = num & 0x7F;
        return 3;
    } else if(num < (1<<28)) { //4 bytes
        buf[i++] = 0x80 | (num >> 21);
        buf[i++] = (0x7F & (num >> 14)) | 0x80;
        buf[i++] = (0x7F & (num >> 7)) | 0x80;
        buf[i++] = num & 0x7F;
        return 4;
    } else {    //5 bytes. Javascript only supports 32bit signed integer,
                //so all integers could be encoded with 5 bytes CBIT encoding
        buf[i++] = 0x80 | (num >> 28);
        buf[i++] = (0x7F & (num >> 21)) | 0x80;
        buf[i++] = (0x7F & (num >> 14)) | 0x80;
        buf[i++] = (0x7F & (num >> 7)) | 0x80;
        buf[i++] = num & 0x7F;
        return 5;
    }
}

var encode_signed = function(num, buf, i) {
    if(num > 0) {
        if(num < ((1<<6))) { //1 byte
            buf[i++] = num;
            return 1;
        } else if(num < (1<<13)) { //2 bytes
            buf[i++] = 0x80 | (num >> 7) ;
            buf[i++] = num & 0x7F;
            return 2;
        } else if(num < (1<<20)-1) { //3 bytes
            buf[i++] = 0x80 | (num >> 14);
            buf[i++] = (0x7F & (num >> 7)) | 0x80;
            buf[i++] = num & 0x7F;
            return 3;
        } else if(num < (1<<27)-1) { //4 bytes
            buf[i++] = 0x80 | (num >> 21);
            buf[i++] = (0x7F & (num >> 14)) | 0x80;
            buf[i++] = (0x7F & (num >> 7)) | 0x80;
            buf[i++] = num & 0x7F;
            return 4;
        } else {    //5 bytes. Javascript only supports 32bit signed integer,
                    //so all integers could be encoded with 5 bytes CBIT encoding
            buf[i++] = 0x80 | (num >> 28);
            buf[i++] = (0x7F & (num >> 21)) | 0x80;
            buf[i++] = (0x7F & (num >> 14)) | 0x80;
            buf[i++] = (0x7F & (num >> 7)) | 0x80;
            buf[i++] = num & 0x7F;
            return 5;
        }
    } else {
        if(num > ~(1<<6)) { //1 byte
            buf[i++] = num | 0x40;
            return 1;
        } else if(num > ~(1<<13)) { //2 bytes
            buf[i++] = 0xc0 | (num >> 7) ;
            buf[i++] = num & 0x7F;
            return 2;
        } else if(num > ~(1<<20)) { //3 bytes
            buf[i++] = 0xc0 | (num >> 14);
            buf[i++] = (0x7F & (num >> 7)) | 0x80;
            buf[i++] = num & 0x7F;
            return 3;
        } else if(num > ~(1<<27)) { //4 bytes
            buf[i++] = 0xc0 | (num >> 21);
            buf[i++] = (0x7F & (num >> 14)) | 0x80;
            buf[i++] = (0x7F & (num >> 7)) | 0x80;
            buf[i++] = num & 0x7F;
            return 4;
        } else {    //5 bytes. Javascript only supports 32bit signed integer,
                    //so all integers could be encoded with 5 bytes CBIT encoding
            buf[i++] = 0xc0 | (num >> 28);
            buf[i++] = (0x7F & (num >> 21)) | 0x80;
            buf[i++] = (0x7F & (num >> 14)) | 0x80;
            buf[i++] = (0x7F & (num >> 7)) | 0x80;
            buf[i++] = num & 0x7F;
            return 5;
        }
    }
}

module.exports = {
    decode_unsigned: decode_unsigned,
    decode_signed: decode_signed,

    encode_unsigned: encode_unsigned,
    encode_signed: encode_signed,
}
