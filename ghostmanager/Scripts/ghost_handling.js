//
// Manipulating global variables by extracting ghosts from savefile and moving them around
//

// GLOBAL VARIABLES

var DOWNLOADING_GHOSTS = false;
var RKSYS = []; // the entire rksys.dat file
var GHOSTS_IMPORT = []; // all uploaded ghosts waiting to be imported
var GHOSTS_LICENSE = [null, null, null, null]; // all ghosts for eacht of the 4 licenses
var CURRENT_LICENSE = -1; // the index of the currently selected license
var GHOSTS_TO_BE_DELETED = [[], [], [], []]; // the addresses of ghosts that should be deleted
var FREE_DOWNLOAD_SLOTS = [[], [], [], []]; // the addresses of the available download ghost slots for each license

// FUNCTIONS

function get_ghost_summary(rkg, index, address, ghost_type) {
    if ((rkg[12] & 0x08) == 0x08) { // if compressed remove potential ctgp data
        var dataview = new DataView(rkg.buffer);
        var rkg_length =  dataview.getInt32(0x88) + 0x90;
        rkg = rkg.slice(0x0, rkg_length);
    }

    // extract track information
    var track_id = rkg[0x7] >> 0x2;
    var track_index = TRACK_IDS[track_id][1];

    // extract misc information
    var controller = rkg[0xB] & 0xF;
    var drift = (rkg[0xD] >> 0x1) & 0x1; 
    var vehicle = rkg[0x8] >> 0x2;
    var character = (rkg[0x8] & 0x3) << 0x4 | (rkg[0x9]) >> 0x4;

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
        "address": address,
        "type": ghost_type
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
                var ghost_summary = get_ghost_summary(rkg, null, null, 'import');
                GHOSTS_IMPORT.push(ghost_summary);
            }

            current_file++;
            if (current_file == files.length) {
                update_import_table();
            }
        }
    }
}

function read_rksys_file(file_name_obj, files, blank_rksys=false) {
    const reader = new FileReader();
    var file_name;
    if (!blank_rksys) {
        reader.readAsArrayBuffer(files[0]);
        file_name = files[0].name;
    } else {
        reader.readAsArrayBuffer(files);
        file_name = "rksys.dat";
    }
    reader.onload = function(){
        const arrayBuffer = this.result;
        if (!blank_rksys) {
            RKSYS = new Uint8Array(arrayBuffer);
        } else {
            // only the first 0x28000 bytes of the blank rksys.dat file are given, the rest is filled 
            // in here since it's all just zeros from that point on
            RKSYS = new Uint8Array(0x2BC000);
            RKSYS.set(new Uint8Array(arrayBuffer));
            RKSYS.set(new Uint8Array(0x294000), 0x28000);
        }
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
            RKSYS = [];
            GHOSTS_LICENSE = [null, null, null, null];
            file_name_obj.classList.add("no-file");
            file_name_obj.textContent = "No file uploaded";
            update_license_table(-1, '', true);
            update_mini();
        }
    };
}

function store_ghost(license_index, address, ghost_type, index) {
    // 0x2FFC instead of 0x2800 since we recalculate the CRC anyway
    var rkg = RKSYS.slice(address, address + 0x27FC);
    if (String.fromCharCode.apply(null, rkg.slice(0, 4)) == "RKGD") {
        var ghost = get_ghost_summary(rkg, index, address, ghost_type);
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
        store_ghost(license_index, ghost_file_addr, 'pb', i);
    }
    // go over every downloaded ghost in this license
    for (var i = 0; i < 32; i++) {
        var ghost_file_addr = i * 0x2800 + license_ghosts_addr + 0x50000;
        store_ghost(license_index, ghost_file_addr, 'download', i);
    }
}

function delete_selected_ghosts(ghost_type) {
    var tbody = document.getElementById('license-t');
    for (var j = tbody.rows.length - 1; j >= 0; j--) {
        var row = tbody.rows[j];
        if (row.cells[3].childNodes[0].checked) { // if ghost is slecected for deletion
            if (GHOSTS_LICENSE[CURRENT_LICENSE][ghost_type][j]['type'] != 'import') { // if the ghost was not an imported ghost
                if (ghost_type == 'download') {
                    // since this slot is going to be freed up after deletion, add it to the free slots
                    FREE_DOWNLOAD_SLOTS[CURRENT_LICENSE].push(GHOSTS_LICENSE[CURRENT_LICENSE][ghost_type][j]['index']);
                }
                GHOSTS_TO_BE_DELETED[CURRENT_LICENSE].push(GHOSTS_LICENSE[CURRENT_LICENSE][ghost_type][j]);
            }
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