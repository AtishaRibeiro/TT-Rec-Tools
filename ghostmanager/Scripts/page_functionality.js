//
// Manipulating of front end
//

function set_export_feedback(turn_on) {
    var button = document.getElementById('export-button');
    if (turn_on) {
        DOWNLOADING_GHOSTS = true;
        button.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i><p id="export_progress"></p>';
        button.disabled = true;
    } else {
        DOWNLOADING_GHOSTS = false; 
        button.innerHTML = '<i class="fas fa-file-export"></i> &nbsp; Export';
        button.disabled = false;
    }
}

function update_progress(completed, total) {
    var progress_text = document.getElementById('export_progress');
    progress_text.innerHTML = `&nbsp; ${completed} / ${total}`;
}

var create_ghost_tooltip = function (ghost) {
    return function (event) {
        var tr = event.target;
        var tooltip = document.createElement("div");
        tooltip.className = "box is-fullwidth tooltip columns is-gapless neutral";
        var tr_rect = tr.getBoundingClientRect();
        tooltip.style.left = (tr_rect.left +  80) + "px";
        tooltip.style.top = (tr_rect.bottom + 10) + "px";
        tooltip.style.width = (tr_rect.right - tr_rect.left) / 1.5 + "px";
        
        var l_col = document.createElement("ul");
        l_col.className = "column";
        var header = document.createElement("li");
        header.style.textDecoration = 'underline';
        header.innerHTML = ghost['time'];
        l_col.appendChild(header);
        for (var i = 0; i < ghost["lap_times"].length; i++) {
            var lap_div = document.createElement("li");
            lap_div.innerHTML = `<span class="has-text-weight-bold">Lap ${i+1}:</span> ${ghost["lap_times"][i]}`;
            l_col.appendChild(lap_div);
        }

        var m_col = document.createElement("ul");
        m_col.className = "column mid-col is-0";
        m_col.style.borderRight = '#DDDDDD solid 1px';

        var r_col = document.createElement("ul");
        r_col.className = "column";
        r_col.innerHTML = `<li>${CHARACTERS[ghost["character"]]}</li>
        <li>${VEHICLES[ghost["vehicle"]]}</li>
        <li>${CONTROLLERS[ghost["controller"]]}</li>
        <li>${ghost["drift"] ? "Automatic" : "Manual"}</li>`

        tooltip.appendChild(l_col);
        tooltip.appendChild(m_col);
        tooltip.appendChild(r_col);
        tr.parentNode.appendChild(tooltip);
        
        setTimeout(function() {
            try {
                tr.parentNode.querySelector(".tooltip").classList.add("fade");
            } catch (err) {
                // nothing :-)
                // this causes an error very often but it isn't a problem
            }
            
        }, 100);
    }
}

function destroy_ghost_tooltip(event) {
    var tooltips = event.target.parentNode.querySelectorAll('.tooltip');
    tooltips.forEach(function(tooltip) {
        event.target.parentNode.removeChild(tooltip);
    })
}

var remove_import_ghost = function (event) {
    GHOSTS_IMPORT.splice(parseInt(event.currentTarget.parentNode.id.split('-')[1]), 1);
    update_import_table(initial=(GHOSTS_IMPORT.length == 0));
}

var get_blank_rksys = function () {
    var xhr = new XMLHttpRequest();
    xhr.responseType = 'arraybuffer';
    xhr.overrideMimeType(Blob);
    xhr.open('GET', 'rksys.dat', true);
    xhr.onreadystatechange= function() {
        if (this.readyState!==4) return;
        if (this.status!==200) return;
        const fileName = document.querySelector('#rksys .file-name');
        read_rksys_file(fileName, new Blob([this.response]), true);
    };
    xhr.send();
}

function ghosts_to_table(tbody, ghosts, ghost_import) {
    var row_index = 0;
    for (var ghost of ghosts) {
        var row_ref = tbody.insertRow();
        row_ref.id = `${ghost_import ? 'import' : 'license'}-${row_index}`;
        row_ref.addEventListener("mouseenter", create_ghost_tooltip(ghost));
        row_ref.addEventListener("mouseleave", destroy_ghost_tooltip);
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

function initial_table(tbody, ghost_import) {
    var row_ref = tbody.insertRow();
    row_ref.class = "is-centered";
    var new_cell = row_ref.insertCell(0);
    new_cell.style.width = "0%";
    new_cell = row_ref.insertCell(1);
    new_cell.style.width = "100%";
    new_cell.classList.add("is-size-5", "has-text-weight-bold");

    if (ghost_import) {
        row_ref.style.paddingTop = "10em";
        var clone_icon = document.createElement('I');
        clone_icon.className = 'far fa-clone fa-4x';
        new_cell.appendChild(clone_icon);
        var text = document.createElement('div');
        text.innerHTML = "Drop ghost files here";
        //text.classList.add("is-size-5", "has-text-weight-bold");
        new_cell.appendChild(text);
    } else {
        row_ref.style.paddingTop = "8em";
        var clone_icon = document.createElement('I');
        clone_icon.className = 'far fa-clone fa-4x';
        new_cell.appendChild(clone_icon);
        var div = document.createElement('div');
        div.innerHTML = "Drop rksys.dat here"
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
        new_tbody = initial_table(new_tbody, true);
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
        new_tbody = initial_table(new_tbody, false);
        var download_count = document.querySelector('#download span');
        download_count.innerHTML = '0/32';
        download_count.classList.remove('is-danger');
        download_count.classList.add('is-info');
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
        // if there is not enough downloaded ghosts slots left vs the to be imported ghosts
        if (ghost_type == 'download' && GHOSTS_IMPORT.length > 32 - GHOSTS_LICENSE[index]['download'].length) {
            document.getElementById('import-button').classList.add('warning');
        } else {
            document.getElementById('import-button').classList.remove('warning');
        }
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