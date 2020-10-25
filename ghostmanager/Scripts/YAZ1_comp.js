//This code was translated from shevious' C++ Yaz0 encoder into javascript

//version 1.0 (20050707)
//by shevious
//Thanks to thakis for yaz0dec 1.0.

// simple and straight encoding scheme for Yaz1
function simpleEnc(src, size, pos) {
  var startPos = pos - 0x1000;
  var numBytes = 1;
  var matchPos = 0;

  if (startPos < 0) startPos = 0;

  for (var i = startPos; i < pos; i++) {
    for (var j = 0; j < size-pos; j++) {
      if (src[i+j] != src[j+pos]) break;
    }
    if (j > numBytes) {
      numBytes = j;
      matchPos = i;
    }
  }
  NINTENDOENC_MATCHPOS = matchPos;
  if (numBytes == 2) numBytes = 1;
  return numBytes;
}

var NINTENDOENC_NUMBYTES1;
var NINTENDOENC_MATCHPOS;
var NINTENDOENC_PREVFLAG;

// a lookahead encoding scheme for ngc Yaz0
function nintendoEnc(src, size, pos) {
  var numBytes = 1;

  // if prevFlag is set, it means that the previous position was determined by look-ahead try.
  // so just use it. this is not the best optimization, but nintendo's choice for speed.
  if (NINTENDOENC_PREVFLAG == 1) {
    MATCHPOS = NINTENDOENC_MATCHPOS;
    NINTENDOENC_PREVFLAG = 0;
    return NINTENDOENC_NUMBYTES1;
  }
  NINTENDOENC_PREVFLAG = 0;
  numBytes = simpleEnc(src, size, pos);
  MATCHPOS = NINTENDOENC_MATCHPOS;

  // if this position is RLE encoded, then compare to copying 1 byte and next position(pos+1) encoding
  if (numBytes >= 3) {
    NINTENDOENC_NUMBYTES1 = simpleEnc(src, size, pos+1);
    // if the next position encoding is +2 longer than current position, choose it.
    // this does not guarantee the best optimization, but fairly good optimization with speed.
    if (NINTENDOENC_NUMBYTES1 >= numBytes+2) {
      numBytes = 1;
      NINTENDOENC_PREVFLAG = 1;
    }
  }
  return numBytes;
}

var MATCHPOS;

function encodeYaz1(src, srcSize) {   
  var r = {"srcPos": 0, "dstPos": 0};
  var dst = new Array(24);    // 8 codes * 3 bytes maximum
  NINTENDOENC_PREVFLAG = 0;
  
  var validBitCount = 0; //number of valid bits left in "code" byte
  var currCodeByte = 0;
  while(r["srcPos"] < srcSize) {
    var numBytes;


    numBytes = nintendoEnc(src, srcSize, r["srcPos"]);
    if (numBytes < 3) {
      //straight copy
      dst[r["dstPos"]] = src[r["srcPos"]];
      r["dstPos"]++;
      r["srcPos"]++;
      //set flag for straight copy
      currCodeByte |= (0x80 >> validBitCount);
    } else {
      //RLE part
      var dist = r["srcPos"] - MATCHPOS - 1; 
      var byte1, byte2, byte3;

      if (numBytes >= 0x12) {  // 3 byte encoding
        byte1 = 0 | (dist >> 8);
        byte2 = dist & 0xff;
        dst[r["dstPos"]++] = byte1;
        dst[r["dstPos"]++] = byte2;
        // maximum runlength for 3 byte encoding
        if (numBytes > 0xff+0x12) numBytes = 0xff+0x12;
        byte3 = numBytes - 0x12;
        dst[r["dstPos"]++] = byte3;
      } else { // 2 byte encoding
        byte1 = ((numBytes - 2) << 4) | (dist >> 8);
        byte2 = dist & 0xff;
        dst[r["dstPos"]++] = byte1;
        dst[r["dstPos"]++] = byte2;
      }
      r["srcPos"] += numBytes;
    }
    validBitCount++;
    //write eight codes
    if(validBitCount == 8) {
      DST.push(currCodeByte);
      DST = DST.concat(dst.slice(0, r["dstPos"]));

      currCodeByte = 0;
      validBitCount = 0;
      r["dstPos"] = 0;
    }
  }
  if(validBitCount > 0) {
    DST.push(currCodeByte);
    DST = DST.concat(dst.slice(0, r["dstPos"]));

    currCodeByte = 0;
    validBitCount = 0;
    r["dstPos"] = 0;
  }
}

var DST;

async function encodeAll(src, pad=true) {
  DST = new Uint8Array(16);
  // write 4 bytes Yaz1 header
  DST.set([0x59, 0x61, 0x7a, 0x31]);
  // write 4 bytes uncompressed size
  DST.set(toBytesInt32(src.length), 4);
  // write 8 bytes unused dummy
  DST.set([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00], 8);

  DST = Array.from(DST);

  // this is something I really don't understand but for some reason if this wait here is not included
  // the progress on the page is not updated until after all the ghosts have been zipped
  // waiting just 10ms here solves that problem somehow
  await new Promise(r => setTimeout(r, 10));

  encodeYaz1(src, src.length);

  if (pad) {
    // pad the input data so the length is a multiple of 4
    for (var i = 0; i < DST.length % 4; i++) {
      DST.push(0x00);
    }
}

  return Uint8Array.from(DST);
}
