function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+ d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/" + "; SameSite=Strict";
}

function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for(var i = 0; i <ca.length; i++) {
      var c = ca[i];
      while (c.charAt(0) == ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
      }
    }
    return "";
  }

document.addEventListener("DOMContentLoaded", function() {

    // fetch iso cookie and set the right tab
    var iso_cookie = getCookie("iso_region");
    if (iso_cookie != "") {
        document.querySelectorAll('#tabs li').forEach(function(tabObject) {tabObject.classList.remove('is-active');})
        document.querySelector(`#${iso_cookie}_tab`).classList.add('is-active');
        ISO_REG = iso_cookie;
    }

    const tabSelector = document.querySelectorAll('#tabs li');
    tabSelector.forEach(function(tabObject) {
        tabObject.onclick = () => {
            var tab = tabObject.dataset.tab;
        
            tabSelector.forEach(function(tabObject2) {tabObject2.classList.remove('is-active');})
            tabObject.classList.add('is-active');
            ISO_REG = tabObject.querySelector("span").innerHTML;
            setCookie("iso_region", ISO_REG, 1000); // cookie expires after 1000 days
        }
    });

    // initialise table
    const main_table = document.querySelector('#main-table tbody');
    const template_row = main_table.rows[0];
    main_table.deleteRow(0);

    for (var i = 0; i < 10; i++) {
        var new_row = main_table.insertRow(i);
        new_row.innerHTML = template_row.innerHTML;
        new_row.cells[0].innerHTML = i + 1;
        new_row.cells[0].setAttribute("id", `pos_${i}`);
        new_row.cells[1].querySelector("img").setAttribute("id", `flag_${i}`);
        new_row.cells[1].querySelector("img").style.visibility = "hidden";
        new_row.cells[1].querySelector("select").setAttribute("id", `country_${i}`);
        new_row.cells[2].querySelector("input").setAttribute("id", `name_${i}`);
        new_row.cells[3].querySelector("input").setAttribute("id", `time_${i}`);
        new_row.cells[4].querySelector("input").setAttribute("id", `wheel_${i}`);
        new_row.cells[5].querySelector("label").setAttribute("id", `rkg_label_${i}`);
        new_row.cells[5].querySelector("input").setAttribute("id", `rkg_input_${i}`);
    }

    // get country options ready
    var options = `<option value="${COUNTRIES[0][0]}">${COUNTRIES[0][0]}</option>`;
    for (loc of get_country_names().sort()) {
        options += `<option value="${loc}">${loc}</option>`;
    }

    const country_selectors = document.querySelectorAll(".country-select");
    country_selectors.forEach(function(selector) {
        selector.innerHTML = options;

        selector.onchange = () => {
            var id = selector.id.split('_')[1];
            set_flag(id, selector.value);
        };
    })

    const region_selector = document.querySelector('#region-selector');
    region_selector.onchange = () => {
        var selected_value = region_selector.value;
        var locs;
        if (selected_value == "Worldwide") {
            locs = ['Worldwide'];
        } else if (selected_value == "Regional") {
            locs = ["Europe", "North America", "Americas", "Latin America", "Asia", "Oceania"];
        } else {
            locs = get_country_names().sort();
        }
        var options = '';
        for (loc of locs) {
            options += `<option value="${loc}">${loc}</option>`;
        }
        const location_selector = document.getElementById("location-selector");
        location_selector.innerHTML = options;
        location_selector.onchange();
    };

    const location_selector = document.querySelector('#location-selector');
    location_selector.onchange = () => {
        const value = location_selector.value;
        const globe_positions = {
            "ww": {"Worldwide": "Belgium"},
            "reg": {
                "Europe": "Germany",
                "North America": "USA",
                "Americas": "Mexico",
                "Latin America": "Paraguay",
                "Asia": "Hong Kong",
                "Oceania": "Australia"
                },
        }
        if (GLOBE_REG == "cntr") {
            GLOBE_POS = get_country_value(0, value)[2];
            if (GLOBE_POS == "") GLOBE_POS = "2427031B"; // set default globe position
        } else {
            GLOBE_POS = get_country_value(0, globe_positions[GLOBE_REG][value])[2];
        }
        document.getElementById('rankings-title').value = value + " Top 10";
    };

    // update location selector
    region_selector.onchange();

    const start_butt = document.getElementById("start-butt");
    start_butt.addEventListener('click', function() {
        generate_code();
    });

    const copy_butt = document.getElementById("copy-butt");
    copy_butt.addEventListener('click', function() {
        // copy the generated code to the clipboard
        const copy_text = document.getElementById("result");
        copy_text.select();
        copy_text.setSelectionRange(0, 99999); /*For mobile devices*/
        document.execCommand("copy");
    });

    const position_tds = document.querySelectorAll(".position");
    position_tds.forEach(function(element) {
        element.addEventListener('click', function() {
            var index = parseInt(element.id.split('_')[1]);
            var rows = document.querySelector("#main-table tbody").rows;
            if (HIGHLIGHT["index"] != -1) { // remove highlight
                var rows = document.querySelector("#main-table tbody").rows;
                rows[HIGHLIGHT["index"]].style.backgroundColor = HIGHLIGHT["base_colour"];
            }
            if (index != HIGHLIGHT["index"]) { // check if clicked on a different row
                HIGHLIGHT["index"] = index;
                HIGHLIGHT["base_colour"] = rows[index].style.backgroundColor;
                rows[index].style.backgroundColor = "#ffd000";
            } else {
                HIGHLIGHT["index"] = -1;
            }
        });
        
    });

    const rkgFileInputs = document.querySelectorAll('.rkg-input input[type=file]');
    rkgFileInputs.forEach(function(element) {
        element.onchange = () => {
            
            if (element.files.length > 0) {
                var start_pos = parseInt(element.id.split('_')[2]);
                var file_names = Array.from(element.files).map(x => x["name"].split('.').pop());
                var miigx_index = file_names.indexOf('miigx');
                if (miigx_index == -1) {
                    handle_rkg_files(element.files, start_pos);
                } else {
                    handle_miigx_file(element.files[miigx_index], start_pos);
                }
                
            }
        };
    })

    const time_inputs = document.querySelectorAll('.time-field');
    time_inputs.forEach(function(element) {
        element.onblur = () => {
            var result = extract_time_values(element.value);
            if (result) {
                element.classList.remove("is-danger");
                console.log(result);
                element.value = `${pad(result[0], 10)}:${pad(result[1], 10)}.${pad(result[2], 10)}`;
            } else {
                element.classList.add("is-danger");
            }
        }
    })
});

function set_flag(index, country) {
    var img = document.getElementById(`flag_${index}`);
    var country_code = get_country_value(0, country)[3];
    var visibility;
    if (country_code == "") {
        country_code = "BE";
        visibility = "hidden";
    } else {
        visibility = "visible";
    }
    // change the visibility after setting the source otherwise you'll see the belgian flag flash for a moment
    // doesn't matter still happens B-)
    img.src = `https://www.countryflags.io/${country_code.toLowerCase()}/flat/32.png`;
    img.style.visibility = visibility;
} 

function handle_miigx_file(file, start_pos) {
    // .miigx file is pure mii data of length 0x4A
    const reader = new FileReader();
    reader.readAsArrayBuffer(file);
    reader.onload = function(){
        const arrayBuffer = this.result;
        const array = new Uint8Array(arrayBuffer);
        if (array.length == 0x4A) {
            var mii_data = new Uint8Array([...array.slice(0, 28), ...array.slice(32, 54)]);
            // extract the mii name
            var mii_name = "";
            for (var i = 2; i < 22; i += 2) {
                var char_code = (mii_data[i] << 8) | mii_data[i+1];
                if (char_code == 0) break;
                mii_name += String.fromCharCode(char_code);
            }
            document.getElementById(`name_${start_pos}`).value = mii_name;
            document.querySelector(`#rkg_label_${start_pos} .file-label`).innerHTML = file['name'];
            MII_DATA[start_pos] = mii_data;
        }
    }
}

function handle_rkg_files(files, start_pos) {
    var all_entries = [];
    var cur_entry = 0;
    
    for (file of files) { 
        const reader = new FileReader();
        reader.readAsArrayBuffer(file);
        reader.onload = function(){
            const arrayBuffer = this.result;
            const array = new Uint8Array(arrayBuffer);
            var entry_data = handle_rkg_file(array);
            entry_data["file_name"] = files[cur_entry]["name"];
            all_entries.push(entry_data);
            if (cur_entry == files.length - 1) {
                // sort entries on finish time
                all_entries.sort(function(a, b) {
                    var keyA = a["total_time"],
                        keyB = b["total_time"];
                    if (keyA < keyB) return -1;
                    if (keyA > keyB) return 1;
                    return 0;
                });
                set_new_entries(start_pos, all_entries);
            }
            cur_entry++;
        };
    }
}

function handle_rkg_file(byte_array) {
    var time_1 = byte_array[4];
    var time_2 = byte_array[5];
    var time_3 = byte_array[6];
    var controller = byte_array[11];
    var country = byte_array[52];
    var mii_data_full = byte_array.slice(60, 134);
    var mii_data = new Uint8Array([...mii_data_full.slice(0, 28), ...mii_data_full.slice(32, 54)]); //js is so wack, wtf are these dots

    // extract the time
    var min = time_1 >> 0x1;
    var sec = ((time_1 & 0x1) << 0x6) | (time_2 >> 0x2);
    var mil = ((time_2 & 0x3) << 0x8) | time_3;
    // extract the mii name
    var mii_name = "";
    for (var i = 2; i < 22; i += 2) {
        var char_code = (mii_data[i] << 8) | mii_data[i+1];
        if (char_code == 0) break;
        mii_name += String.fromCharCode(char_code);
    }

    var entry_data = {
        "total_time": min * 60000 + sec * 1000 + mil,
        "min": min,
        "sec": sec,
        "mil": mil,
        "wheel": (controller & 0xf) == 0,
        "country": country,
        "mii_name": mii_name,
        "mii_data": mii_data
    };
    return entry_data;
}

function set_new_entries(start_pos, entries) {
    for (var i = 0; i < entries.length; i++) {
        var current_pos = start_pos + i;
        if (current_pos >= 10) break;
        var current_entry = entries[i];
        var country_data = get_country_value(1, current_entry["country"]);
        document.getElementById(`country_${current_pos}`).value = country_data[0];
        document.getElementById(`name_${current_pos}`).value = current_entry["mii_name"];
        document.getElementById(`time_${current_pos}`).value = `${current_entry["min"]}:${pad(current_entry["sec"], 2, 10)}.${pad(current_entry["mil"], 3, 10)}`;
        document.getElementById(`time_${current_pos}`).classList.remove("is-danger");
        document.getElementById(`wheel_${current_pos}`).checked = current_entry["wheel"];
        document.querySelector(`#rkg_label_${current_pos} .file-label`).innerHTML = current_entry["file_name"];
        MII_DATA[current_pos] = current_entry["mii_data"];

        // set flag
        set_flag(current_pos, country_data[0]);
    }
}