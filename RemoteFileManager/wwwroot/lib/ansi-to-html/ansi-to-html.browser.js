﻿require=(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeHTML = exports.decodeHTMLStrict = exports.decodeXML = void 0;
var entities_json_1 = __importDefault(require("./maps/entities.json"));
var legacy_json_1 = __importDefault(require("./maps/legacy.json"));
var xml_json_1 = __importDefault(require("./maps/xml.json"));
var decode_codepoint_1 = __importDefault(require("./decode_codepoint"));
var strictEntityRe = /&(?:[a-zA-Z0-9]+|#[xX][\da-fA-F]+|#\d+);/g;
exports.decodeXML = getStrictDecoder(xml_json_1.default);
exports.decodeHTMLStrict = getStrictDecoder(entities_json_1.default);
function getStrictDecoder(map) {
    var replace = getReplacer(map);
    return function (str) { return String(str).replace(strictEntityRe, replace); };
}
var sorter = function (a, b) { return (a < b ? 1 : -1); };
exports.decodeHTML = (function () {
    var legacy = Object.keys(legacy_json_1.default).sort(sorter);
    var keys = Object.keys(entities_json_1.default).sort(sorter);
    for (var i = 0, j = 0; i < keys.length; i++) {
        if (legacy[j] === keys[i]) {
            keys[i] += ";?";
            j++;
        }
        else {
            keys[i] += ";";
        }
    }
    var re = new RegExp("&(?:" + keys.join("|") + "|#[xX][\\da-fA-F]+;?|#\\d+;?)", "g");
    var replace = getReplacer(entities_json_1.default);
    function replacer(str) {
        if (str.substr(-1) !== ";")
            str += ";";
        return replace(str);
    }
    // TODO consider creating a merged map
    return function (str) { return String(str).replace(re, replacer); };
})();
function getReplacer(map) {
    return function replace(str) {
        if (str.charAt(1) === "#") {
            var secondChar = str.charAt(2);
            if (secondChar === "X" || secondChar === "x") {
                return decode_codepoint_1.default(parseInt(str.substr(3), 16));
            }
            return decode_codepoint_1.default(parseInt(str.substr(2), 10));
        }
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
        return map[str.slice(1, -1)] || str;
    };
}

},{"./decode_codepoint":2,"./maps/entities.json":6,"./maps/legacy.json":7,"./maps/xml.json":8}],2:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var decode_json_1 = __importDefault(require("./maps/decode.json"));
// Adapted from https://github.com/mathiasbynens/he/blob/master/src/he.js#L94-L119
var fromCodePoint = 
// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
String.fromCodePoint ||
    function (codePoint) {
        var output = "";
        if (codePoint > 0xffff) {
            codePoint -= 0x10000;
            output += String.fromCharCode(((codePoint >>> 10) & 0x3ff) | 0xd800);
            codePoint = 0xdc00 | (codePoint & 0x3ff);
        }
        output += String.fromCharCode(codePoint);
        return output;
    };
function decodeCodePoint(codePoint) {
    if ((codePoint >= 0xd800 && codePoint <= 0xdfff) || codePoint > 0x10ffff) {
        return "\uFFFD";
    }
    if (codePoint in decode_json_1.default) {
        codePoint = decode_json_1.default[codePoint];
    }
    return fromCodePoint(codePoint);
}
exports.default = decodeCodePoint;

},{"./maps/decode.json":5}],3:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.escapeUTF8 = exports.escape = exports.encodeNonAsciiHTML = exports.encodeHTML = exports.encodeXML = void 0;
var xml_json_1 = __importDefault(require("./maps/xml.json"));
var inverseXML = getInverseObj(xml_json_1.default);
var xmlReplacer = getInverseReplacer(inverseXML);
/**
 * Encodes all non-ASCII characters, as well as characters not valid in XML
 * documents using XML entities.
 *
 * If a character has no equivalent entity, a
 * numeric hexadecimal reference (eg. `&#xfc;`) will be used.
 */
exports.encodeXML = getASCIIEncoder(inverseXML);
var entities_json_1 = __importDefault(require("./maps/entities.json"));
var inverseHTML = getInverseObj(entities_json_1.default);
var htmlReplacer = getInverseReplacer(inverseHTML);
/**
 * Encodes all entities and non-ASCII characters in the input.
 *
 * This includes characters that are valid ASCII characters in HTML documents.
 * For example `#` will be encoded as `&num;`. To get a more compact output,
 * consider using the `encodeNonAsciiHTML` function.
 *
 * If a character has no equivalent entity, a
 * numeric hexadecimal reference (eg. `&#xfc;`) will be used.
 */
exports.encodeHTML = getInverse(inverseHTML, htmlReplacer);
/**
 * Encodes all non-ASCII characters, as well as characters not valid in HTML
 * documents using HTML entities.
 *
 * If a character has no equivalent entity, a
 * numeric hexadecimal reference (eg. `&#xfc;`) will be used.
 */
exports.encodeNonAsciiHTML = getASCIIEncoder(inverseHTML);
function getInverseObj(obj) {
    return Object.keys(obj)
        .sort()
        .reduce(function (inverse, name) {
        inverse[obj[name]] = "&" + name + ";";
        return inverse;
    }, {});
}
function getInverseReplacer(inverse) {
    var single = [];
    var multiple = [];
    for (var _i = 0, _a = Object.keys(inverse); _i < _a.length; _i++) {
        var k = _a[_i];
        if (k.length === 1) {
            // Add value to single array
            single.push("\\" + k);
        }
        else {
            // Add value to multiple array
            multiple.push(k);
        }
    }
    // Add ranges to single characters.
    single.sort();
    for (var start = 0; start < single.length - 1; start++) {
        // Find the end of a run of characters
        var end = start;
        while (end < single.length - 1 &&
            single[end].charCodeAt(1) + 1 === single[end + 1].charCodeAt(1)) {
            end += 1;
        }
        var count = 1 + end - start;
        // We want to replace at least three characters
        if (count < 3)
            continue;
        single.splice(start, count, single[start] + "-" + single[end]);
    }
    multiple.unshift("[" + single.join("") + "]");
    return new RegExp(multiple.join("|"), "g");
}
// /[^\0-\x7F]/gu
var reNonASCII = /(?:[\x80-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])/g;
var getCodePoint = 
// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
String.prototype.codePointAt != null
    ? // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        function (str) { return str.codePointAt(0); }
    : // http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
        function (c) {
            return (c.charCodeAt(0) - 0xd800) * 0x400 +
                c.charCodeAt(1) -
                0xdc00 +
                0x10000;
        };
function singleCharReplacer(c) {
    return "&#x" + (c.length > 1 ? getCodePoint(c) : c.charCodeAt(0))
        .toString(16)
        .toUpperCase() + ";";
}
function getInverse(inverse, re) {
    return function (data) {
        return data
            .replace(re, function (name) { return inverse[name]; })
            .replace(reNonASCII, singleCharReplacer);
    };
}
var reEscapeChars = new RegExp(xmlReplacer.source + "|" + reNonASCII.source, "g");
/**
 * Encodes all non-ASCII characters, as well as characters not valid in XML
 * documents using numeric hexadecimal reference (eg. `&#xfc;`).
 *
 * Have a look at `escapeUTF8` if you want a more concise output at the expense
 * of reduced transportability.
 *
 * @param data String to escape.
 */
function escape(data) {
    return data.replace(reEscapeChars, singleCharReplacer);
}
exports.escape = escape;
/**
 * Encodes all characters not valid in XML documents using numeric hexadecimal
 * reference (eg. `&#xfc;`).
 *
 * Note that the output will be character-set dependent.
 *
 * @param data String to escape.
 */
function escapeUTF8(data) {
    return data.replace(xmlReplacer, singleCharReplacer);
}
exports.escapeUTF8 = escapeUTF8;
function getASCIIEncoder(obj) {
    return function (data) {
        return data.replace(reEscapeChars, function (c) { return obj[c] || singleCharReplacer(c); });
    };
}

},{"./maps/entities.json":6,"./maps/xml.json":8}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeXMLStrict = exports.decodeHTML5Strict = exports.decodeHTML4Strict = exports.decodeHTML5 = exports.decodeHTML4 = exports.decodeHTMLStrict = exports.decodeHTML = exports.decodeXML = exports.encodeHTML5 = exports.encodeHTML4 = exports.escapeUTF8 = exports.escape = exports.encodeNonAsciiHTML = exports.encodeHTML = exports.encodeXML = exports.encode = exports.decodeStrict = exports.decode = void 0;
var decode_1 = require("./decode");
var encode_1 = require("./encode");
/**
 * Decodes a string with entities.
 *
 * @param data String to decode.
 * @param level Optional level to decode at. 0 = XML, 1 = HTML. Default is 0.
 * @deprecated Use `decodeXML` or `decodeHTML` directly.
 */
function decode(data, level) {
    return (!level || level <= 0 ? decode_1.decodeXML : decode_1.decodeHTML)(data);
}
exports.decode = decode;
/**
 * Decodes a string with entities. Does not allow missing trailing semicolons for entities.
 *
 * @param data String to decode.
 * @param level Optional level to decode at. 0 = XML, 1 = HTML. Default is 0.
 * @deprecated Use `decodeHTMLStrict` or `decodeXML` directly.
 */
function decodeStrict(data, level) {
    return (!level || level <= 0 ? decode_1.decodeXML : decode_1.decodeHTMLStrict)(data);
}
exports.decodeStrict = decodeStrict;
/**
 * Encodes a string with entities.
 *
 * @param data String to encode.
 * @param level Optional level to encode at. 0 = XML, 1 = HTML. Default is 0.
 * @deprecated Use `encodeHTML`, `encodeXML` or `encodeNonAsciiHTML` directly.
 */
function encode(data, level) {
    return (!level || level <= 0 ? encode_1.encodeXML : encode_1.encodeHTML)(data);
}
exports.encode = encode;
var encode_2 = require("./encode");
Object.defineProperty(exports, "encodeXML", { enumerable: true, get: function () { return encode_2.encodeXML; } });
Object.defineProperty(exports, "encodeHTML", { enumerable: true, get: function () { return encode_2.encodeHTML; } });
Object.defineProperty(exports, "encodeNonAsciiHTML", { enumerable: true, get: function () { return encode_2.encodeNonAsciiHTML; } });
Object.defineProperty(exports, "escape", { enumerable: true, get: function () { return encode_2.escape; } });
Object.defineProperty(exports, "escapeUTF8", { enumerable: true, get: function () { return encode_2.escapeUTF8; } });
// Legacy aliases (deprecated)
Object.defineProperty(exports, "encodeHTML4", { enumerable: true, get: function () { return encode_2.encodeHTML; } });
Object.defineProperty(exports, "encodeHTML5", { enumerable: true, get: function () { return encode_2.encodeHTML; } });
var decode_2 = require("./decode");
Object.defineProperty(exports, "decodeXML", { enumerable: true, get: function () { return decode_2.decodeXML; } });
Object.defineProperty(exports, "decodeHTML", { enumerable: true, get: function () { return decode_2.decodeHTML; } });
Object.defineProperty(exports, "decodeHTMLStrict", { enumerable: true, get: function () { return decode_2.decodeHTMLStrict; } });
// Legacy aliases (deprecated)
Object.defineProperty(exports, "decodeHTML4", { enumerable: true, get: function () { return decode_2.decodeHTML; } });
Object.defineProperty(exports, "decodeHTML5", { enumerable: true, get: function () { return decode_2.decodeHTML; } });
Object.defineProperty(exports, "decodeHTML4Strict", { enumerable: true, get: function () { return decode_2.decodeHTMLStrict; } });
Object.defineProperty(exports, "decodeHTML5Strict", { enumerable: true, get: function () { return decode_2.decodeHTMLStrict; } });
Object.defineProperty(exports, "decodeXMLStrict", { enumerable: true, get: function () { return decode_2.decodeXML; } });

},{"./decode":1,"./encode":3}],5:[function(require,module,exports){
module.exports={"0":65533,"128":8364,"130":8218,"131":402,"132":8222,"133":8230,"134":8224,"135":8225,"136":710,"137":8240,"138":352,"139":8249,"140":338,"142":381,"145":8216,"146":8217,"147":8220,"148":8221,"149":8226,"150":8211,"151":8212,"152":732,"153":8482,"154":353,"155":8250,"156":339,"158":382,"159":376}

},{}],6:[function(require,module,exports){
module.exports={"Aacute":"Ã","aacute":"Ã¡","Abreve":"Ä‚","abreve":"Äƒ","ac":"âˆ¾","acd":"âˆ¿","acE":"âˆ¾Ì³","Acirc":"Ã‚","acirc":"Ã¢","acute":"Â´","Acy":"Ð","acy":"Ð°","AElig":"Ã†","aelig":"Ã¦","af":"â¡","Afr":"ð”„","afr":"ð”ž","Agrave":"Ã€","agrave":"Ã ","alefsym":"â„µ","aleph":"â„µ","Alpha":"Î‘","alpha":"Î±","Amacr":"Ä€","amacr":"Ä","amalg":"â¨¿","amp":"&","AMP":"&","andand":"â©•","And":"â©“","and":"âˆ§","andd":"â©œ","andslope":"â©˜","andv":"â©š","ang":"âˆ ","ange":"â¦¤","angle":"âˆ ","angmsdaa":"â¦¨","angmsdab":"â¦©","angmsdac":"â¦ª","angmsdad":"â¦«","angmsdae":"â¦¬","angmsdaf":"â¦","angmsdag":"â¦®","angmsdah":"â¦¯","angmsd":"âˆ¡","angrt":"âˆŸ","angrtvb":"âŠ¾","angrtvbd":"â¦","angsph":"âˆ¢","angst":"Ã…","angzarr":"â¼","Aogon":"Ä„","aogon":"Ä…","Aopf":"ð”¸","aopf":"ð•’","apacir":"â©¯","ap":"â‰ˆ","apE":"â©°","ape":"â‰Š","apid":"â‰‹","apos":"'","ApplyFunction":"â¡","approx":"â‰ˆ","approxeq":"â‰Š","Aring":"Ã…","aring":"Ã¥","Ascr":"ð’œ","ascr":"ð’¶","Assign":"â‰”","ast":"*","asymp":"â‰ˆ","asympeq":"â‰","Atilde":"Ãƒ","atilde":"Ã£","Auml":"Ã„","auml":"Ã¤","awconint":"âˆ³","awint":"â¨‘","backcong":"â‰Œ","backepsilon":"Ï¶","backprime":"â€µ","backsim":"âˆ½","backsimeq":"â‹","Backslash":"âˆ–","Barv":"â«§","barvee":"âŠ½","barwed":"âŒ…","Barwed":"âŒ†","barwedge":"âŒ…","bbrk":"âŽµ","bbrktbrk":"âŽ¶","bcong":"â‰Œ","Bcy":"Ð‘","bcy":"Ð±","bdquo":"â€ž","becaus":"âˆµ","because":"âˆµ","Because":"âˆµ","bemptyv":"â¦°","bepsi":"Ï¶","bernou":"â„¬","Bernoullis":"â„¬","Beta":"Î’","beta":"Î²","beth":"â„¶","between":"â‰¬","Bfr":"ð”…","bfr":"ð”Ÿ","bigcap":"â‹‚","bigcirc":"â—¯","bigcup":"â‹ƒ","bigodot":"â¨€","bigoplus":"â¨","bigotimes":"â¨‚","bigsqcup":"â¨†","bigstar":"â˜…","bigtriangledown":"â–½","bigtriangleup":"â–³","biguplus":"â¨„","bigvee":"â‹","bigwedge":"â‹€","bkarow":"â¤","blacklozenge":"â§«","blacksquare":"â–ª","blacktriangle":"â–´","blacktriangledown":"â–¾","blacktriangleleft":"â—‚","blacktriangleright":"â–¸","blank":"â£","blk12":"â–’","blk14":"â–‘","blk34":"â–“","block":"â–ˆ","bne":"=âƒ¥","bnequiv":"â‰¡âƒ¥","bNot":"â«","bnot":"âŒ","Bopf":"ð”¹","bopf":"ð•“","bot":"âŠ¥","bottom":"âŠ¥","bowtie":"â‹ˆ","boxbox":"â§‰","boxdl":"â”","boxdL":"â••","boxDl":"â•–","boxDL":"â•—","boxdr":"â”Œ","boxdR":"â•’","boxDr":"â•“","boxDR":"â•”","boxh":"â”€","boxH":"â•","boxhd":"â”¬","boxHd":"â•¤","boxhD":"â•¥","boxHD":"â•¦","boxhu":"â”´","boxHu":"â•§","boxhU":"â•¨","boxHU":"â•©","boxminus":"âŠŸ","boxplus":"âŠž","boxtimes":"âŠ ","boxul":"â”˜","boxuL":"â•›","boxUl":"â•œ","boxUL":"â•","boxur":"â””","boxuR":"â•˜","boxUr":"â•™","boxUR":"â•š","boxv":"â”‚","boxV":"â•‘","boxvh":"â”¼","boxvH":"â•ª","boxVh":"â•«","boxVH":"â•¬","boxvl":"â”¤","boxvL":"â•¡","boxVl":"â•¢","boxVL":"â•£","boxvr":"â”œ","boxvR":"â•ž","boxVr":"â•Ÿ","boxVR":"â• ","bprime":"â€µ","breve":"Ë˜","Breve":"Ë˜","brvbar":"Â¦","bscr":"ð’·","Bscr":"â„¬","bsemi":"â","bsim":"âˆ½","bsime":"â‹","bsolb":"â§…","bsol":"\\","bsolhsub":"âŸˆ","bull":"â€¢","bullet":"â€¢","bump":"â‰Ž","bumpE":"âª®","bumpe":"â‰","Bumpeq":"â‰Ž","bumpeq":"â‰","Cacute":"Ä†","cacute":"Ä‡","capand":"â©„","capbrcup":"â©‰","capcap":"â©‹","cap":"âˆ©","Cap":"â‹’","capcup":"â©‡","capdot":"â©€","CapitalDifferentialD":"â……","caps":"âˆ©ï¸€","caret":"â","caron":"Ë‡","Cayleys":"â„","ccaps":"â©","Ccaron":"ÄŒ","ccaron":"Ä","Ccedil":"Ã‡","ccedil":"Ã§","Ccirc":"Äˆ","ccirc":"Ä‰","Cconint":"âˆ°","ccups":"â©Œ","ccupssm":"â©","Cdot":"ÄŠ","cdot":"Ä‹","cedil":"Â¸","Cedilla":"Â¸","cemptyv":"â¦²","cent":"Â¢","centerdot":"Â·","CenterDot":"Â·","cfr":"ð” ","Cfr":"â„","CHcy":"Ð§","chcy":"Ñ‡","check":"âœ“","checkmark":"âœ“","Chi":"Î§","chi":"Ï‡","circ":"Ë†","circeq":"â‰—","circlearrowleft":"â†º","circlearrowright":"â†»","circledast":"âŠ›","circledcirc":"âŠš","circleddash":"âŠ","CircleDot":"âŠ™","circledR":"Â®","circledS":"â“ˆ","CircleMinus":"âŠ–","CirclePlus":"âŠ•","CircleTimes":"âŠ—","cir":"â—‹","cirE":"â§ƒ","cire":"â‰—","cirfnint":"â¨","cirmid":"â«¯","cirscir":"â§‚","ClockwiseContourIntegral":"âˆ²","CloseCurlyDoubleQuote":"â€","CloseCurlyQuote":"â€™","clubs":"â™£","clubsuit":"â™£","colon":":","Colon":"âˆ·","Colone":"â©´","colone":"â‰”","coloneq":"â‰”","comma":",","commat":"@","comp":"âˆ","compfn":"âˆ˜","complement":"âˆ","complexes":"â„‚","cong":"â‰…","congdot":"â©","Congruent":"â‰¡","conint":"âˆ®","Conint":"âˆ¯","ContourIntegral":"âˆ®","copf":"ð•”","Copf":"â„‚","coprod":"âˆ","Coproduct":"âˆ","copy":"Â©","COPY":"Â©","copysr":"â„—","CounterClockwiseContourIntegral":"âˆ³","crarr":"â†µ","cross":"âœ—","Cross":"â¨¯","Cscr":"ð’ž","cscr":"ð’¸","csub":"â«","csube":"â«‘","csup":"â«","csupe":"â«’","ctdot":"â‹¯","cudarrl":"â¤¸","cudarrr":"â¤µ","cuepr":"â‹ž","cuesc":"â‹Ÿ","cularr":"â†¶","cularrp":"â¤½","cupbrcap":"â©ˆ","cupcap":"â©†","CupCap":"â‰","cup":"âˆª","Cup":"â‹“","cupcup":"â©Š","cupdot":"âŠ","cupor":"â©…","cups":"âˆªï¸€","curarr":"â†·","curarrm":"â¤¼","curlyeqprec":"â‹ž","curlyeqsucc":"â‹Ÿ","curlyvee":"â‹Ž","curlywedge":"â‹","curren":"Â¤","curvearrowleft":"â†¶","curvearrowright":"â†·","cuvee":"â‹Ž","cuwed":"â‹","cwconint":"âˆ²","cwint":"âˆ±","cylcty":"âŒ","dagger":"â€ ","Dagger":"â€¡","daleth":"â„¸","darr":"â†“","Darr":"â†¡","dArr":"â‡“","dash":"â€","Dashv":"â«¤","dashv":"âŠ£","dbkarow":"â¤","dblac":"Ë","Dcaron":"ÄŽ","dcaron":"Ä","Dcy":"Ð”","dcy":"Ð´","ddagger":"â€¡","ddarr":"â‡Š","DD":"â……","dd":"â…†","DDotrahd":"â¤‘","ddotseq":"â©·","deg":"Â°","Del":"âˆ‡","Delta":"Î”","delta":"Î´","demptyv":"â¦±","dfisht":"â¥¿","Dfr":"ð”‡","dfr":"ð”¡","dHar":"â¥¥","dharl":"â‡ƒ","dharr":"â‡‚","DiacriticalAcute":"Â´","DiacriticalDot":"Ë™","DiacriticalDoubleAcute":"Ë","DiacriticalGrave":"`","DiacriticalTilde":"Ëœ","diam":"â‹„","diamond":"â‹„","Diamond":"â‹„","diamondsuit":"â™¦","diams":"â™¦","die":"Â¨","DifferentialD":"â…†","digamma":"Ï","disin":"â‹²","div":"Ã·","divide":"Ã·","divideontimes":"â‹‡","divonx":"â‹‡","DJcy":"Ð‚","djcy":"Ñ’","dlcorn":"âŒž","dlcrop":"âŒ","dollar":"$","Dopf":"ð”»","dopf":"ð••","Dot":"Â¨","dot":"Ë™","DotDot":"âƒœ","doteq":"â‰","doteqdot":"â‰‘","DotEqual":"â‰","dotminus":"âˆ¸","dotplus":"âˆ”","dotsquare":"âŠ¡","doublebarwedge":"âŒ†","DoubleContourIntegral":"âˆ¯","DoubleDot":"Â¨","DoubleDownArrow":"â‡“","DoubleLeftArrow":"â‡","DoubleLeftRightArrow":"â‡”","DoubleLeftTee":"â«¤","DoubleLongLeftArrow":"âŸ¸","DoubleLongLeftRightArrow":"âŸº","DoubleLongRightArrow":"âŸ¹","DoubleRightArrow":"â‡’","DoubleRightTee":"âŠ¨","DoubleUpArrow":"â‡‘","DoubleUpDownArrow":"â‡•","DoubleVerticalBar":"âˆ¥","DownArrowBar":"â¤“","downarrow":"â†“","DownArrow":"â†“","Downarrow":"â‡“","DownArrowUpArrow":"â‡µ","DownBreve":"Ì‘","downdownarrows":"â‡Š","downharpoonleft":"â‡ƒ","downharpoonright":"â‡‚","DownLeftRightVector":"â¥","DownLeftTeeVector":"â¥ž","DownLeftVectorBar":"â¥–","DownLeftVector":"â†½","DownRightTeeVector":"â¥Ÿ","DownRightVectorBar":"â¥—","DownRightVector":"â‡","DownTeeArrow":"â†§","DownTee":"âŠ¤","drbkarow":"â¤","drcorn":"âŒŸ","drcrop":"âŒŒ","Dscr":"ð’Ÿ","dscr":"ð’¹","DScy":"Ð…","dscy":"Ñ•","dsol":"â§¶","Dstrok":"Ä","dstrok":"Ä‘","dtdot":"â‹±","dtri":"â–¿","dtrif":"â–¾","duarr":"â‡µ","duhar":"â¥¯","dwangle":"â¦¦","DZcy":"Ð","dzcy":"ÑŸ","dzigrarr":"âŸ¿","Eacute":"Ã‰","eacute":"Ã©","easter":"â©®","Ecaron":"Äš","ecaron":"Ä›","Ecirc":"ÃŠ","ecirc":"Ãª","ecir":"â‰–","ecolon":"â‰•","Ecy":"Ð","ecy":"Ñ","eDDot":"â©·","Edot":"Ä–","edot":"Ä—","eDot":"â‰‘","ee":"â…‡","efDot":"â‰’","Efr":"ð”ˆ","efr":"ð”¢","eg":"âªš","Egrave":"Ãˆ","egrave":"Ã¨","egs":"âª–","egsdot":"âª˜","el":"âª™","Element":"âˆˆ","elinters":"â§","ell":"â„“","els":"âª•","elsdot":"âª—","Emacr":"Ä’","emacr":"Ä“","empty":"âˆ…","emptyset":"âˆ…","EmptySmallSquare":"â—»","emptyv":"âˆ…","EmptyVerySmallSquare":"â–«","emsp13":"â€„","emsp14":"â€…","emsp":"â€ƒ","ENG":"ÅŠ","eng":"Å‹","ensp":"â€‚","Eogon":"Ä˜","eogon":"Ä™","Eopf":"ð”¼","eopf":"ð•–","epar":"â‹•","eparsl":"â§£","eplus":"â©±","epsi":"Îµ","Epsilon":"Î•","epsilon":"Îµ","epsiv":"Ïµ","eqcirc":"â‰–","eqcolon":"â‰•","eqsim":"â‰‚","eqslantgtr":"âª–","eqslantless":"âª•","Equal":"â©µ","equals":"=","EqualTilde":"â‰‚","equest":"â‰Ÿ","Equilibrium":"â‡Œ","equiv":"â‰¡","equivDD":"â©¸","eqvparsl":"â§¥","erarr":"â¥±","erDot":"â‰“","escr":"â„¯","Escr":"â„°","esdot":"â‰","Esim":"â©³","esim":"â‰‚","Eta":"Î—","eta":"Î·","ETH":"Ã","eth":"Ã°","Euml":"Ã‹","euml":"Ã«","euro":"â‚¬","excl":"!","exist":"âˆƒ","Exists":"âˆƒ","expectation":"â„°","exponentiale":"â…‡","ExponentialE":"â…‡","fallingdotseq":"â‰’","Fcy":"Ð¤","fcy":"Ñ„","female":"â™€","ffilig":"ï¬ƒ","fflig":"ï¬€","ffllig":"ï¬„","Ffr":"ð”‰","ffr":"ð”£","filig":"ï¬","FilledSmallSquare":"â—¼","FilledVerySmallSquare":"â–ª","fjlig":"fj","flat":"â™","fllig":"ï¬‚","fltns":"â–±","fnof":"Æ’","Fopf":"ð”½","fopf":"ð•—","forall":"âˆ€","ForAll":"âˆ€","fork":"â‹”","forkv":"â«™","Fouriertrf":"â„±","fpartint":"â¨","frac12":"Â½","frac13":"â…“","frac14":"Â¼","frac15":"â…•","frac16":"â…™","frac18":"â…›","frac23":"â…”","frac25":"â…–","frac34":"Â¾","frac35":"â…—","frac38":"â…œ","frac45":"â…˜","frac56":"â…š","frac58":"â…","frac78":"â…ž","frasl":"â„","frown":"âŒ¢","fscr":"ð’»","Fscr":"â„±","gacute":"Çµ","Gamma":"Î“","gamma":"Î³","Gammad":"Ïœ","gammad":"Ï","gap":"âª†","Gbreve":"Äž","gbreve":"ÄŸ","Gcedil":"Ä¢","Gcirc":"Äœ","gcirc":"Ä","Gcy":"Ð“","gcy":"Ð³","Gdot":"Ä ","gdot":"Ä¡","ge":"â‰¥","gE":"â‰§","gEl":"âªŒ","gel":"â‹›","geq":"â‰¥","geqq":"â‰§","geqslant":"â©¾","gescc":"âª©","ges":"â©¾","gesdot":"âª€","gesdoto":"âª‚","gesdotol":"âª„","gesl":"â‹›ï¸€","gesles":"âª”","Gfr":"ð”Š","gfr":"ð”¤","gg":"â‰«","Gg":"â‹™","ggg":"â‹™","gimel":"â„·","GJcy":"Ðƒ","gjcy":"Ñ“","gla":"âª¥","gl":"â‰·","glE":"âª’","glj":"âª¤","gnap":"âªŠ","gnapprox":"âªŠ","gne":"âªˆ","gnE":"â‰©","gneq":"âªˆ","gneqq":"â‰©","gnsim":"â‹§","Gopf":"ð”¾","gopf":"ð•˜","grave":"`","GreaterEqual":"â‰¥","GreaterEqualLess":"â‹›","GreaterFullEqual":"â‰§","GreaterGreater":"âª¢","GreaterLess":"â‰·","GreaterSlantEqual":"â©¾","GreaterTilde":"â‰³","Gscr":"ð’¢","gscr":"â„Š","gsim":"â‰³","gsime":"âªŽ","gsiml":"âª","gtcc":"âª§","gtcir":"â©º","gt":">","GT":">","Gt":"â‰«","gtdot":"â‹—","gtlPar":"â¦•","gtquest":"â©¼","gtrapprox":"âª†","gtrarr":"â¥¸","gtrdot":"â‹—","gtreqless":"â‹›","gtreqqless":"âªŒ","gtrless":"â‰·","gtrsim":"â‰³","gvertneqq":"â‰©ï¸€","gvnE":"â‰©ï¸€","Hacek":"Ë‡","hairsp":"â€Š","half":"Â½","hamilt":"â„‹","HARDcy":"Ðª","hardcy":"ÑŠ","harrcir":"â¥ˆ","harr":"â†”","hArr":"â‡”","harrw":"â†","Hat":"^","hbar":"â„","Hcirc":"Ä¤","hcirc":"Ä¥","hearts":"â™¥","heartsuit":"â™¥","hellip":"â€¦","hercon":"âŠ¹","hfr":"ð”¥","Hfr":"â„Œ","HilbertSpace":"â„‹","hksearow":"â¤¥","hkswarow":"â¤¦","hoarr":"â‡¿","homtht":"âˆ»","hookleftarrow":"â†©","hookrightarrow":"â†ª","hopf":"ð•™","Hopf":"â„","horbar":"â€•","HorizontalLine":"â”€","hscr":"ð’½","Hscr":"â„‹","hslash":"â„","Hstrok":"Ä¦","hstrok":"Ä§","HumpDownHump":"â‰Ž","HumpEqual":"â‰","hybull":"âƒ","hyphen":"â€","Iacute":"Ã","iacute":"Ã","ic":"â£","Icirc":"ÃŽ","icirc":"Ã®","Icy":"Ð˜","icy":"Ð¸","Idot":"Ä°","IEcy":"Ð•","iecy":"Ðµ","iexcl":"Â¡","iff":"â‡”","ifr":"ð”¦","Ifr":"â„‘","Igrave":"ÃŒ","igrave":"Ã¬","ii":"â…ˆ","iiiint":"â¨Œ","iiint":"âˆ","iinfin":"â§œ","iiota":"â„©","IJlig":"Ä²","ijlig":"Ä³","Imacr":"Äª","imacr":"Ä«","image":"â„‘","ImaginaryI":"â…ˆ","imagline":"â„","imagpart":"â„‘","imath":"Ä±","Im":"â„‘","imof":"âŠ·","imped":"Æµ","Implies":"â‡’","incare":"â„…","in":"âˆˆ","infin":"âˆž","infintie":"â§","inodot":"Ä±","intcal":"âŠº","int":"âˆ«","Int":"âˆ¬","integers":"â„¤","Integral":"âˆ«","intercal":"âŠº","Intersection":"â‹‚","intlarhk":"â¨—","intprod":"â¨¼","InvisibleComma":"â£","InvisibleTimes":"â¢","IOcy":"Ð","iocy":"Ñ‘","Iogon":"Ä®","iogon":"Ä¯","Iopf":"ð•€","iopf":"ð•š","Iota":"Î™","iota":"Î¹","iprod":"â¨¼","iquest":"Â¿","iscr":"ð’¾","Iscr":"â„","isin":"âˆˆ","isindot":"â‹µ","isinE":"â‹¹","isins":"â‹´","isinsv":"â‹³","isinv":"âˆˆ","it":"â¢","Itilde":"Ä¨","itilde":"Ä©","Iukcy":"Ð†","iukcy":"Ñ–","Iuml":"Ã","iuml":"Ã¯","Jcirc":"Ä´","jcirc":"Äµ","Jcy":"Ð™","jcy":"Ð¹","Jfr":"ð”","jfr":"ð”§","jmath":"È·","Jopf":"ð•","jopf":"ð•›","Jscr":"ð’¥","jscr":"ð’¿","Jsercy":"Ðˆ","jsercy":"Ñ˜","Jukcy":"Ð„","jukcy":"Ñ”","Kappa":"Îš","kappa":"Îº","kappav":"Ï°","Kcedil":"Ä¶","kcedil":"Ä·","Kcy":"Ðš","kcy":"Ðº","Kfr":"ð”Ž","kfr":"ð”¨","kgreen":"Ä¸","KHcy":"Ð¥","khcy":"Ñ…","KJcy":"ÐŒ","kjcy":"Ñœ","Kopf":"ð•‚","kopf":"ð•œ","Kscr":"ð’¦","kscr":"ð“€","lAarr":"â‡š","Lacute":"Ä¹","lacute":"Äº","laemptyv":"â¦´","lagran":"â„’","Lambda":"Î›","lambda":"Î»","lang":"âŸ¨","Lang":"âŸª","langd":"â¦‘","langle":"âŸ¨","lap":"âª…","Laplacetrf":"â„’","laquo":"Â«","larrb":"â‡¤","larrbfs":"â¤Ÿ","larr":"â†","Larr":"â†ž","lArr":"â‡","larrfs":"â¤","larrhk":"â†©","larrlp":"â†«","larrpl":"â¤¹","larrsim":"â¥³","larrtl":"â†¢","latail":"â¤™","lAtail":"â¤›","lat":"âª«","late":"âª","lates":"âªï¸€","lbarr":"â¤Œ","lBarr":"â¤Ž","lbbrk":"â²","lbrace":"{","lbrack":"[","lbrke":"â¦‹","lbrksld":"â¦","lbrkslu":"â¦","Lcaron":"Ä½","lcaron":"Ä¾","Lcedil":"Ä»","lcedil":"Ä¼","lceil":"âŒˆ","lcub":"{","Lcy":"Ð›","lcy":"Ð»","ldca":"â¤¶","ldquo":"â€œ","ldquor":"â€ž","ldrdhar":"â¥§","ldrushar":"â¥‹","ldsh":"â†²","le":"â‰¤","lE":"â‰¦","LeftAngleBracket":"âŸ¨","LeftArrowBar":"â‡¤","leftarrow":"â†","LeftArrow":"â†","Leftarrow":"â‡","LeftArrowRightArrow":"â‡†","leftarrowtail":"â†¢","LeftCeiling":"âŒˆ","LeftDoubleBracket":"âŸ¦","LeftDownTeeVector":"â¥¡","LeftDownVectorBar":"â¥™","LeftDownVector":"â‡ƒ","LeftFloor":"âŒŠ","leftharpoondown":"â†½","leftharpoonup":"â†¼","leftleftarrows":"â‡‡","leftrightarrow":"â†”","LeftRightArrow":"â†”","Leftrightarrow":"â‡”","leftrightarrows":"â‡†","leftrightharpoons":"â‡‹","leftrightsquigarrow":"â†","LeftRightVector":"â¥Ž","LeftTeeArrow":"â†¤","LeftTee":"âŠ£","LeftTeeVector":"â¥š","leftthreetimes":"â‹‹","LeftTriangleBar":"â§","LeftTriangle":"âŠ²","LeftTriangleEqual":"âŠ´","LeftUpDownVector":"â¥‘","LeftUpTeeVector":"â¥ ","LeftUpVectorBar":"â¥˜","LeftUpVector":"â†¿","LeftVectorBar":"â¥’","LeftVector":"â†¼","lEg":"âª‹","leg":"â‹š","leq":"â‰¤","leqq":"â‰¦","leqslant":"â©½","lescc":"âª¨","les":"â©½","lesdot":"â©¿","lesdoto":"âª","lesdotor":"âªƒ","lesg":"â‹šï¸€","lesges":"âª“","lessapprox":"âª…","lessdot":"â‹–","lesseqgtr":"â‹š","lesseqqgtr":"âª‹","LessEqualGreater":"â‹š","LessFullEqual":"â‰¦","LessGreater":"â‰¶","lessgtr":"â‰¶","LessLess":"âª¡","lesssim":"â‰²","LessSlantEqual":"â©½","LessTilde":"â‰²","lfisht":"â¥¼","lfloor":"âŒŠ","Lfr":"ð”","lfr":"ð”©","lg":"â‰¶","lgE":"âª‘","lHar":"â¥¢","lhard":"â†½","lharu":"â†¼","lharul":"â¥ª","lhblk":"â–„","LJcy":"Ð‰","ljcy":"Ñ™","llarr":"â‡‡","ll":"â‰ª","Ll":"â‹˜","llcorner":"âŒž","Lleftarrow":"â‡š","llhard":"â¥«","lltri":"â—º","Lmidot":"Ä¿","lmidot":"Å€","lmoustache":"âŽ°","lmoust":"âŽ°","lnap":"âª‰","lnapprox":"âª‰","lne":"âª‡","lnE":"â‰¨","lneq":"âª‡","lneqq":"â‰¨","lnsim":"â‹¦","loang":"âŸ¬","loarr":"â‡½","lobrk":"âŸ¦","longleftarrow":"âŸµ","LongLeftArrow":"âŸµ","Longleftarrow":"âŸ¸","longleftrightarrow":"âŸ·","LongLeftRightArrow":"âŸ·","Longleftrightarrow":"âŸº","longmapsto":"âŸ¼","longrightarrow":"âŸ¶","LongRightArrow":"âŸ¶","Longrightarrow":"âŸ¹","looparrowleft":"â†«","looparrowright":"â†¬","lopar":"â¦…","Lopf":"ð•ƒ","lopf":"ð•","loplus":"â¨","lotimes":"â¨´","lowast":"âˆ—","lowbar":"_","LowerLeftArrow":"â†™","LowerRightArrow":"â†˜","loz":"â—Š","lozenge":"â—Š","lozf":"â§«","lpar":"(","lparlt":"â¦“","lrarr":"â‡†","lrcorner":"âŒŸ","lrhar":"â‡‹","lrhard":"â¥","lrm":"â€Ž","lrtri":"âŠ¿","lsaquo":"â€¹","lscr":"ð“","Lscr":"â„’","lsh":"â†°","Lsh":"â†°","lsim":"â‰²","lsime":"âª","lsimg":"âª","lsqb":"[","lsquo":"â€˜","lsquor":"â€š","Lstrok":"Å","lstrok":"Å‚","ltcc":"âª¦","ltcir":"â©¹","lt":"<","LT":"<","Lt":"â‰ª","ltdot":"â‹–","lthree":"â‹‹","ltimes":"â‹‰","ltlarr":"â¥¶","ltquest":"â©»","ltri":"â—ƒ","ltrie":"âŠ´","ltrif":"â—‚","ltrPar":"â¦–","lurdshar":"â¥Š","luruhar":"â¥¦","lvertneqq":"â‰¨ï¸€","lvnE":"â‰¨ï¸€","macr":"Â¯","male":"â™‚","malt":"âœ ","maltese":"âœ ","Map":"â¤…","map":"â†¦","mapsto":"â†¦","mapstodown":"â†§","mapstoleft":"â†¤","mapstoup":"â†¥","marker":"â–®","mcomma":"â¨©","Mcy":"Ðœ","mcy":"Ð¼","mdash":"â€”","mDDot":"âˆº","measuredangle":"âˆ¡","MediumSpace":"âŸ","Mellintrf":"â„³","Mfr":"ð”","mfr":"ð”ª","mho":"â„§","micro":"Âµ","midast":"*","midcir":"â«°","mid":"âˆ£","middot":"Â·","minusb":"âŠŸ","minus":"âˆ’","minusd":"âˆ¸","minusdu":"â¨ª","MinusPlus":"âˆ“","mlcp":"â«›","mldr":"â€¦","mnplus":"âˆ“","models":"âŠ§","Mopf":"ð•„","mopf":"ð•ž","mp":"âˆ“","mscr":"ð“‚","Mscr":"â„³","mstpos":"âˆ¾","Mu":"Îœ","mu":"Î¼","multimap":"âŠ¸","mumap":"âŠ¸","nabla":"âˆ‡","Nacute":"Åƒ","nacute":"Å„","nang":"âˆ âƒ’","nap":"â‰‰","napE":"â©°Ì¸","napid":"â‰‹Ì¸","napos":"Å‰","napprox":"â‰‰","natural":"â™®","naturals":"â„•","natur":"â™®","nbsp":"Â ","nbump":"â‰ŽÌ¸","nbumpe":"â‰Ì¸","ncap":"â©ƒ","Ncaron":"Å‡","ncaron":"Åˆ","Ncedil":"Å…","ncedil":"Å†","ncong":"â‰‡","ncongdot":"â©Ì¸","ncup":"â©‚","Ncy":"Ð","ncy":"Ð½","ndash":"â€“","nearhk":"â¤¤","nearr":"â†—","neArr":"â‡—","nearrow":"â†—","ne":"â‰ ","nedot":"â‰Ì¸","NegativeMediumSpace":"â€‹","NegativeThickSpace":"â€‹","NegativeThinSpace":"â€‹","NegativeVeryThinSpace":"â€‹","nequiv":"â‰¢","nesear":"â¤¨","nesim":"â‰‚Ì¸","NestedGreaterGreater":"â‰«","NestedLessLess":"â‰ª","NewLine":"\n","nexist":"âˆ„","nexists":"âˆ„","Nfr":"ð”‘","nfr":"ð”«","ngE":"â‰§Ì¸","nge":"â‰±","ngeq":"â‰±","ngeqq":"â‰§Ì¸","ngeqslant":"â©¾Ì¸","nges":"â©¾Ì¸","nGg":"â‹™Ì¸","ngsim":"â‰µ","nGt":"â‰«âƒ’","ngt":"â‰¯","ngtr":"â‰¯","nGtv":"â‰«Ì¸","nharr":"â†®","nhArr":"â‡Ž","nhpar":"â«²","ni":"âˆ‹","nis":"â‹¼","nisd":"â‹º","niv":"âˆ‹","NJcy":"ÐŠ","njcy":"Ñš","nlarr":"â†š","nlArr":"â‡","nldr":"â€¥","nlE":"â‰¦Ì¸","nle":"â‰°","nleftarrow":"â†š","nLeftarrow":"â‡","nleftrightarrow":"â†®","nLeftrightarrow":"â‡Ž","nleq":"â‰°","nleqq":"â‰¦Ì¸","nleqslant":"â©½Ì¸","nles":"â©½Ì¸","nless":"â‰®","nLl":"â‹˜Ì¸","nlsim":"â‰´","nLt":"â‰ªâƒ’","nlt":"â‰®","nltri":"â‹ª","nltrie":"â‹¬","nLtv":"â‰ªÌ¸","nmid":"âˆ¤","NoBreak":"â ","NonBreakingSpace":"Â ","nopf":"ð•Ÿ","Nopf":"â„•","Not":"â«¬","not":"Â¬","NotCongruent":"â‰¢","NotCupCap":"â‰","NotDoubleVerticalBar":"âˆ¦","NotElement":"âˆ‰","NotEqual":"â‰ ","NotEqualTilde":"â‰‚Ì¸","NotExists":"âˆ„","NotGreater":"â‰¯","NotGreaterEqual":"â‰±","NotGreaterFullEqual":"â‰§Ì¸","NotGreaterGreater":"â‰«Ì¸","NotGreaterLess":"â‰¹","NotGreaterSlantEqual":"â©¾Ì¸","NotGreaterTilde":"â‰µ","NotHumpDownHump":"â‰ŽÌ¸","NotHumpEqual":"â‰Ì¸","notin":"âˆ‰","notindot":"â‹µÌ¸","notinE":"â‹¹Ì¸","notinva":"âˆ‰","notinvb":"â‹·","notinvc":"â‹¶","NotLeftTriangleBar":"â§Ì¸","NotLeftTriangle":"â‹ª","NotLeftTriangleEqual":"â‹¬","NotLess":"â‰®","NotLessEqual":"â‰°","NotLessGreater":"â‰¸","NotLessLess":"â‰ªÌ¸","NotLessSlantEqual":"â©½Ì¸","NotLessTilde":"â‰´","NotNestedGreaterGreater":"âª¢Ì¸","NotNestedLessLess":"âª¡Ì¸","notni":"âˆŒ","notniva":"âˆŒ","notnivb":"â‹¾","notnivc":"â‹½","NotPrecedes":"âŠ€","NotPrecedesEqual":"âª¯Ì¸","NotPrecedesSlantEqual":"â‹ ","NotReverseElement":"âˆŒ","NotRightTriangleBar":"â§Ì¸","NotRightTriangle":"â‹«","NotRightTriangleEqual":"â‹","NotSquareSubset":"âŠÌ¸","NotSquareSubsetEqual":"â‹¢","NotSquareSuperset":"âŠÌ¸","NotSquareSupersetEqual":"â‹£","NotSubset":"âŠ‚âƒ’","NotSubsetEqual":"âŠˆ","NotSucceeds":"âŠ","NotSucceedsEqual":"âª°Ì¸","NotSucceedsSlantEqual":"â‹¡","NotSucceedsTilde":"â‰¿Ì¸","NotSuperset":"âŠƒâƒ’","NotSupersetEqual":"âŠ‰","NotTilde":"â‰","NotTildeEqual":"â‰„","NotTildeFullEqual":"â‰‡","NotTildeTilde":"â‰‰","NotVerticalBar":"âˆ¤","nparallel":"âˆ¦","npar":"âˆ¦","nparsl":"â«½âƒ¥","npart":"âˆ‚Ì¸","npolint":"â¨”","npr":"âŠ€","nprcue":"â‹ ","nprec":"âŠ€","npreceq":"âª¯Ì¸","npre":"âª¯Ì¸","nrarrc":"â¤³Ì¸","nrarr":"â†›","nrArr":"â‡","nrarrw":"â†Ì¸","nrightarrow":"â†›","nRightarrow":"â‡","nrtri":"â‹«","nrtrie":"â‹","nsc":"âŠ","nsccue":"â‹¡","nsce":"âª°Ì¸","Nscr":"ð’©","nscr":"ð“ƒ","nshortmid":"âˆ¤","nshortparallel":"âˆ¦","nsim":"â‰","nsime":"â‰„","nsimeq":"â‰„","nsmid":"âˆ¤","nspar":"âˆ¦","nsqsube":"â‹¢","nsqsupe":"â‹£","nsub":"âŠ„","nsubE":"â«…Ì¸","nsube":"âŠˆ","nsubset":"âŠ‚âƒ’","nsubseteq":"âŠˆ","nsubseteqq":"â«…Ì¸","nsucc":"âŠ","nsucceq":"âª°Ì¸","nsup":"âŠ…","nsupE":"â«†Ì¸","nsupe":"âŠ‰","nsupset":"âŠƒâƒ’","nsupseteq":"âŠ‰","nsupseteqq":"â«†Ì¸","ntgl":"â‰¹","Ntilde":"Ã‘","ntilde":"Ã±","ntlg":"â‰¸","ntriangleleft":"â‹ª","ntrianglelefteq":"â‹¬","ntriangleright":"â‹«","ntrianglerighteq":"â‹","Nu":"Î","nu":"Î½","num":"#","numero":"â„–","numsp":"â€‡","nvap":"â‰âƒ’","nvdash":"âŠ¬","nvDash":"âŠ","nVdash":"âŠ®","nVDash":"âŠ¯","nvge":"â‰¥âƒ’","nvgt":">âƒ’","nvHarr":"â¤„","nvinfin":"â§ž","nvlArr":"â¤‚","nvle":"â‰¤âƒ’","nvlt":"<âƒ’","nvltrie":"âŠ´âƒ’","nvrArr":"â¤ƒ","nvrtrie":"âŠµâƒ’","nvsim":"âˆ¼âƒ’","nwarhk":"â¤£","nwarr":"â†–","nwArr":"â‡–","nwarrow":"â†–","nwnear":"â¤§","Oacute":"Ã“","oacute":"Ã³","oast":"âŠ›","Ocirc":"Ã”","ocirc":"Ã´","ocir":"âŠš","Ocy":"Ðž","ocy":"Ð¾","odash":"âŠ","Odblac":"Å","odblac":"Å‘","odiv":"â¨¸","odot":"âŠ™","odsold":"â¦¼","OElig":"Å’","oelig":"Å“","ofcir":"â¦¿","Ofr":"ð”’","ofr":"ð”¬","ogon":"Ë›","Ograve":"Ã’","ograve":"Ã²","ogt":"â§","ohbar":"â¦µ","ohm":"Î©","oint":"âˆ®","olarr":"â†º","olcir":"â¦¾","olcross":"â¦»","oline":"â€¾","olt":"â§€","Omacr":"ÅŒ","omacr":"Å","Omega":"Î©","omega":"Ï‰","Omicron":"ÎŸ","omicron":"Î¿","omid":"â¦¶","ominus":"âŠ–","Oopf":"ð•†","oopf":"ð• ","opar":"â¦·","OpenCurlyDoubleQuote":"â€œ","OpenCurlyQuote":"â€˜","operp":"â¦¹","oplus":"âŠ•","orarr":"â†»","Or":"â©”","or":"âˆ¨","ord":"â©","order":"â„´","orderof":"â„´","ordf":"Âª","ordm":"Âº","origof":"âŠ¶","oror":"â©–","orslope":"â©—","orv":"â©›","oS":"â“ˆ","Oscr":"ð’ª","oscr":"â„´","Oslash":"Ã˜","oslash":"Ã¸","osol":"âŠ˜","Otilde":"Ã•","otilde":"Ãµ","otimesas":"â¨¶","Otimes":"â¨·","otimes":"âŠ—","Ouml":"Ã–","ouml":"Ã¶","ovbar":"âŒ½","OverBar":"â€¾","OverBrace":"âž","OverBracket":"âŽ´","OverParenthesis":"âœ","para":"Â¶","parallel":"âˆ¥","par":"âˆ¥","parsim":"â«³","parsl":"â«½","part":"âˆ‚","PartialD":"âˆ‚","Pcy":"ÐŸ","pcy":"Ð¿","percnt":"%","period":".","permil":"â€°","perp":"âŠ¥","pertenk":"â€±","Pfr":"ð”“","pfr":"ð”","Phi":"Î¦","phi":"Ï†","phiv":"Ï•","phmmat":"â„³","phone":"â˜Ž","Pi":"Î ","pi":"Ï€","pitchfork":"â‹”","piv":"Ï–","planck":"â„","planckh":"â„Ž","plankv":"â„","plusacir":"â¨£","plusb":"âŠž","pluscir":"â¨¢","plus":"+","plusdo":"âˆ”","plusdu":"â¨¥","pluse":"â©²","PlusMinus":"Â±","plusmn":"Â±","plussim":"â¨¦","plustwo":"â¨§","pm":"Â±","Poincareplane":"â„Œ","pointint":"â¨•","popf":"ð•¡","Popf":"â„™","pound":"Â£","prap":"âª·","Pr":"âª»","pr":"â‰º","prcue":"â‰¼","precapprox":"âª·","prec":"â‰º","preccurlyeq":"â‰¼","Precedes":"â‰º","PrecedesEqual":"âª¯","PrecedesSlantEqual":"â‰¼","PrecedesTilde":"â‰¾","preceq":"âª¯","precnapprox":"âª¹","precneqq":"âªµ","precnsim":"â‹¨","pre":"âª¯","prE":"âª³","precsim":"â‰¾","prime":"â€²","Prime":"â€³","primes":"â„™","prnap":"âª¹","prnE":"âªµ","prnsim":"â‹¨","prod":"âˆ","Product":"âˆ","profalar":"âŒ®","profline":"âŒ’","profsurf":"âŒ“","prop":"âˆ","Proportional":"âˆ","Proportion":"âˆ·","propto":"âˆ","prsim":"â‰¾","prurel":"âŠ°","Pscr":"ð’«","pscr":"ð“…","Psi":"Î¨","psi":"Ïˆ","puncsp":"â€ˆ","Qfr":"ð””","qfr":"ð”®","qint":"â¨Œ","qopf":"ð•¢","Qopf":"â„š","qprime":"â—","Qscr":"ð’¬","qscr":"ð“†","quaternions":"â„","quatint":"â¨–","quest":"?","questeq":"â‰Ÿ","quot":"\"","QUOT":"\"","rAarr":"â‡›","race":"âˆ½Ì±","Racute":"Å”","racute":"Å•","radic":"âˆš","raemptyv":"â¦³","rang":"âŸ©","Rang":"âŸ«","rangd":"â¦’","range":"â¦¥","rangle":"âŸ©","raquo":"Â»","rarrap":"â¥µ","rarrb":"â‡¥","rarrbfs":"â¤ ","rarrc":"â¤³","rarr":"â†’","Rarr":"â† ","rArr":"â‡’","rarrfs":"â¤ž","rarrhk":"â†ª","rarrlp":"â†¬","rarrpl":"â¥…","rarrsim":"â¥´","Rarrtl":"â¤–","rarrtl":"â†£","rarrw":"â†","ratail":"â¤š","rAtail":"â¤œ","ratio":"âˆ¶","rationals":"â„š","rbarr":"â¤","rBarr":"â¤","RBarr":"â¤","rbbrk":"â³","rbrace":"}","rbrack":"]","rbrke":"â¦Œ","rbrksld":"â¦Ž","rbrkslu":"â¦","Rcaron":"Å˜","rcaron":"Å™","Rcedil":"Å–","rcedil":"Å—","rceil":"âŒ‰","rcub":"}","Rcy":"Ð ","rcy":"Ñ€","rdca":"â¤·","rdldhar":"â¥©","rdquo":"â€","rdquor":"â€","rdsh":"â†³","real":"â„œ","realine":"â„›","realpart":"â„œ","reals":"â„","Re":"â„œ","rect":"â–","reg":"Â®","REG":"Â®","ReverseElement":"âˆ‹","ReverseEquilibrium":"â‡‹","ReverseUpEquilibrium":"â¥¯","rfisht":"â¥½","rfloor":"âŒ‹","rfr":"ð”¯","Rfr":"â„œ","rHar":"â¥¤","rhard":"â‡","rharu":"â‡€","rharul":"â¥¬","Rho":"Î¡","rho":"Ï","rhov":"Ï±","RightAngleBracket":"âŸ©","RightArrowBar":"â‡¥","rightarrow":"â†’","RightArrow":"â†’","Rightarrow":"â‡’","RightArrowLeftArrow":"â‡„","rightarrowtail":"â†£","RightCeiling":"âŒ‰","RightDoubleBracket":"âŸ§","RightDownTeeVector":"â¥","RightDownVectorBar":"â¥•","RightDownVector":"â‡‚","RightFloor":"âŒ‹","rightharpoondown":"â‡","rightharpoonup":"â‡€","rightleftarrows":"â‡„","rightleftharpoons":"â‡Œ","rightrightarrows":"â‡‰","rightsquigarrow":"â†","RightTeeArrow":"â†¦","RightTee":"âŠ¢","RightTeeVector":"â¥›","rightthreetimes":"â‹Œ","RightTriangleBar":"â§","RightTriangle":"âŠ³","RightTriangleEqual":"âŠµ","RightUpDownVector":"â¥","RightUpTeeVector":"â¥œ","RightUpVectorBar":"â¥”","RightUpVector":"â†¾","RightVectorBar":"â¥“","RightVector":"â‡€","ring":"Ëš","risingdotseq":"â‰“","rlarr":"â‡„","rlhar":"â‡Œ","rlm":"â€","rmoustache":"âŽ±","rmoust":"âŽ±","rnmid":"â«®","roang":"âŸ","roarr":"â‡¾","robrk":"âŸ§","ropar":"â¦†","ropf":"ð•£","Ropf":"â„","roplus":"â¨®","rotimes":"â¨µ","RoundImplies":"â¥°","rpar":")","rpargt":"â¦”","rppolint":"â¨’","rrarr":"â‡‰","Rrightarrow":"â‡›","rsaquo":"â€º","rscr":"ð“‡","Rscr":"â„›","rsh":"â†±","Rsh":"â†±","rsqb":"]","rsquo":"â€™","rsquor":"â€™","rthree":"â‹Œ","rtimes":"â‹Š","rtri":"â–¹","rtrie":"âŠµ","rtrif":"â–¸","rtriltri":"â§Ž","RuleDelayed":"â§´","ruluhar":"â¥¨","rx":"â„ž","Sacute":"Åš","sacute":"Å›","sbquo":"â€š","scap":"âª¸","Scaron":"Å ","scaron":"Å¡","Sc":"âª¼","sc":"â‰»","sccue":"â‰½","sce":"âª°","scE":"âª´","Scedil":"Åž","scedil":"ÅŸ","Scirc":"Åœ","scirc":"Å","scnap":"âªº","scnE":"âª¶","scnsim":"â‹©","scpolint":"â¨“","scsim":"â‰¿","Scy":"Ð¡","scy":"Ñ","sdotb":"âŠ¡","sdot":"â‹…","sdote":"â©¦","searhk":"â¤¥","searr":"â†˜","seArr":"â‡˜","searrow":"â†˜","sect":"Â§","semi":";","seswar":"â¤©","setminus":"âˆ–","setmn":"âˆ–","sext":"âœ¶","Sfr":"ð”–","sfr":"ð”°","sfrown":"âŒ¢","sharp":"â™¯","SHCHcy":"Ð©","shchcy":"Ñ‰","SHcy":"Ð¨","shcy":"Ñˆ","ShortDownArrow":"â†“","ShortLeftArrow":"â†","shortmid":"âˆ£","shortparallel":"âˆ¥","ShortRightArrow":"â†’","ShortUpArrow":"â†‘","shy":"Â","Sigma":"Î£","sigma":"Ïƒ","sigmaf":"Ï‚","sigmav":"Ï‚","sim":"âˆ¼","simdot":"â©ª","sime":"â‰ƒ","simeq":"â‰ƒ","simg":"âªž","simgE":"âª ","siml":"âª","simlE":"âªŸ","simne":"â‰†","simplus":"â¨¤","simrarr":"â¥²","slarr":"â†","SmallCircle":"âˆ˜","smallsetminus":"âˆ–","smashp":"â¨³","smeparsl":"â§¤","smid":"âˆ£","smile":"âŒ£","smt":"âªª","smte":"âª¬","smtes":"âª¬ï¸€","SOFTcy":"Ð¬","softcy":"ÑŒ","solbar":"âŒ¿","solb":"â§„","sol":"/","Sopf":"ð•Š","sopf":"ð•¤","spades":"â™ ","spadesuit":"â™ ","spar":"âˆ¥","sqcap":"âŠ“","sqcaps":"âŠ“ï¸€","sqcup":"âŠ”","sqcups":"âŠ”ï¸€","Sqrt":"âˆš","sqsub":"âŠ","sqsube":"âŠ‘","sqsubset":"âŠ","sqsubseteq":"âŠ‘","sqsup":"âŠ","sqsupe":"âŠ’","sqsupset":"âŠ","sqsupseteq":"âŠ’","square":"â–¡","Square":"â–¡","SquareIntersection":"âŠ“","SquareSubset":"âŠ","SquareSubsetEqual":"âŠ‘","SquareSuperset":"âŠ","SquareSupersetEqual":"âŠ’","SquareUnion":"âŠ”","squarf":"â–ª","squ":"â–¡","squf":"â–ª","srarr":"â†’","Sscr":"ð’®","sscr":"ð“ˆ","ssetmn":"âˆ–","ssmile":"âŒ£","sstarf":"â‹†","Star":"â‹†","star":"â˜†","starf":"â˜…","straightepsilon":"Ïµ","straightphi":"Ï•","strns":"Â¯","sub":"âŠ‚","Sub":"â‹","subdot":"âª½","subE":"â«…","sube":"âŠ†","subedot":"â«ƒ","submult":"â«","subnE":"â«‹","subne":"âŠŠ","subplus":"âª¿","subrarr":"â¥¹","subset":"âŠ‚","Subset":"â‹","subseteq":"âŠ†","subseteqq":"â«…","SubsetEqual":"âŠ†","subsetneq":"âŠŠ","subsetneqq":"â«‹","subsim":"â«‡","subsub":"â«•","subsup":"â«“","succapprox":"âª¸","succ":"â‰»","succcurlyeq":"â‰½","Succeeds":"â‰»","SucceedsEqual":"âª°","SucceedsSlantEqual":"â‰½","SucceedsTilde":"â‰¿","succeq":"âª°","succnapprox":"âªº","succneqq":"âª¶","succnsim":"â‹©","succsim":"â‰¿","SuchThat":"âˆ‹","sum":"âˆ‘","Sum":"âˆ‘","sung":"â™ª","sup1":"Â¹","sup2":"Â²","sup3":"Â³","sup":"âŠƒ","Sup":"â‹‘","supdot":"âª¾","supdsub":"â«˜","supE":"â«†","supe":"âŠ‡","supedot":"â«„","Superset":"âŠƒ","SupersetEqual":"âŠ‡","suphsol":"âŸ‰","suphsub":"â«—","suplarr":"â¥»","supmult":"â«‚","supnE":"â«Œ","supne":"âŠ‹","supplus":"â«€","supset":"âŠƒ","Supset":"â‹‘","supseteq":"âŠ‡","supseteqq":"â«†","supsetneq":"âŠ‹","supsetneqq":"â«Œ","supsim":"â«ˆ","supsub":"â«”","supsup":"â«–","swarhk":"â¤¦","swarr":"â†™","swArr":"â‡™","swarrow":"â†™","swnwar":"â¤ª","szlig":"ÃŸ","Tab":"\t","target":"âŒ–","Tau":"Î¤","tau":"Ï„","tbrk":"âŽ´","Tcaron":"Å¤","tcaron":"Å¥","Tcedil":"Å¢","tcedil":"Å£","Tcy":"Ð¢","tcy":"Ñ‚","tdot":"âƒ›","telrec":"âŒ•","Tfr":"ð”—","tfr":"ð”±","there4":"âˆ´","therefore":"âˆ´","Therefore":"âˆ´","Theta":"Î˜","theta":"Î¸","thetasym":"Ï‘","thetav":"Ï‘","thickapprox":"â‰ˆ","thicksim":"âˆ¼","ThickSpace":"âŸâ€Š","ThinSpace":"â€‰","thinsp":"â€‰","thkap":"â‰ˆ","thksim":"âˆ¼","THORN":"Ãž","thorn":"Ã¾","tilde":"Ëœ","Tilde":"âˆ¼","TildeEqual":"â‰ƒ","TildeFullEqual":"â‰…","TildeTilde":"â‰ˆ","timesbar":"â¨±","timesb":"âŠ ","times":"Ã—","timesd":"â¨°","tint":"âˆ","toea":"â¤¨","topbot":"âŒ¶","topcir":"â«±","top":"âŠ¤","Topf":"ð•‹","topf":"ð•¥","topfork":"â«š","tosa":"â¤©","tprime":"â€´","trade":"â„¢","TRADE":"â„¢","triangle":"â–µ","triangledown":"â–¿","triangleleft":"â—ƒ","trianglelefteq":"âŠ´","triangleq":"â‰œ","triangleright":"â–¹","trianglerighteq":"âŠµ","tridot":"â—¬","trie":"â‰œ","triminus":"â¨º","TripleDot":"âƒ›","triplus":"â¨¹","trisb":"â§","tritime":"â¨»","trpezium":"â¢","Tscr":"ð’¯","tscr":"ð“‰","TScy":"Ð¦","tscy":"Ñ†","TSHcy":"Ð‹","tshcy":"Ñ›","Tstrok":"Å¦","tstrok":"Å§","twixt":"â‰¬","twoheadleftarrow":"â†ž","twoheadrightarrow":"â† ","Uacute":"Ãš","uacute":"Ãº","uarr":"â†‘","Uarr":"â†Ÿ","uArr":"â‡‘","Uarrocir":"â¥‰","Ubrcy":"ÐŽ","ubrcy":"Ñž","Ubreve":"Å¬","ubreve":"Å","Ucirc":"Ã›","ucirc":"Ã»","Ucy":"Ð£","ucy":"Ñƒ","udarr":"â‡…","Udblac":"Å°","udblac":"Å±","udhar":"â¥®","ufisht":"â¥¾","Ufr":"ð”˜","ufr":"ð”²","Ugrave":"Ã™","ugrave":"Ã¹","uHar":"â¥£","uharl":"â†¿","uharr":"â†¾","uhblk":"â–€","ulcorn":"âŒœ","ulcorner":"âŒœ","ulcrop":"âŒ","ultri":"â—¸","Umacr":"Åª","umacr":"Å«","uml":"Â¨","UnderBar":"_","UnderBrace":"âŸ","UnderBracket":"âŽµ","UnderParenthesis":"â","Union":"â‹ƒ","UnionPlus":"âŠŽ","Uogon":"Å²","uogon":"Å³","Uopf":"ð•Œ","uopf":"ð•¦","UpArrowBar":"â¤’","uparrow":"â†‘","UpArrow":"â†‘","Uparrow":"â‡‘","UpArrowDownArrow":"â‡…","updownarrow":"â†•","UpDownArrow":"â†•","Updownarrow":"â‡•","UpEquilibrium":"â¥®","upharpoonleft":"â†¿","upharpoonright":"â†¾","uplus":"âŠŽ","UpperLeftArrow":"â†–","UpperRightArrow":"â†—","upsi":"Ï…","Upsi":"Ï’","upsih":"Ï’","Upsilon":"Î¥","upsilon":"Ï…","UpTeeArrow":"â†¥","UpTee":"âŠ¥","upuparrows":"â‡ˆ","urcorn":"âŒ","urcorner":"âŒ","urcrop":"âŒŽ","Uring":"Å®","uring":"Å¯","urtri":"â—¹","Uscr":"ð’°","uscr":"ð“Š","utdot":"â‹°","Utilde":"Å¨","utilde":"Å©","utri":"â–µ","utrif":"â–´","uuarr":"â‡ˆ","Uuml":"Ãœ","uuml":"Ã¼","uwangle":"â¦§","vangrt":"â¦œ","varepsilon":"Ïµ","varkappa":"Ï°","varnothing":"âˆ…","varphi":"Ï•","varpi":"Ï–","varpropto":"âˆ","varr":"â†•","vArr":"â‡•","varrho":"Ï±","varsigma":"Ï‚","varsubsetneq":"âŠŠï¸€","varsubsetneqq":"â«‹ï¸€","varsupsetneq":"âŠ‹ï¸€","varsupsetneqq":"â«Œï¸€","vartheta":"Ï‘","vartriangleleft":"âŠ²","vartriangleright":"âŠ³","vBar":"â«¨","Vbar":"â««","vBarv":"â«©","Vcy":"Ð’","vcy":"Ð²","vdash":"âŠ¢","vDash":"âŠ¨","Vdash":"âŠ©","VDash":"âŠ«","Vdashl":"â«¦","veebar":"âŠ»","vee":"âˆ¨","Vee":"â‹","veeeq":"â‰š","vellip":"â‹®","verbar":"|","Verbar":"â€–","vert":"|","Vert":"â€–","VerticalBar":"âˆ£","VerticalLine":"|","VerticalSeparator":"â˜","VerticalTilde":"â‰€","VeryThinSpace":"â€Š","Vfr":"ð”™","vfr":"ð”³","vltri":"âŠ²","vnsub":"âŠ‚âƒ’","vnsup":"âŠƒâƒ’","Vopf":"ð•","vopf":"ð•§","vprop":"âˆ","vrtri":"âŠ³","Vscr":"ð’±","vscr":"ð“‹","vsubnE":"â«‹ï¸€","vsubne":"âŠŠï¸€","vsupnE":"â«Œï¸€","vsupne":"âŠ‹ï¸€","Vvdash":"âŠª","vzigzag":"â¦š","Wcirc":"Å´","wcirc":"Åµ","wedbar":"â©Ÿ","wedge":"âˆ§","Wedge":"â‹€","wedgeq":"â‰™","weierp":"â„˜","Wfr":"ð”š","wfr":"ð”´","Wopf":"ð•Ž","wopf":"ð•¨","wp":"â„˜","wr":"â‰€","wreath":"â‰€","Wscr":"ð’²","wscr":"ð“Œ","xcap":"â‹‚","xcirc":"â—¯","xcup":"â‹ƒ","xdtri":"â–½","Xfr":"ð”›","xfr":"ð”µ","xharr":"âŸ·","xhArr":"âŸº","Xi":"Îž","xi":"Î¾","xlarr":"âŸµ","xlArr":"âŸ¸","xmap":"âŸ¼","xnis":"â‹»","xodot":"â¨€","Xopf":"ð•","xopf":"ð•©","xoplus":"â¨","xotime":"â¨‚","xrarr":"âŸ¶","xrArr":"âŸ¹","Xscr":"ð’³","xscr":"ð“","xsqcup":"â¨†","xuplus":"â¨„","xutri":"â–³","xvee":"â‹","xwedge":"â‹€","Yacute":"Ã","yacute":"Ã½","YAcy":"Ð¯","yacy":"Ñ","Ycirc":"Å¶","ycirc":"Å·","Ycy":"Ð«","ycy":"Ñ‹","yen":"Â¥","Yfr":"ð”œ","yfr":"ð”¶","YIcy":"Ð‡","yicy":"Ñ—","Yopf":"ð•","yopf":"ð•ª","Yscr":"ð’´","yscr":"ð“Ž","YUcy":"Ð®","yucy":"ÑŽ","yuml":"Ã¿","Yuml":"Å¸","Zacute":"Å¹","zacute":"Åº","Zcaron":"Å½","zcaron":"Å¾","Zcy":"Ð—","zcy":"Ð·","Zdot":"Å»","zdot":"Å¼","zeetrf":"â„¨","ZeroWidthSpace":"â€‹","Zeta":"Î–","zeta":"Î¶","zfr":"ð”·","Zfr":"â„¨","ZHcy":"Ð–","zhcy":"Ð¶","zigrarr":"â‡","zopf":"ð•«","Zopf":"â„¤","Zscr":"ð’µ","zscr":"ð“","zwj":"â€","zwnj":"â€Œ"}

},{}],7:[function(require,module,exports){
module.exports={"Aacute":"Ã","aacute":"Ã¡","Acirc":"Ã‚","acirc":"Ã¢","acute":"Â´","AElig":"Ã†","aelig":"Ã¦","Agrave":"Ã€","agrave":"Ã ","amp":"&","AMP":"&","Aring":"Ã…","aring":"Ã¥","Atilde":"Ãƒ","atilde":"Ã£","Auml":"Ã„","auml":"Ã¤","brvbar":"Â¦","Ccedil":"Ã‡","ccedil":"Ã§","cedil":"Â¸","cent":"Â¢","copy":"Â©","COPY":"Â©","curren":"Â¤","deg":"Â°","divide":"Ã·","Eacute":"Ã‰","eacute":"Ã©","Ecirc":"ÃŠ","ecirc":"Ãª","Egrave":"Ãˆ","egrave":"Ã¨","ETH":"Ã","eth":"Ã°","Euml":"Ã‹","euml":"Ã«","frac12":"Â½","frac14":"Â¼","frac34":"Â¾","gt":">","GT":">","Iacute":"Ã","iacute":"Ã","Icirc":"ÃŽ","icirc":"Ã®","iexcl":"Â¡","Igrave":"ÃŒ","igrave":"Ã¬","iquest":"Â¿","Iuml":"Ã","iuml":"Ã¯","laquo":"Â«","lt":"<","LT":"<","macr":"Â¯","micro":"Âµ","middot":"Â·","nbsp":"Â ","not":"Â¬","Ntilde":"Ã‘","ntilde":"Ã±","Oacute":"Ã“","oacute":"Ã³","Ocirc":"Ã”","ocirc":"Ã´","Ograve":"Ã’","ograve":"Ã²","ordf":"Âª","ordm":"Âº","Oslash":"Ã˜","oslash":"Ã¸","Otilde":"Ã•","otilde":"Ãµ","Ouml":"Ã–","ouml":"Ã¶","para":"Â¶","plusmn":"Â±","pound":"Â£","quot":"\"","QUOT":"\"","raquo":"Â»","reg":"Â®","REG":"Â®","sect":"Â§","shy":"Â","sup1":"Â¹","sup2":"Â²","sup3":"Â³","szlig":"ÃŸ","THORN":"Ãž","thorn":"Ã¾","times":"Ã—","Uacute":"Ãš","uacute":"Ãº","Ucirc":"Ã›","ucirc":"Ã»","Ugrave":"Ã™","ugrave":"Ã¹","uml":"Â¨","Uuml":"Ãœ","uuml":"Ã¼","Yacute":"Ã","yacute":"Ã½","yen":"Â¥","yuml":"Ã¿"}

},{}],8:[function(require,module,exports){
module.exports={"amp":"&","apos":"'","gt":">","lt":"<","quot":"\""}

},{}],"ansi-to-html":[function(require,module,exports){
'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

var entities = require('entities');

var defaults = {
  fg: '#FFF',
  bg: '#000',
  newline: false,
  escapeXML: false,
  stream: false,
  colors: getDefaultColors()
};

function getDefaultColors() {
  var colors = {
    0: '#000',
    1: '#A00',
    2: '#0A0',
    3: '#A50',
    4: '#00A',
    5: '#A0A',
    6: '#0AA',
    7: '#AAA',
    8: '#555',
    9: '#F55',
    10: '#5F5',
    11: '#FF5',
    12: '#55F',
    13: '#F5F',
    14: '#5FF',
    15: '#FFF'
  };
  range(0, 5).forEach(function (red) {
    range(0, 5).forEach(function (green) {
      range(0, 5).forEach(function (blue) {
        return setStyleColor(red, green, blue, colors);
      });
    });
  });
  range(0, 23).forEach(function (gray) {
    var c = gray + 232;
    var l = toHexString(gray * 10 + 8);
    colors[c] = '#' + l + l + l;
  });
  return colors;
}
/**
 * @param {number} red
 * @param {number} green
 * @param {number} blue
 * @param {object} colors
 */


function setStyleColor(red, green, blue, colors) {
  var c = 16 + red * 36 + green * 6 + blue;
  var r = red > 0 ? red * 40 + 55 : 0;
  var g = green > 0 ? green * 40 + 55 : 0;
  var b = blue > 0 ? blue * 40 + 55 : 0;
  colors[c] = toColorHexString([r, g, b]);
}
/**
 * Converts from a number like 15 to a hex string like 'F'
 * @param {number} num
 * @returns {string}
 */


function toHexString(num) {
  var str = num.toString(16);

  while (str.length < 2) {
    str = '0' + str;
  }

  return str;
}
/**
 * Converts from an array of numbers like [15, 15, 15] to a hex string like 'FFF'
 * @param {[red, green, blue]} ref
 * @returns {string}
 */


function toColorHexString(ref) {
  var results = [];

  var _iterator = _createForOfIteratorHelper(ref),
      _step;

  try {
    for (_iterator.s(); !(_step = _iterator.n()).done;) {
      var r = _step.value;
      results.push(toHexString(r));
    }
  } catch (err) {
    _iterator.e(err);
  } finally {
    _iterator.f();
  }

  return '#' + results.join('');
}
/**
 * @param {Array} stack
 * @param {string} token
 * @param {*} data
 * @param {object} options
 */


function generateOutput(stack, token, data, options) {
  var result;

  if (token === 'text') {
    result = pushText(data, options);
  } else if (token === 'display') {
    result = handleDisplay(stack, data, options);
  } else if (token === 'xterm256Foreground') {
    result = pushForegroundColor(stack, options.colors[data]);
  } else if (token === 'xterm256Background') {
    result = pushBackgroundColor(stack, options.colors[data]);
  } else if (token === 'rgb') {
    result = handleRgb(stack, data);
  }

  return result;
}
/**
 * @param {Array} stack
 * @param {string} data
 * @returns {*}
 */


function handleRgb(stack, data) {
  data = data.substring(2).slice(0, -1);
  var operation = +data.substr(0, 2);
  var color = data.substring(5).split(';');
  var rgb = color.map(function (value) {
    return ('0' + Number(value).toString(16)).substr(-2);
  }).join('');
  return pushStyle(stack, (operation === 38 ? 'color:#' : 'background-color:#') + rgb);
}
/**
 * @param {Array} stack
 * @param {number} code
 * @param {object} options
 * @returns {*}
 */


function handleDisplay(stack, code, options) {
  code = parseInt(code, 10);
  var codeMap = {
    '-1': function _() {
      return '<br/>';
    },
    0: function _() {
      return stack.length && resetStyles(stack);
    },
    1: function _() {
      return pushTag(stack, 'b');
    },
    3: function _() {
      return pushTag(stack, 'i');
    },
    4: function _() {
      return pushTag(stack, 'u');
    },
    8: function _() {
      return pushStyle(stack, 'display:none');
    },
    9: function _() {
      return pushTag(stack, 'strike');
    },
    22: function _() {
      return pushStyle(stack, 'font-weight:normal;text-decoration:none;font-style:normal');
    },
    23: function _() {
      return closeTag(stack, 'i');
    },
    24: function _() {
      return closeTag(stack, 'u');
    },
    39: function _() {
      return pushForegroundColor(stack, options.fg);
    },
    49: function _() {
      return pushBackgroundColor(stack, options.bg);
    },
    53: function _() {
      return pushStyle(stack, 'text-decoration:overline');
    }
  };
  var result;

  if (codeMap[code]) {
    result = codeMap[code]();
  } else if (4 < code && code < 7) {
    result = pushTag(stack, 'blink');
  } else if (29 < code && code < 38) {
    result = pushForegroundColor(stack, options.colors[code - 30]);
  } else if (39 < code && code < 48) {
    result = pushBackgroundColor(stack, options.colors[code - 40]);
  } else if (89 < code && code < 98) {
    result = pushForegroundColor(stack, options.colors[8 + (code - 90)]);
  } else if (99 < code && code < 108) {
    result = pushBackgroundColor(stack, options.colors[8 + (code - 100)]);
  }

  return result;
}
/**
 * Clear all the styles
 * @returns {string}
 */


function resetStyles(stack) {
  var stackClone = stack.slice(0);
  stack.length = 0;
  return stackClone.reverse().map(function (tag) {
    return '</' + tag + '>';
  }).join('');
}
/**
 * Creates an array of numbers ranging from low to high
 * @param {number} low
 * @param {number} high
 * @returns {Array}
 * @example range(3, 7); // creates [3, 4, 5, 6, 7]
 */


function range(low, high) {
  var results = [];

  for (var j = low; j <= high; j++) {
    results.push(j);
  }

  return results;
}
/**
 * Returns a new function that is true if value is NOT the same category
 * @param {string} category
 * @returns {function}
 */


function notCategory(category) {
  return function (e) {
    return (category === null || e.category !== category) && category !== 'all';
  };
}
/**
 * Converts a code into an ansi token type
 * @param {number} code
 * @returns {string}
 */


function categoryForCode(code) {
  code = parseInt(code, 10);
  var result = null;

  if (code === 0) {
    result = 'all';
  } else if (code === 1) {
    result = 'bold';
  } else if (2 < code && code < 5) {
    result = 'underline';
  } else if (4 < code && code < 7) {
    result = 'blink';
  } else if (code === 8) {
    result = 'hide';
  } else if (code === 9) {
    result = 'strike';
  } else if (29 < code && code < 38 || code === 39 || 89 < code && code < 98) {
    result = 'foreground-color';
  } else if (39 < code && code < 48 || code === 49 || 99 < code && code < 108) {
    result = 'background-color';
  }

  return result;
}
/**
 * @param {string} text
 * @param {object} options
 * @returns {string}
 */


function pushText(text, options) {
  if (options.escapeXML) {
    return entities.encodeXML(text);
  }

  return text;
}
/**
 * @param {Array} stack
 * @param {string} tag
 * @param {string} [style='']
 * @returns {string}
 */


function pushTag(stack, tag, style) {
  if (!style) {
    style = '';
  }

  stack.push(tag);
  return "<".concat(tag).concat(style ? " style=\"".concat(style, "\"") : '', ">");
}
/**
 * @param {Array} stack
 * @param {string} style
 * @returns {string}
 */


function pushStyle(stack, style) {
  return pushTag(stack, 'span', style);
}

function pushForegroundColor(stack, color) {
  return pushTag(stack, 'span', 'color:' + color);
}

function pushBackgroundColor(stack, color) {
  return pushTag(stack, 'span', 'background-color:' + color);
}
/**
 * @param {Array} stack
 * @param {string} style
 * @returns {string}
 */


function closeTag(stack, style) {
  var last;

  if (stack.slice(-1)[0] === style) {
    last = stack.pop();
  }

  if (last) {
    return '</' + style + '>';
  }
}
/**
 * @param {string} text
 * @param {object} options
 * @param {function} callback
 * @returns {Array}
 */


function tokenize(text, options, callback) {
  var ansiMatch = false;
  var ansiHandler = 3;

  function remove() {
    return '';
  }

  function removeXterm256Foreground(m, g1) {
    callback('xterm256Foreground', g1);
    return '';
  }

  function removeXterm256Background(m, g1) {
    callback('xterm256Background', g1);
    return '';
  }

  function newline(m) {
    if (options.newline) {
      callback('display', -1);
    } else {
      callback('text', m);
    }

    return '';
  }

  function ansiMess(m, g1) {
    ansiMatch = true;

    if (g1.trim().length === 0) {
      g1 = '0';
    }

    g1 = g1.trimRight(';').split(';');

    var _iterator2 = _createForOfIteratorHelper(g1),
        _step2;

    try {
      for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
        var g = _step2.value;
        callback('display', g);
      }
    } catch (err) {
      _iterator2.e(err);
    } finally {
      _iterator2.f();
    }

    return '';
  }

  function realText(m) {
    callback('text', m);
    return '';
  }

  function rgb(m) {
    callback('rgb', m);
    return '';
  }
  /* eslint no-control-regex:0 */


  var tokens = [{
    pattern: /^\x08+/,
    sub: remove
  }, {
    pattern: /^\x1b\[[012]?K/,
    sub: remove
  }, {
    pattern: /^\x1b\[\(B/,
    sub: remove
  }, {
    pattern: /^\x1b\[[34]8;2;\d+;\d+;\d+m/,
    sub: rgb
  }, {
    pattern: /^\x1b\[38;5;(\d+)m/,
    sub: removeXterm256Foreground
  }, {
    pattern: /^\x1b\[48;5;(\d+)m/,
    sub: removeXterm256Background
  }, {
    pattern: /^\n/,
    sub: newline
  }, {
    pattern: /^\r+\n/,
    sub: newline
  }, {
    pattern: /^\r/,
    sub: newline
  }, {
    pattern: /^\x1b\[((?:\d{1,3};?)+|)m/,
    sub: ansiMess
  }, {
    // CSI n J
    // ED - Erase in Display Clears part of the screen.
    // If n is 0 (or missing), clear from cursor to end of screen.
    // If n is 1, clear from cursor to beginning of the screen.
    // If n is 2, clear entire screen (and moves cursor to upper left on DOS ANSI.SYS).
    // If n is 3, clear entire screen and delete all lines saved in the scrollback buffer
    //   (this feature was added for xterm and is supported by other terminal applications).
    pattern: /^\x1b\[\d?J/,
    sub: remove
  }, {
    // CSI n ; m f
    // HVP - Horizontal Vertical Position Same as CUP
    pattern: /^\x1b\[\d{0,3};\d{0,3}f/,
    sub: remove
  }, {
    // catch-all for CSI sequences?
    pattern: /^\x1b\[?[\d;]{0,3}/,
    sub: remove
  }, {
    /**
     * extracts real text - not containing:
     * - `\x1b' - ESC - escape (Ascii 27)
     * - '\x08' - BS - backspace (Ascii 8)
     * - `\n` - Newline - linefeed (LF) (ascii 10)
     * - `\r` - Windows Carriage Return (CR)
     */
    pattern: /^(([^\x1b\x08\r\n])+)/,
    sub: realText
  }];

  function process(handler, i) {
    if (i > ansiHandler && ansiMatch) {
      return;
    }

    ansiMatch = false;
    text = text.replace(handler.pattern, handler.sub);
  }

  var results1 = [];
  var _text = text,
      length = _text.length;

  outer: while (length > 0) {
    for (var i = 0, o = 0, len = tokens.length; o < len; i = ++o) {
      var handler = tokens[i];
      process(handler, i);

      if (text.length !== length) {
        // We matched a token and removed it from the text. We need to
        // start matching *all* tokens against the new text.
        length = text.length;
        continue outer;
      }
    }

    if (text.length === length) {
      break;
    }

    results1.push(0);
    length = text.length;
  }

  return results1;
}
/**
 * If streaming, then the stack is "sticky"
 *
 * @param {Array} stickyStack
 * @param {string} token
 * @param {*} data
 * @returns {Array}
 */


function updateStickyStack(stickyStack, token, data) {
  if (token !== 'text') {
    stickyStack = stickyStack.filter(notCategory(categoryForCode(data)));
    stickyStack.push({
      token: token,
      data: data,
      category: categoryForCode(data)
    });
  }

  return stickyStack;
}

var Filter = /*#__PURE__*/function () {
  /**
   * @param {object} options
   * @param {string=} options.fg The default foreground color used when reset color codes are encountered.
   * @param {string=} options.bg The default background color used when reset color codes are encountered.
   * @param {boolean=} options.newline Convert newline characters to `<br/>`.
   * @param {boolean=} options.escapeXML Generate HTML/XML entities.
   * @param {boolean=} options.stream Save style state across invocations of `toHtml()`.
   * @param {(string[] | {[code: number]: string})=} options.colors Can override specific colors or the entire ANSI palette.
   */
  function Filter(options) {
    _classCallCheck(this, Filter);

    options = options || {};

    if (options.colors) {
      options.colors = Object.assign({}, defaults.colors, options.colors);
    }

    this.options = Object.assign({}, defaults, options);
    this.stack = [];
    this.stickyStack = [];
  }
  /**
   * @param {string | string[]} input
   * @returns {string}
   */


  _createClass(Filter, [{
    key: "toHtml",
    value: function toHtml(input) {
      var _this = this;

      input = typeof input === 'string' ? [input] : input;
      var stack = this.stack,
          options = this.options;
      var buf = [];
      this.stickyStack.forEach(function (element) {
        var output = generateOutput(stack, element.token, element.data, options);

        if (output) {
          buf.push(output);
        }
      });
      tokenize(input.join(''), options, function (token, data) {
        var output = generateOutput(stack, token, data, options);

        if (output) {
          buf.push(output);
        }

        if (options.stream) {
          _this.stickyStack = updateStickyStack(_this.stickyStack, token, data);
        }
      });

      if (stack.length) {
        buf.push(resetStyles(stack));
      }

      return buf.join('');
    }
  }]);

  return Filter;
}();

module.exports = Filter;

},{"entities":4}]},{},[]);