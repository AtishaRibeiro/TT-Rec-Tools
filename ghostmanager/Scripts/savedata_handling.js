var TRACK_NAMES = {
    0: "LC", 1: "MMM", 2: "MG", 3: "TF",
    4: "MC", 5: "CM", 6: "DKSC", 7: "WGM",
    8: "DC", 9: "KC", 10: "MT", 11: "GV",
    12: "DDR", 13: "MH", 14: "BC", 15: "RR",
    16: "rPB", 17: "rYF", 18: "rGV2", 19: "rMR",
    20: "rSL", 21: "rSGB", 22: "rDS", 23: "rWS",
    24: "rDH", 25: "rBC3", 26: "rDKJP", 27: "rMC", 
    28: "rMC3", 29: "rPG", 30: "rDKM", 31: "rBC"
};

// track_id: (track_nr, track_index)
var TRACK_IDS = {
    0x00: [4, 4],  0x01: [1, 1],  0x02: [2, 2],  0x03: [10, 11],
    0x04: [3, 3],  0x05: [5, 5],  0x06: [6, 6],  0x07: [7, 7],
    0x08: [0, 0],  0x09: [8, 8],  0x0A: [12, 13], 0x0B: [11, 10],
    0x0C: [14, 14], 0x0D: [15, 15], 0x0E: [13, 12], 0x0F: [9, 9],
    0x10: [24, 16], 0x11: [25, 27], 0x12: [26, 23], 0x13: [27, 30],
    0x14: [28, 17], 0x15: [29, 24], 0x16: [30, 29], 0x17: [31, 22],
    0x18: [18, 28], 0x19: [17, 18], 0x1A: [21, 19], 0x1B: [20, 20],
    0x1C: [23, 31], 0x1D: [22, 26], 0x1E: [19, 25], 0x1F: [16, 21]
};

var DOWNLOADING_GHOSTS = false;
var IMPORTING = true; // false when exporting
var RKSYS = [];
var RKG = {};
var GHOSTS_IMPORT = [];
var GHOSTS_LICENSE = [null, null, null, null];
var CURRENT_LICENSE = -1;

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

function delete_ghost(license_index, ghost_index) {
    GHOSTS_IMPORT[license_index].splice(ghost_index, 1);
    update_table([license_index], true);
}

function ghosts_to_table(tbody, ghosts, ghost_import) {
    for (var ghost of ghosts) {
        var row_ref = tbody.insertRow();
        // add track name
        var new_cell = row_ref.insertCell(0);
        new_cell.innerHTML = TRACK_NAMES[ghost["track_index"]];
        new_cell.style.width = "20%";
        // add ghost time
        new_cell = row_ref.insertCell(1);
        new_cell.innerHTML = ghost["time"];
        new_cell.style.width = "25%";
        // add mii name
        new_cell = row_ref.insertCell(2);
        new_cell.innerHTML = ghost["mii_name"];
        new_cell.style.width = "45%";

        new_cell = row_ref.insertCell(3);
        new_cell.style.width = "10px";
        if (ghost_import) {
            // add delete button
            new_cell.style.cursor = "pointer";
            new_cell.onclick = function() {delete_ghost(license_index, row_ref.rowIndex);};
            var delete_button = document.createElement('I');
            delete_button.className = 'fas fa-ban';
            new_cell.appendChild(delete_button);
        } else {
            // add checkbox
            new_cell.style.paddingLeft = "15px";
            var checkbox = document.createElement('input');
            checkbox.type = "checkbox";
            new_cell.appendChild(checkbox);
        }
    }
    return tbody;
}

function update_import_table() {
    var tbody = document.getElementById('import-t');
    var new_tbody = document.createElement('tbody');
    new_tbody.id = tbody.id;
    
    // sort ghosts based on their track index
    GHOSTS_IMPORT.sort(function(a, b) {
        var keyA = a["track_index"],
            keyB = b["track_index"];
        if (keyA < keyB) return -1;
        if (keyA > keyB) return 1;
        return 0;
    });
    new_tbody = ghosts_to_table(new_tbody, GHOSTS_IMPORT, true);
    tbody.parentNode.replaceChild(new_tbody, tbody);
}

function update_license_table(index, ghost_type) {
    if (index == -1) {
        return;
    }
    var license_div = document.querySelector('#license .tabs');
    const class_regex = new RegExp(/neutral-tabs|l[1-4]-tabs/);
    license_div.className = license_div.className.replace(class_regex, `l${index+1}-tabs`);

    var tbody = document.getElementById('license-t');
    var new_tbody = document.createElement('tbody');
    new_tbody.id = tbody.id;
    new_tbody.classList.add(`l${index+1}-t`);
    // sort ghosts based on their track index
    GHOSTS_LICENSE[index][ghost_type].sort(function(a, b) {
        var keyA = a["track_index"],
            keyB = b["track_index"];
        if (keyA < keyB) return -1;
        if (keyA > keyB) return 1;
        return 0;
    });
    //GHOSTS_EXPORT = ghosts; // update to sorted list (important for checkboxes)
    new_tbody = ghosts_to_table(new_tbody, GHOSTS_LICENSE[index][ghost_type], false);
    tbody.parentNode.replaceChild(new_tbody, tbody);
}

function update_mini(highlight) {
    var minis = document.querySelectorAll('.mini');
    var id = 0;
    for (mini of minis) {
        mini.classList.remove('mini-border');
        mini.querySelector('svg').style.visibility = GHOSTS_LICENSE[id] == null ? 'visible' : 'hidden';
        id += 1;
    }
    minis[highlight].classList.add('mini-border');
}

function update_chosen_license(license_index, ghost_type) {
    CURRENT_LICENSE = license_index;
    if (GHOSTS_LICENSE[license_index] != null) {
        update_license_table(license_index, ghost_type);
        update_mini(license_index);

        var download_tab = document.querySelector('#download a');
        download_tab.innerHTML = `Downloaded [${GHOSTS_LICENSE[license_index]['download'].length}/32]`
    }
}

function get_ghost_summary(rkg) {
    var track_id = rkg[0x7] >> 0x2;
    var track_index = TRACK_IDS[track_id][1];

    var time_1 = rkg[4];
    var time_2 = rkg[5];
    var time_3 = rkg[6];
    // extract the time
    var min = time_1 >> 0x1;
    var sec = ((time_1 & 0x1) << 0x6) | (time_2 >> 0x2);
    var mil = ((time_2 & 0x3) << 0x8) | time_3;

    min = min.toString();
    sec = ("00" + sec.toString()).slice(-2);
    mil = ("000" + mil.toString()).slice(-3);

    var mii_name = "";
    for (var i = 0x3E; i < 0x52; i += 2) {
        var char_code = (rkg[i] << 8) | rkg[i+1];
        if (char_code == 0) break;
        mii_name += String.fromCharCode(char_code);
    }
    return {
        "track_id": track_id,
        "track_index": track_index,
        "time": `${min}:${sec}.${mil}`,
        "mii_name": mii_name,
        "rkg": rkg
    };
}

function read_rkg_files(files) {
    var current_file = 0;

    for (var file of files) {
        const reader = new FileReader();
        reader.readAsArrayBuffer(file);
        reader.onload = function(){
            const arrayBuffer = this.result;
            var rkg = new Uint8Array(arrayBuffer);
            if (String.fromCharCode.apply(null, rkg.slice(0, 4)) == "RKGD") {
                var ghost_summary = get_ghost_summary(rkg);
                GHOSTS_IMPORT.push(ghost_summary);
            }

            current_file++;
            if (current_file == files.length) {
                update_import_table();
            }
        }
    }
}

function read_rksys_file(file_name_obj, files) {
    const reader = new FileReader();
    reader.readAsArrayBuffer(files[0]);
    reader.onload = function(){
        const arrayBuffer = this.result;
        RKSYS = new Uint8Array(arrayBuffer);   
        if (String.fromCharCode.apply(null, RKSYS.slice(0, 4)) == "RKSD") {
            file_name_obj.classList.remove("no-file");
            file_name_obj.textContent = files[0].name;

            var first_license = -1;
            for (var i = 0; i < 4; i++) { // check for valid licenses
                var license_addr = 0x8 + i * 0x8cc0;
                if (String.fromCharCode.apply(null, RKSYS.slice(license_addr, license_addr + 0x4)) == "RKPD") {
                    first_license = first_license == -1 ? i : first_license;
                    GHOSTS_LICENSE[i] = {
                        'pb': [],
                        'download': []
                    };
                    find_ghosts(i);
                } else {
                    GHOSTS_LICENSE[i] = null;
                }
            }
            update_chosen_license(first_license, 'pb');
        } else {
            RKSYS = {};
            file_name_obj.classList.add("no-file");
            file_name_obj.textContent = "No file uploaded";
        }
    };
}

function save_ghost(license_index, address, ghost_type) {
    var rkg = RKSYS.slice(address, address + 0x2800);
    if (String.fromCharCode.apply(null, rkg.slice(0, 4)) == "RKGD") {
        var ghost = get_ghost_summary(rkg);
        GHOSTS_LICENSE[license_index][ghost_type].push(ghost);
    }
}

function find_ghosts(license_index) {
    var license_ghosts_addr = 0x28000 + (0xA5000 * license_index);

    // go over every pb ghost in this license
    for (var i = 0; i < 32; i++) {
        var ghost_file_addr = i * 0x2800 + license_ghosts_addr;
        save_ghost(license_index, ghost_file_addr, 'pb');
    }
    // go over every downloaded ghost in this license
    for (var i = 0; i < 32; i++) {
        var ghost_file_addr = i * 0x2800 + license_ghosts_addr + 0x50000;
        save_ghost(license_index, ghost_file_addr, 'download');
    }
}

function decompress_rkg(rkg) {
    var result = DecodeAll(rkg);
    if (result.length = 0) { // if it was already decompressed
        rkg = rkg.slice(0, rkg.length - 4);
    } else {
        var ghost_header = rkg.slice(0, 0x88);
        rkg = new Uint8Array(ghost_header.length + result.length);
        rkg.set(ghost_header);
        rkg.set(result, ghost_header.length);
    }
    return rkg;
}

function toBytesInt32 (num) {
    arr = new ArrayBuffer(4); // an Int32 takes 4 bytes
    view = new DataView(arr);
    view.setUint32(0, num, false); // byteOffset = 0; litteEndian = false
    return new Uint8Array(arr);
}

function handle_rkg(rkg) {
    rkg = decompress_rkg(rkg); // decompresses the rkg and also removes the checksum at the end

    // set to personal best
    rkg[12] = 0;
    rkg[13] = (rkg[13] & 0x03) | 0x04;

    // recalculate checksum
    var rkg_data = Array.from(rkg);

    // extend so the ghost file is exactly 0x2800 bytes in length (including checksum)
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

function import_rkgs() {
    var ghost_files = RKSYS.slice(0x28000, 0x2BC000);
    var save_data = RKSYS.slice(0, 0x27FFC);

    for (var i = 0; i < 4; i++) {
        if (GHOSTS_IMPORT[i] != null) {
            var license_ghosts_addr = 0xA5000 * i;
            var license_save_addr = 0x8 + (0x8CC0 * i);

            for (ghost of GHOSTS_IMPORT[i]) {
                var track_nr = TRACK_IDS[ghost["track_id"]][0];
                var ghost_file_addr = track_nr * 0x2800 + license_ghosts_addr;

                // write ghost to savefile
                var rkg = handle_rkg(ghost["rkg"]);
                for (var j = 0; j < 0x2800; j++) {
                    ghost_files[ghost_file_addr + j] = rkg[j];
                }
                
                // adjust pb flag
                var byte_nr = 3 - Math.floor(track_nr / 8);
                var byte_addr = license_save_addr + 0x4 + byte_nr;
                save_data[byte_addr] = save_data[byte_addr] | (1 << (track_nr % 8));
            }
        }
    }

    var checksum_array = toBytesInt32(crc32(save_data));
    RKSYS = new Uint8Array(save_data.length + checksum_array.length + ghost_files.length);
    RKSYS.set(save_data);
    RKSYS.set(checksum_array, save_data.length);
    RKSYS.set(ghost_files, save_data.length + checksum_array.length);
    create_file_download(new Blob([RKSYS], { type: 'application/octet-stream' }), "rksys.dat");
}

async function make_staff_ghost(rkg) {
    // set to staff ghost
    rkg[12] = 0x08; // set compressed flag
    rkg[13] = (rkg[13] & 0x03) | 0x98;

    // get the input data length
    var input_length_arr = rkg.slice(14, 16);
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

    // recalculate checksum
    var rkg_data = Array.from(rkg);
    rkg_data = Uint8Array.from(rkg_data);
    var checksum_array = toBytesInt32(crc32(rkg_data));
    rkg = new Uint8Array(rkg_data.length + checksum_array.length);
    rkg.set(rkg_data);
    rkg.set(checksum_array, rkg_data.length);

    return rkg;
}

async function zip_and_download() {
    var total_ghosts = document.querySelectorAll('input[type=checkbox]:checked').length;
    if (total_ghosts == 0) return;

    // change export button to give feedback of progress
    set_export_feedback(true);
    var current_ghost = 0; 

    var ghost_file;
    var file_name;

    // handle all slected ghost files and compress them
    var zip = new JSZip();
    for (var i = 0; i < 4; i++) {
        if (GHOSTS_EXPORT[i] == null) continue;
        var tbody = document.getElementById(`l${i+1}_t`);
        for (var j = 0; j < tbody.rows.length; j++) {
            var row = tbody.rows[j];
            if (row.cells[3].childNodes[0].checked) { // if ghost is slecected for download
                update_progress(current_ghost + 1, total_ghosts);
                var ghost = GHOSTS_EXPORT[i][j];
                var encoded_ghost = await make_staff_ghost(ghost["rkg"]);
                ghost_file = new Blob([encoded_ghost], {type: "application/octet-stream"});
                var time = ghost["time"].replace(':', 'm').replace('.', 's');
                file_name = `${TRACK_NAMES[ghost["track_index"]]}_${ghost["mii_name"]}_${time}.rkg`
                zip.file(file_name, ghost_file);
                await new Promise(r => setTimeout(r, 10));
                current_ghost++;
            }
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

async function download() {
    if (RKSYS.length != 0) {
        if (IMPORTING) {
            // check if there actually are any ghosts to be imported
            var ghosts_present = false;
            for (var i = 0; i < 4; i++) {
                if (GHOSTS_IMPORT[i] != null && GHOSTS_IMPORT[i].length != 0) ghosts_present = true;
            }
            if (!ghosts_present) return;
            
            import_rkgs();
        } else {
            await zip_and_download();
        }
    }
}