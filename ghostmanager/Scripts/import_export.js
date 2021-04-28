//
// All functions that are related to importing or exporting straight to/from the savefile
//

// GENERAL HELPER FUNCTIONS

var makeCRCTable = function(){
    var c;
    var crcTable = [];
    for(var n =0; n < 256; n++){
        c = n;
        for(var k =0; k < 8; k++){
            c = ((c&1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
        }
        crcTable[n] = c;
    }
    return crcTable;
}

var crc32 = function(byte_array) {
    var crcTable = window.crcTable || (window.crcTable = makeCRCTable());
    var crc = 0 ^ (-1);

    for (var b of byte_array) {
        crc = (crc >>> 8) ^ crcTable[(crc ^ b) & 0xFF];
    }

    return (crc ^ (-1)) >>> 0;
};

function toBytesInt32 (num) {
    arr = new ArrayBuffer(4); // an Int32 takes 4 bytes
    view = new DataView(arr);
    view.setUint32(0, num, false); // byteOffset = 0; litteEndian = false
    return new Uint8Array(arr);
}

function create_file_download(file, filename) {
    // taken from https://stackoverflow.com/questions/27946228/file-download-a-byte-array-as-a-file-in-javascript-extjs/27963891
    var a = window.document.createElement('a');
    a.href = window.URL.createObjectURL(file);
    a.download = filename;
    // Append anchor to body.
    document.body.appendChild(a);
    a.click();
    // Remove anchor from body
    document.body.removeChild(a);
}

// ACTUAL FUNCTIONS

function decompress_rkg(rkg) {
    var result = DecodeAll(rkg);
    if (result.length == 0) { // if it was already decompressed
        rkg = rkg.slice(0, rkg.length - 4);
    } else {
        var ghost_header = rkg.slice(0, 0x88);
        rkg = new Uint8Array(ghost_header.length + result.length);
        rkg.set(ghost_header);
        rkg.set(result, ghost_header.length);
    }
    return rkg;
}

function prepare_rkg_for_import(rkg, index) {
    rkg = decompress_rkg(rkg);
    rkg[0xC] = 0x00; // decompression flag

    // set the correct ghost type
    var ghost_type;
    if (index == null) { // pb ghost
        ghost_type = 0x4;
    } else { // downloaded ghost
        if (index < 30) {
            // set to downloaded friend ghost
            ghost_type = (0x7 + index) << 2
        } else {
            // set to wr/cr ghost
            ghost_type = index - 28 << 2;
        }
    }
    rkg[0xD] = (rkg[0xD] & 0x03) | ghost_type;

    // extend so the ghost file is exactly 0x2800 bytes in length (including checksum)
    var rkg_data = Array.from(rkg).slice(0, 0x27fc);
    for(var i = rkg_data.length; i < 0x27fc; i++){
        rkg_data.push(0);
    }

    rkg_data = Uint8Array.from(rkg_data);
    var checksum_array = toBytesInt32(crc32(rkg_data));
    rkg = new Uint8Array(rkg_data.length + checksum_array.length);
    rkg.set(rkg_data);
    rkg.set(checksum_array, rkg_data.length);

    return rkg;
}

async function save_and_download_save() {
    var ghost_files = RKSYS.slice(0x28000, 0x2BC000);
    var save_data = RKSYS.slice(0, 0x27FFC);
    var free_download_slots = FREE_DOWNLOAD_SLOTS;

    // set region
    save_data[0x26B0A] = REGION_VALUES[document.getElementById("region-selector").value];

    for (var i = 0; i < 4; i++) {
        if (GHOSTS_LICENSE[i] != null) {
            var license_ghosts_addr = 0xA5000 * i;
            var license_save_addr = 0x8 + (0x8CC0 * i);
            // clear pb and download flags
            for (var j = 0x4; j < 0xC; j++) {
                save_data[license_save_addr + j] = 0x0;
            }
            const pb_fl_addr = license_save_addr + 0x4; // pb flags address
            const dl_fl_addr = license_save_addr + 0x8; // download flags address

            // delete the ghosts that have to be deleted (GHOSTS_TO_BE_DELETED)
            for (ghost of GHOSTS_TO_BE_DELETED[i]) {
                for (var j = 0; j < 0x2800; j++) {
                    ghost_files[ghost['address'] - 0x28000 + j] = 0x00;
                    if (ghost['type'] == 'pb') { // clear the time entry data if pb
                        var entry_address = license_save_addr + 0xDB8 + 0x60 * TRACK_IDS[ghost["track_id"]][0];
                        for (var k = 0x54; k <= 0x58; k++) {
                            save_data[entry_address + k] = 0x00;
                        }
                    }
                }
            }

            // import pb's
            for (ghost of GHOSTS_LICENSE[i]['pb']) {
                var track_nr = ghost['index'];
                // only import the ghosts that are newly imported
                if (ghost['type'] == 'import') {
                    track_nr = TRACK_IDS[ghost["track_id"]][0];
                    var ghost_file_addr = track_nr * 0x2800 + license_ghosts_addr;
                    // write ghost to savefile
                    var rkg = prepare_rkg_for_import(ghost["rkg"], null);
                    for (var j = 0; j < 0x2800; j++) {
                        ghost_files[ghost_file_addr + j] = rkg[j];
                    }

                    // adjust tt entry so the time shows up on track selection
                    var entry_address = license_save_addr + 0xDB8 + 0x60 * track_nr;
                    save_data[entry_address + 0x54] = ghost["rkg"][0x4];
                    save_data[entry_address + 0x55] = ghost["rkg"][0x5];
                    save_data[entry_address + 0x56] = ghost["rkg"][0x6];
                    save_data[entry_address + 0x57] = ghost["vehicle"] << 0x2;
                    save_data[entry_address + 0x58] = ghost["character"] | 0x80;
                    save_data[entry_address + 0x59] = (ghost["controller"] << 0x5) | (0x1F & save_data[entry_address + 0x59])
                }
                // adjust pb flag
                var byte_nr = 3 - Math.floor(track_nr / 8);
                save_data[pb_fl_addr + byte_nr] = save_data[pb_fl_addr + byte_nr] | (1 << (track_nr % 8));
            }

            // import downloaded ghosts
            for (ghost of GHOSTS_LICENSE[i]['download']) {
                var ghost_index = ghost['index'];
                // only import the ghosts that are newly imported
                if (ghost['type'] == 'import') {
                    if (free_download_slots[i].length == 0) continue; // should never happen
                    ghost_index = free_download_slots[i][0];
                    free_download_slots[i].splice(0, 1);
                    var ghost_file_addr = ghost_index * 0x2800 + license_ghosts_addr + 0x50000;
    
                    // write ghost to savefile
                    var rkg = prepare_rkg_for_import(ghost["rkg"], ghost_index);
                    for (var j = 0; j < 0x2800; j++) {
                        ghost_files[ghost_file_addr + j] = rkg[j];
                    }
                }
                // adjust download flag
                var byte_nr = 3 - Math.floor(ghost_index / 8);
                save_data[dl_fl_addr + byte_nr] = save_data[dl_fl_addr + byte_nr] | (1 << (ghost_index % 8));
            }
        }
    }

    var checksum_array = toBytesInt32(crc32(save_data));
    var new_rksys = new Uint8Array(save_data.length + checksum_array.length + ghost_files.length);
    new_rksys.set(save_data);
    new_rksys.set(checksum_array, save_data.length);
    new_rksys.set(ghost_files, save_data.length + checksum_array.length);
    create_file_download(new Blob([new_rksys], { type: 'application/octet-stream' }), "rksys.dat");
}

async function make_staff_ghost(rkg) {
    const needs_compressing = (rkg[12] & 0x08) != 0x08;
    rkg[12] = 0x08; // set compressed flag
    rkg[13] = (rkg[13] & 0x03) | 0x98; // set to staff ghost

    if (needs_compressing) {
        // get the input data length
        var input_length_arr = rkg.slice(0x0E, 0x10);
        var dataview = new DataView(input_length_arr.buffer);
        var input_length =  dataview.getInt16(0);

        // split into header and input data
        var header = rkg.slice(0, 0x88);
        var input_data = rkg.slice(0x88, 0x88 + input_length);

        input_data = await encodeAll(input_data);
        var input_data_size = toBytesInt32(input_data.length);

        rkg = new Uint8Array(header.length + input_data_size.length + input_data.length);
        rkg.set(header);
        rkg.set(input_data_size, header.length);
        rkg.set(input_data, header.length + input_data_size.length);
    }    

    // recalculate checksum
    var rkg_data = Array.from(rkg);
    rkg_data = Uint8Array.from(rkg_data);
    var checksum_array = toBytesInt32(crc32(rkg_data));
    rkg = new Uint8Array(rkg_data.length + checksum_array.length);
    rkg.set(rkg_data);
    rkg.set(checksum_array, rkg_data.length);

    return rkg;
}

async function zip_and_download_ghosts(ghost_type) {
    var total_ghosts = document.querySelectorAll('#license-t input[type=checkbox]:checked').length;
    if (total_ghosts == 0) return;
    if (CURRENT_LICENSE == -1) return;

    // change export button to give feedback of progress
    set_export_feedback(true);
    var current_ghost = 0; 

    var ghost_file;
    var file_name;

    // handle all selected ghost files and compress them
    var zip = new JSZip();
    var tbody = document.getElementById('license-t');
    for (var j = 0; j < tbody.rows.length; j++) {
        var row = tbody.rows[j];
        if (row.cells[3].childNodes[0].checked) { // if ghost is slecected for download
            update_progress(current_ghost + 1, total_ghosts);
            var ghost = GHOSTS_LICENSE[CURRENT_LICENSE][ghost_type][j];
            var encoded_ghost = await make_staff_ghost(ghost["rkg"]);
            ghost_file = new Blob([encoded_ghost], {type: "application/octet-stream"});
            var time = ghost["time"].replace(':', 'm').replace('.', 's');
            file_name = `${TRACK_NAMES[ghost["track_index"]]}_${ghost["mii_name"]}_${time}.rkg`
            zip.file(file_name, ghost_file);
            await new Promise(r => setTimeout(r, 10));
            current_ghost++;
        }
    }

    if (total_ghosts == 1) { // download only a single file if only one was selected
        create_file_download(ghost_file, file_name);
    } else { // create download of zip file with all ghost files
        zip.generateAsync({type:"blob"}).then(function(content) {
            create_file_download(content, "exported_ghosts.zip");
        });
    }

    set_export_feedback(false);
    return true;
}