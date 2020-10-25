//This code was translated from Thakis' C++ Yaz0 decoder into javascript

function DecodeAll(src) {
    var readBytes = 0;
    var srcSize = src.length;
    console.log(`input file size: ${srcSize.toString(16)}\n`);
    var decodedBytes = new Uint8Array();

    while (readBytes < srcSize) {
        //search yaz1 block
        while (readBytes + 3 < srcSize
            && (String.fromCharCode(src[readBytes]) != 'Y'
            || String.fromCharCode(src[readBytes + 1]) != 'a'
            || String.fromCharCode(src[readBytes + 2]) != 'z'
            || String.fromCharCode(src[readBytes + 3]) != '1'))
            ++readBytes;

        if (readBytes + 3 >= srcSize)
            return decodedBytes; //nothing left to decode

        readBytes += 4;

        var original = src.slice(readBytes, readBytes + 4);
        var dataview = new DataView(original.buffer);
        var Size =  dataview.getInt32(0);
        var Dst = new Uint8Array(Size + 0x1000);

        readBytes += 12; //4 byte size, 8 byte unused

        var r = decodeYaz1(src, readBytes, srcSize - readBytes, Dst, Size);
        readBytes += r["srcPos"];
        console.log(`Read ${readBytes.toString(16)} bytes from input\n`);
        
        decodedBytes = r["dst"];
    }

    return decodedBytes;
}

function decodeYaz1(src, offset, srcSize, dst, uncompressedSize) {
    var r = {"srcPos": 0, "dstPos": 0};
    //int srcPlace = 0, dstPlace = 0; //current read/write positions

    var validBitCount = 0; //number of valid bits left in "code" byte
    var currCodeByte = src[offset + r["srcPos"]];
    while (r["dstPos"] < uncompressedSize) {
        //read new "code" byte if the current one is used up
        if (validBitCount == 0) {
            currCodeByte = src[offset + r["srcPos"]];
            r["srcPos"]++;
            validBitCount = 8;
        }

        if ((currCodeByte & 0x80) != 0) {
            //straight copy
            dst[r["dstPos"]] = src[offset + r["srcPos"]];
            r["dstPos"]++;
            r["srcPos"]++;
            //if(r["srcPos"] >= srcSize)
            //  return r;
        } else {
            //RLE part
            var byte1 = src[offset + r["srcPos"]];
            var byte2 = src[offset + r["srcPos"] + 1];
            r["srcPos"] += 2;
            //if(r["srcPos"] >= srcSize)
            //  return r;

            var dist = ((byte1 & 0xF) << 8) | byte2;
            var copySource = r["dstPos"] - (dist + 1);

            var numBytes = byte1 >> 4;
            if (numBytes == 0) {
                numBytes = src[offset + r["srcPos"]] + 0x12;
                r["srcPos"]++;
                //if(r["srcPos"] >= srcSize)
                //  return r;
            } else
                numBytes += 2;

            //copy run
            for (var i = 0; i < numBytes; ++i) {
                dst[r["dstPos"]] = dst[copySource];
                copySource++;
                r["dstPos"]++;
            }
        }

        //use next bit from "code" byte
        currCodeByte <<= 1;
        validBitCount -= 1;
    }

    r["dst"] = dst;
    return r;
}