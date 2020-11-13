// GLOBALS

var MII_DATA = [DEFAULT_MII.slice(), DEFAULT_MII.slice(), DEFAULT_MII.slice(), DEFAULT_MII.slice(), DEFAULT_MII.slice(),
    DEFAULT_MII.slice(), DEFAULT_MII.slice(), DEFAULT_MII.slice(), DEFAULT_MII.slice(), DEFAULT_MII.slice()];

var ISO_REG = "PAL";
var GLOBE_REG = "ww";
var GLOBE_POS = "2427031B";
var HIGHLIGHT = {"index": -1, "base_colour": ""};

function get_country_value(key, value) {
    // key: index of the key
    // value: value to look for
    for (country of COUNTRIES) {
        if (country[key] == value) return country;
    }
    return ["NO FLAG", 0xFF, "2427031B", ""];
}

function get_country_names() {
    var country_names = [];
    for (country of COUNTRIES) {
        if (country != COUNTRIES[0][0]) country_names.push(country[0]);
    }
    return country_names;
}

//////////////////////////////////////////////
// CODE GENERATION FUNCTIONS
//////////////////////////////////////////////

var code;

// main function that generates the code
function generate_code(){
    code = [];
    crc16_bypass_code();
    globe_position_code();
    highlight_code();
    custom_title_code();

    // don't do anything if nothing was filled in
    var code_text = "Nothing filled in!";
    var result = top_10_code();
    if (typeof result == "string") {
        code_text = result;
    } else if (result) {
        // format the code
        for (var i=0; i<code.length; i++) {
            code[i] += i%2 == 0 ? " " : "\n";
        }
        code_text = code.join("").slice(0, -1).toUpperCase();
    }
    document.getElementById("result").value = code_text;
}

function crc16_bypass_code() {
    code = code.concat([ISO_CODES[ISO_REG][4], "48000010"]);
}

function globe_position_code() {
    if (GLOBE_REG != "ww") {
        code = code.concat([ISO_CODES[ISO_REG][0], "00004303",
                        ISO_CODES[ISO_REG][1], GLOBE_POS]);
    }
}

function custom_title_code() {
    title_code = [ISO_CODES[ISO_REG][2], "XXXXXXXX",
                    "7D6802A6", "YYYYYYYY"];

    var hex_title = "";
    if (document.getElementById("track-include").checked) {
        // this is string that will be replaced by the track name
        hex_title += "001A0802001100000020";
    }
    hex_title += utf_16_hex(document.getElementById("rankings-title").value);
    data_length = Math.ceil(hex_title.length / 8);
    for (var i = 0; i < data_length; i++) {
        var string_index = i * 8;
        var string_part = hex_title.slice(string_index, string_index + 8);
        if (string_part.length != 8) string_part = (string_part + "0".repeat(8)).slice(0, 8);
        title_code.push(string_part);
    }
    if (title_code.slice(-1).slice(4,8) != "0000") {
        title_code.push("00000000");
        data_length += 1;
    }

    title_code = title_code.concat(["2C0E1776", "4082000C",
                                    "7C6802A6", "90610020",
                                    "7EA3AB78", "7D6803A6"])
    
    if (title_code.length % 2 == 0) title_code.push("60000000");
    title_code.push("00000000");
    title_code[1] = pad(title_code.length / 2 - 1, 8);
    title_code[3] = "48" + pad((data_length + 1) * 4 + 1, 6);
    code = code.concat(title_code);
}

function highlight_code() {
    if (HIGHLIGHT["index"] != -1) {
        var highlight_pos = pad(HIGHLIGHT["index"] + 1, 1, 16);
        var highlight_code = [ISO_CODES[ISO_REG][5], "00000005",
                                "386300A8", `2C1C000${highlight_pos}`,
                                "40A2001C", "A183003C",
                                "2C0C7031", "40A20010",
                                "80830010", "8164FF68",
                                "91640008", "00000000"];
        code = code.concat(highlight_code);
    }
}

function top_10_code() {
    var total_entries = get_entry_count();
    if (total_entries == 0) return false;
    var entries = "398000" + pad(total_entries, 2);
    var branch = "48" + pad(0x05 + total_entries * 0x38, 6);
    
    var top_10_code = [ISO_CODES[ISO_REG][3], null,
                        "BE41FFC8", "38800000",
                        "39800001", "91830058", 
                        entries   , "91830060",
                        "7D8903A6", "39630068", 
                        branch];
                                                
    for(var i = 0; i < total_entries; i++) {
        // get all data from the form
        const index = i.toString();
        var name = document.getElementById(`name_${index}`).value;
        var time = document.getElementById(`time_${index}`).value;
        var country = get_country_value(0, document.getElementById(`country_${index}`).value)[1];
        var wheel = document.getElementById(`wheel_${index}`).checked;

        var result = extract_time_values(time);
        if (!result) return `entry ${i+ 1} has the wrong time format`
        var [minutes, seconds, milliseconds] = result;

        // convert to hex strings
        minutes = pad(minutes, 2);
        seconds = pad(seconds, 2);
        milliseconds = pad(milliseconds, 4);
        console.log([minutes, seconds, milliseconds])
        country = pad(country, 2);
        wheel = pad(wheel ? 0 : 1, 2);
        
        // insert the time
        top_10_code.push([milliseconds + minutes + seconds]);
        
        // insert mii name
        replace_mii_name(i, name);

        var bytes = "";
        // add all the mii data
        for (var j = 0; j < MII_DATA[i].length - 2; j += 4) {
            for (k = 0; k < 4; k++) {
                bytes += pad(MII_DATA[i][j + k], 2);
            }
            top_10_code.push(bytes);
            bytes = "";
        }

        // insert remaining variables
        bytes = pad(MII_DATA[i][MII_DATA[i].length - 2], 2) + pad(MII_DATA[i][MII_DATA[i].length - 1], 2) + country + wheel;
        top_10_code.push(bytes);
    }
    
    top_10_code = top_10_code.concat(["7D8802A6",
                                        "BA4C0000", "B24B0001",
                                        "924B0004", "BE6B0008",
                                        "BF4B0028", "9BEB0057",
                                        "B3EB0060", "398C0038",
                                        "396B0068", "4200FFDC",
                                        "7C0803A6", "BA41FFC8",])

    if (top_10_code.length % 2 == 0) top_10_code.push("60000000");
    top_10_code.push("00000000");
    top_10_code[1] = pad((top_10_code.length / 2) - 1, 8); // set code length
    code = code.concat(top_10_code);
    return true;
}

function pad(value, length, base=16) {
    return ("0".repeat(length) + value.toString(base)).slice(-length);
}

function utf_16_hex(string) {
    var hex_string = "";
    for (var i = 0; i < string.length; i++) {
        hex_string += pad(string.charCodeAt(i), 4);
    }
    return hex_string;
}

function extract_time_values(time) {
    // match m:s.ms time pattern
    if (!(/^([0-9]*\:[0-9]*\.[0-9]*)$/.test(time))) return false;
    var min, sec, mil;
    var first_split = time.split(':');
    min = first_split[0];
    var second_split = first_split[1].split('.');
    sec = second_split[0];
    mil = second_split[1];

    min = parseInt(pad(min, 1, 10));
    sec = parseInt(pad(sec, 2, 10));
    mil = parseInt(pad(mil, 3, 10));

    // cap seconds field at 59 seconds
    sec = sec > 59 ? 59 : sec;

    return [min, sec, mil];
}

function replace_mii_name(mii_index, mii_name) {
    var mii = MII_DATA[mii_index];
    var hex_string = utf_16_hex(mii_name);
    // pad so it fills 10 characters
    hex_string = hex_string + "0000".repeat(10).slice(0, 40);

    for (var i = 0; i < 10; i++) {
        var string_index = i*4;
        mii[2 + 2*i] = parseInt(hex_string.slice(string_index, string_index + 2), 16);
        mii[3 + 2*i] = parseInt(hex_string.slice(string_index + 2, string_index + 4), 16);
    }
}

function get_entry_count() {
    // figure out how many times were actually entered
    for(var i=9; i>=0; i--) {
        var name = document.getElementById(`name_${i}`).value;
        var time = document.getElementById(`time_${i}`).value
        var result = extract_time_values(time);
        if (result) {
            var [minutes, seconds, milliseconds] = result;
            if (name == "Player" && minutes == 0 && seconds == 0 && milliseconds == 0) continue;
        }
        return i + 1;
    }
    return 0;
}