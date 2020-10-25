var ISO_CODES = {
    "PAL": "C25CDDC8",
    "NTSC-U": "C25C12A8",
    "NTSC-J": "C25CD6A4",
    "NTSC-K": "C25BBD88"
}

function generate_code() {
    var rows = document.getElementById('msg_table').rows;
    var code;
    if (rows.length == 1) {
        code = generate_single_code();
    } else{
        code = generate_mul_code(rows);
    }

    place_code(code)
}

function generate_single_code() {
    code = [ISO_CODES[ISO_REG], "XXXXXXXX",
    "7D6802A6", "YYYYYYYY"];

    var hex_string = "";
    const [ret, error] = utf_16_hex(document.getElementById(`msg_input_0`).value);
    if (ret == null) return `Wrong format for ${error}`;
    hex_string += ret;
    data_length = Math.ceil(hex_string.length / 8);
    for (var i = 0; i < data_length; i++) {
        var string_index = i * 8;
        var string_part = hex_string.slice(string_index, string_index + 8);
        if (string_part.length != 8) string_part = (string_part + "0".repeat(8)).slice(0, 8);
        code.push(string_part);
    }
    if (code[code.length - 1].slice(4) != "0000") {
        code.push("00000000");
        data_length += 1;
    }

    var msg_id = get_msd_id(0);
    if (msg_id == null) return "No ID filled in!";
    code = code.concat([`2C0E${msg_id}`, "40820008",
                        "7C6802A6", "90610020",
                        "7D6803A6"])

    if (code.length % 2 == 0) code.push("60000000");
    code.push("00000000");
    code[1] = pad(code.length / 2 - 1, 8);
    code[3] = "48" + pad((data_length + 1) * 4 + 1, 6);

    return code;
}

function generate_mul_code(rows) {
    code = [ISO_CODES[ISO_REG], "XXXXXXXX",
    "7D6802A6", "YYYYYYYY"];

    // insert all the strings
    var string_lengths = [];
    var data_length = 0;
    var null_terminated = true;
    for (var i = 0; i < rows.length; i++) {
        var hex_string = null_terminated ? "" : "0000";
        null_terminated = false;
        const [ret, error] = utf_16_hex(document.getElementById(`msg_input_${i}`).value);
        if (ret == null) return `Wrong format for ${error}`;
        hex_string += ret;
        string_lengths.push(hex_string.length + 4);
        var curr_data_length = Math.ceil(hex_string.length / 8);
        data_length += curr_data_length;

        for (var j = 0; j < curr_data_length; j++) {
            var string_index = j * 8;
            var string_part = hex_string.slice(string_index, string_index + 8);
            if (string_part.length != 8) {
                string_part = (string_part + "0".repeat(8)).slice(0, 8);
                null_terminated = true;
            }
            code.push(string_part);
        }
    }

    if (code[code.length - 1].slice(4) != "0000") {
        code.push("00000000");
        data_length += 1;
    }

    code[3] = "48" + pad((data_length + 1) * 4 + 1, 6);

    // actual code after the strings
    code.push("7D8802A6");
    for (var i = 0; i < rows.length; i++) {
        var msg_id = get_msd_id(i);
        if (msg_id == null) return "No ID filled in!";
        var string_offset = string_lengths.slice(0, i).reduce((a, b) => a + b, 0) / 2;
        code = code.concat([`2C0E${msg_id}`, "40820008", `386C${pad(string_offset, 4)}`]);
    }

    code = code.concat(["90610020", "7D6803A6"]);

    if (code.length % 2 == 0) code.push("60000000");
    code.push("00000000");
    code[1] = pad(code.length / 2 - 1, 8);

    return code;
}

function is_hexadecimal(hex_string) {
    // check if hexadecimal
    return /^[0-9A-F]*$/i.test(hex_string);
}

function get_msd_id(index) {
    var id = document.getElementById(`id_input_${index}`).value;
    // check if hexadecimal
    if (!is_hexadecimal(id)) return null;
    return pad(id, 4);
}

function pad(value, length, base=16) {
    return ("0".repeat(length) + value.toString(base)).slice(-length);
}

var REPLACE_VARS = {
    "${PLAYER}": "001A06020000",
    "${WHITE}": "001A080000010002",
    "${GREY}": "001A080000010000",
    "${TRANSP}": "001A080000010008",
    "${RED1}": "001A080000010040",
    "${RED2}": "001A080000010020",
    "${RED3}": "001A080000010032",
    "${YELLOW1}": "001A080000010030",
    "${YELLOW2}": "001A080000010011",
    "${YELLOW3}": "001A080000010012",
    "${ORANGE1}": "001A080000010013",
    "${ORANGE2}": "001A080000010014",
    "${ORANGE3}": "001A080000010015",
    "${ORANGE4}": "001A080000010016",
    "${BLUE1}": "001A080000010021",
    "${BLUE2}": "001A080000010031",
    "${GREEN}": "001A080000010033"
}

function utf_16_hex(string) {
    var hex_string = "";
    string = string.replaceAll('\\n', '\n');

    // handle H{} (literal hex)
    const hex_regex = /H\{.*?\}/g;
    var hex_dict = {};
    let match;
    while ((match = hex_regex.exec(string)) != null) {
        hex_dict[match.index] = match[0];
    }
    // handle ${} (variables)
    const var_regex = /\$\{.*?\}/g;
    var var_dict = {};
    while ((match = var_regex.exec(string)) != null) {
        var_dict[match.index] = match[0];
    }
    // handle U{} (unicode)
    const unicode_regex = /U\{.*?\}/g;
    var unicode_dict = {};
    while ((match = unicode_regex.exec(string)) != null) {
        unicode_dict[match.index] = match[0];
    }
    // handle F{} (font size)
    const font_regex = /F\{.*?\}/g;
    var font_dict = {};
    while ((match = font_regex.exec(string)) != null) {
        font_dict[match.index] = match[0];
    }

    for (var i = 0; i < string.length; i++) {
        if (i in hex_dict) {
            var contents = hex_dict[i].slice(2, -1);
            if (!is_hexadecimal(contents)) return [null, hex_dict[i]];
            hex_string += contents;
            i += hex_dict[i].length - 1;
        } else if (i in var_dict) {
            if (!(var_dict[i].toUpperCase() in REPLACE_VARS)) return [null, var_dict[i]]
            hex_string += REPLACE_VARS[var_dict[i].toUpperCase()];
            i += var_dict[i].length - 1;
        } else if(i in unicode_dict) {
            var contents = unicode_dict[i].slice(2, -1);
            if (!is_hexadecimal(contents)) return [null, unicode_dict[i]];
            hex_string += "001A0801" + pad(contents, 8);
            i += unicode_dict[i].length - 1;
        } else if(i in font_dict){
            var contents = parseInt(font_dict[i].slice(2, -1)).toString(16);
            if (!is_hexadecimal(contents)) return [null, font_dict[i]];
            hex_string += "001A0800000000" + pad(contents, 2);
            i += font_dict[i].length - 1;
        } else {
            hex_string += pad(string.charCodeAt(i), 4);
        }
    }
    return [hex_string, null];
}

function place_code(code) {
    var code_text;
    if (typeof code == "string") {
        code_text = code;
    } else {
        // format the code
        for (var i=0; i<code.length; i++) {
            code[i] += i%2 == 0 ? " " : "\n";
        }
        code_text = code.join("").slice(0, -1).toUpperCase();
    }
    document.getElementById("result").value = code_text;
}