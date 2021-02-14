
var DOWNLOADING_GHOSTS = false;
var RKSYS = []; // the entire rksys.dat file
var GHOSTS_IMPORT = []; // all uploaded ghosts waiting to be imported
var GHOSTS_LICENSE = [null, null, null, null]; // all ghosts for eacht of the 4 licenses
var CURRENT_LICENSE = -1; // the index of the currently selected license
var GHOSTS_TO_BE_DELETED = []; // the addresses of ghosts that should be deleted
var FREE_DOWNLOAD_SLOTS = [[], [], [], []]; // the addresses of the available download ghost slots for each license

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
    var row_index = 0;
    for (var ghost of ghosts) {
        var row_ref = tbody.insertRow();
        row_ref.id = `${ghost_import ? 'import' : 'license'}-${row_index}`;
        row_ref.addEventListener("mouseenter", create_ghost_tooltip(ghost));
        row_ref.addEventListener("mouseleave", destroy_ghost_tooltip(ghost));
        row_index += 1;
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
            new_cell.onclick = remove_import_ghost;
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

function initial_import_table(tbody, ghost_import) {
    var row_ref = tbody.insertRow();
    row_ref.style.paddingTop = "12em";
    row_ref.class = "is-centered";
    var new_cell = row_ref.insertCell(0);
    new_cell.style.width = "0%";
    new_cell = row_ref.insertCell(1);
    new_cell.style.width = "100%";
    new_cell.classList.add("is-size-5", "has-text-weight-bold");

    if (ghost_import) {
        var clone_icon = document.createElement('I');
        clone_icon.className = 'far fa-clone fa-4x';
        new_cell.appendChild(clone_icon);
        var text = document.createElement('div');
        text.innerHTML = "Drop ghost files here";
        //text.classList.add("is-size-5", "has-text-weight-bold");
        new_cell.appendChild(text);
    } else {
        var div = document.createElement('div');
        div.innerHTML = "Upload rksys.dat"
        new_cell.appendChild(div);
        div = document.createElement('div');
        div.innerHTML = "OR"
        new_cell.appendChild(div);
        var button = document.createElement('button');
        button.id = "blank-rksys";
        button.innerHTML = "Use blank rksys.dat"
        button.classList.add("button", "is-info", "is-size-6", "has-text-weight-bold");
        button.onclick = get_blank_rksys;
        new_cell.appendChild(button);
    }
    

    new_cell = row_ref.insertCell(2);
    new_cell.style.width = "0%";
   
    return tbody;
}

function update_import_table(initial=false) {
    var tbody = document.getElementById('import-t');
    var new_tbody = document.createElement('tbody');
    new_tbody.id = tbody.id;
    
    if (initial) {
        new_tbody = initial_import_table(new_tbody, true);
    } else {
        // sort ghosts based on their track index
        GHOSTS_IMPORT.sort(function(a, b) {
            var keyA = a["track_index"],
                keyB = b["track_index"];
            if (keyA < keyB) return -1;
            if (keyA > keyB) return 1;
            return 0;
        });
        new_tbody = ghosts_to_table(new_tbody, GHOSTS_IMPORT, true);
    } 
    tbody.parentNode.replaceChild(new_tbody, tbody);
}

function update_license_table(index, ghost_type, initial=false) {
    var license_div = document.querySelector('#license .tabs');
    const class_regex = new RegExp(/neutral-tabs|l[1-4]-tabs/);
    var tbody = document.getElementById('license-t');
    var new_tbody = document.createElement('tbody');
    new_tbody.id = tbody.id;

    if (index == -1) {
        license_div.className = license_div.className.replace(class_regex, 'neutral-tabs');
        new_tbody = initial_import_table(new_tbody, false);
    } else {
        license_div.className = license_div.className.replace(class_regex, `l${index+1}-tabs`);
        new_tbody.classList.add(`l${index+1}-t`);
        // sort ghosts based on their track index
        GHOSTS_LICENSE[index][ghost_type].sort(function(a, b) {
            var keyA = a["track_index"],
                keyB = b["track_index"];
            if (keyA < keyB) return -1;
            if (keyA > keyB) return 1;
            return 0;
        });
        new_tbody = ghosts_to_table(new_tbody, GHOSTS_LICENSE[index][ghost_type], false);
    }

    tbody.parentNode.replaceChild(new_tbody, tbody);
}

function update_mini(highlight=null) {
    var minis = document.querySelectorAll('.mini');
    var id = 0;
    for (mini of minis) {
        mini.classList.remove('mini-border');
        mini.querySelector('svg').style.visibility = GHOSTS_LICENSE[id] == null ? 'visible' : 'hidden';
        id += 1;
    }
    if (highlight != null) {
        minis[highlight].classList.add('mini-border');   
    }
}

function update_chosen_license(license_index, ghost_type) {
    if (GHOSTS_LICENSE[license_index] != null) {
        CURRENT_LICENSE = license_index;
        update_license_table(license_index, ghost_type);
        update_mini(license_index);

        var download_count = document.querySelector('#download span');
        var nr_downloaded = GHOSTS_LICENSE[license_index]['download'].length;
        download_count.innerHTML = `${nr_downloaded}/32`;
        download_count.classList.remove('is-danger', 'is-info');
        if (nr_downloaded >= 32) {
            download_count.classList.add('is-danger');
        } else {
            download_count.classList.add('is-info');
        }
    }
}

function get_ghost_summary(rkg, index, address) {
    if ((rkg[12] & 0x08) == 0x08) { // if compressed remove potential ctgp data
        var dataview = new DataView(rkg.buffer);
        var rkg_length =  dataview.getInt32(0x88) + 0x90;
        rkg = rkg.slice(0x0, rkg_length);
    }

    // extract track information
    var track_id = rkg[0x7] >> 0x2;
    var track_index = TRACK_IDS[track_id][1];

    // extract misc information
    var controller = CONTROLLERS[rkg[0xB] & 0xF];
    var drift = (rkg[0xD] >> 0x1) & 0x1 ? "Automatic" : "Manual"; 
    var vehicle = VEHICLES[rkg[0x8] >> 0x2];
    var character = CHARACTERS[(rkg[0x8] & 0x3) << 0x4 | (rkg[0x9]) >> 0x4];

    // extract the time
    var min = rkg[0x4] >> 0x1;
    var sec = ((rkg[0x4] & 0x1) << 0x6) | (rkg[0x5] >> 0x2);
    var mil = ((rkg[0x5] & 0x3) << 0x8) | rkg[0x6];

    min = min.toString();
    sec = ("00" + sec.toString()).slice(-2);
    mil = ("000" + mil.toString()).slice(-3);

    // extract lap times
    var nr_laps = rkg[0x10];
    var lap_times = [];
    for (var i = 0; i < nr_laps; i++) {
        let min = rkg[0x11 + i * 0x3] >> 0x1;
        let sec = ((rkg[0x11 + i * 0x3] & 0x1) << 0x6) | (rkg[0x12 + i * 0x3] >> 0x2);
        let mil = ((rkg[0x12 + i * 0x3] & 0x3) << 0x8) | rkg[0x13 + i * 0x3];
        min = min.toString();
        sec = ("00" + sec.toString()).slice(-2);
        mil = ("000" + mil.toString()).slice(-3);
        lap_times.push(`${min}:${sec}.${mil}`);
    }

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
        "lap_times": lap_times,
        "mii_name": mii_name,
        "controller": controller,
        "drift": drift,
        "vehicle": vehicle,
        "character": character,
        "rkg": rkg,
        "index": index,
        "address": address
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
                var ghost_summary = get_ghost_summary(rkg, null, null);
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
    var file_name;
    if (typeof files == "FileList") {
        reader.readAsArrayBuffer(files[0]);
        file_name = files[0].name;
    } else {
        reader.readAsArrayBuffer(files);
        file_name = "rksys.dat";
    }
    reader.onload = function(){
        const arrayBuffer = this.result;
        RKSYS = new Uint8Array(arrayBuffer);   
        if (String.fromCharCode.apply(null, RKSYS.slice(0, 4)) == "RKSD") {
            file_name_obj.classList.remove("no-file");
            file_name_obj.textContent = file_name;

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
            const active_tab = document.querySelector('#license li.is-active');
            update_chosen_license(first_license, active_tab.id);
        } else {
            RKSYS = {};
            GHOSTS_LICENSE = [null, null, null, null];
            file_name_obj.classList.add("no-file");
            file_name_obj.textContent = "No file uploaded";
            update_license_table(-1, '', true);
            update_mini();
        }
    };
}

function save_ghost(license_index, address, ghost_type, index) {
    // 0x2FFC instead of 0x2800 since we recalculate the CRC anyway
    var rkg = RKSYS.slice(address, address + 0x27FC);
    if (String.fromCharCode.apply(null, rkg.slice(0, 4)) == "RKGD") {
        var ghost = get_ghost_summary(rkg, index, address);
        GHOSTS_LICENSE[license_index][ghost_type].push(ghost);
    } else if (ghost_type == 'download') {
        FREE_DOWNLOAD_SLOTS[license_index].push(index);
    }
}

function find_ghosts(license_index) {
    var license_ghosts_addr = 0x28000 + (0xA5000 * license_index);

    // go over every pb ghost in this license
    for (var i = 0; i < 32; i++) {
        var ghost_file_addr = i * 0x2800 + license_ghosts_addr;
        save_ghost(license_index, ghost_file_addr, 'pb', i);
    }
    // go over every downloaded ghost in this license
    for (var i = 0; i < 32; i++) {
        var ghost_file_addr = i * 0x2800 + license_ghosts_addr + 0x50000;
        save_ghost(license_index, ghost_file_addr, 'download', i);
    }
}

function delete_selected_ghosts(ghost_type) {
    var tbody = document.getElementById('license-t');
    for (var j = tbody.rows.length - 1; j >= 0; j--) {
        var row = tbody.rows[j];
        if (row.cells[3].childNodes[0].checked) { // if ghost is slecected for deletion
            if (ghost_type == 'download') {
                // since this slot is going to be freed up after deletion, add it to the free slots
                FREE_DOWNLOAD_SLOTS[CURRENT_LICENSE].push(GHOSTS_LICENSE[CURRENT_LICENSE][ghost_type][j]['index']);
            }
            GHOSTS_TO_BE_DELETED.push(GHOSTS_LICENSE[CURRENT_LICENSE][ghost_type][j]['address']);
            GHOSTS_LICENSE[CURRENT_LICENSE][ghost_type].splice(j, 1);
        }
    }
    update_chosen_license(CURRENT_LICENSE, ghost_type);
}

function import_ghosts(ghost_type) {
    if (ghost_type == 'download') {
        if (GHOSTS_LICENSE[CURRENT_LICENSE][ghost_type].length + GHOSTS_IMPORT.length <= 32) {
            GHOSTS_LICENSE[CURRENT_LICENSE][ghost_type].push(...GHOSTS_IMPORT);
        }
    } else {
        var track_id_ghosts = {};
        var i = 0;
        for (ghost of GHOSTS_LICENSE[CURRENT_LICENSE][ghost_type]) {
            track_id_ghosts[ghost['track_id']] = i;
            i++;
        }
        for (ghost of GHOSTS_IMPORT) {
            if (ghost['track_id'] in track_id_ghosts) {
                GHOSTS_LICENSE[CURRENT_LICENSE][ghost_type][track_id_ghosts[ghost['track_id']]] = ghost;
            } else {
                GHOSTS_LICENSE[CURRENT_LICENSE][ghost_type].push(ghost);
                track_id_ghosts[ghost['track_id']] = GHOSTS_LICENSE[CURRENT_LICENSE][ghost_type].length - 1;
            }
        }
    }
    update_chosen_license(CURRENT_LICENSE, ghost_type);
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

function prepare_rkg_for_import(rkg, index) {
    rkg = decompress_rkg(rkg);
    rkg[0xC] = 0x00; // decompression flag

    // set the correct ghost type
    var ghost_type;
    if (index == null) { // pb ghost
        rkg[0xD] = (rkg[0xD] & 0x03) | 0x04;
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
    var rkg_data = Array.from(rkg);
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
            for (addr of GHOSTS_TO_BE_DELETED) {
                for (var j = 0; j < 0x2800; j++) {
                    ghost_files[addr - 0x28000 + j] = 0x00;
                }
            }

            // import pb's
            for (ghost of GHOSTS_LICENSE[i]['pb']) {
                var track_nr = ghost['index'];
                // only import the ghosts that are newly imported
                if (track_nr == null) {
                    track_nr = TRACK_IDS[ghost["track_id"]][0];
                    var ghost_file_addr = track_nr * 0x2800 + license_ghosts_addr;
    
                    // write ghost to savefile
                    var rkg = prepare_rkg_for_import(ghost["rkg"], null);
                    for (var j = 0; j < 0x2800; j++) {
                        ghost_files[ghost_file_addr + j] = rkg[j];
                    }
                }
                // adjust pb flag
                var byte_nr = 3 - Math.floor(track_nr / 8);
                save_data[pb_fl_addr + byte_nr] = save_data[pb_fl_addr + byte_nr] | (1 << (track_nr % 8));
            }

            // import downloaded ghosts
            for (ghost of GHOSTS_LICENSE[i]['download']) {
                var ghost_index = ghost['index'];
                // only import the ghosts that are newly imported
                if (ghost_index == null) {
                    if (FREE_DOWNLOAD_SLOTS[i].length == 0) continue; // should never happen
                    ghost_index = FREE_DOWNLOAD_SLOTS[i][0];
                    FREE_DOWNLOAD_SLOTS[i].splice(0, 1);
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
    RKSYS = new Uint8Array(save_data.length + checksum_array.length + ghost_files.length);
    RKSYS.set(save_data);
    RKSYS.set(checksum_array, save_data.length);
    RKSYS.set(ghost_files, save_data.length + checksum_array.length);
    create_file_download(new Blob([RKSYS], { type: 'application/octet-stream' }), "rksys.dat");
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