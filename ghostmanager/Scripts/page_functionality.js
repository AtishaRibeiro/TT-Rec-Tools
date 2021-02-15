// all things that need to happen on load

document.addEventListener("DOMContentLoaded", function() {

    update_import_table(true);
    update_license_table(-1, '', true);

    const tabSelector = document.querySelectorAll('.tabs li');
    tabSelector.forEach(function(tabObject) {
        tabObject.onclick = () => {
            if (!DOWNLOADING_GHOSTS) { // don't allow tab switching when ghosts are being downloaded
                tabSelector.forEach(function(tabObject2) {tabObject2.classList.remove('is-active');})
                tabObject.classList.add('is-active');
                update_chosen_license(CURRENT_LICENSE, tabObject.id);
            }
        }
    })

    const rksysFileInput = document.querySelector('#rksys input[type=file]');
    rksysFileInput.onchange = () => {
        if (rksysFileInput.files.length > 0) {
            const fileName = document.querySelector('#rksys .file-name');
            read_rksys_file(fileName, rksysFileInput.files);
        }
    };

    const rkgFileInput = document.querySelector('#rkg-button input[type=file]');
    rkgFileInput.onchange = () => {
        if (rkgFileInput.files.length > 0) {
            read_rkg_files(rkgFileInput.files);
        }
    };

    const saveButton = document.querySelector('#import-save-butt');
    saveButton.onclick = async () => {
        await save_and_download_save();
    };

    const miniButtons = document.querySelectorAll('.mini');
    miniButtons.forEach(function(miniButton) {
        miniButton.onclick = () => {
            const index = parseInt(miniButton.id.split('-')[1]) - 1;
            const active_tab = document.querySelector('#license li.is-active');
            update_chosen_license(index, active_tab.id);
        }
    })

    const deleteButton = document.getElementById('delete-button');
    deleteButton.onclick = () => {
        const active_tab = document.querySelector('#license li.is-active');
        delete_selected_ghosts(active_tab.id);
    }

    const exportButton = document.getElementById('export-button');
    exportButton.onclick = async () => {
        const active_tab = document.querySelector('#license li.is-active');
        await zip_and_download_ghosts(active_tab.id);
    }

    const importButton = document.getElementById('import-button');
    importButton.onclick = () => {
        const active_tab = document.querySelector('#license li.is-active');
        import_ghosts(active_tab.id);
    }

    // drag&drop functionality

    const rksysDropArea = document.getElementById('rksys');
    const rksysDropArea2 = document.getElementById('license');
    const rkgDropArea = document.getElementById('ghost-import');

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ;['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        rksysDropArea.addEventListener(eventName, preventDefaults, false);
        rksysDropArea2.addEventListener(eventName, preventDefaults, false);
        rkgDropArea.addEventListener(eventName, preventDefaults, false);
    })

    function handleRksysDrop(e) {
        rksysFileInput.files = e.dataTransfer.files
        rksysFileInput.onchange();
    }

    function handleRKGDrop(e) {
        rkgFileInput.files = e.dataTransfer.files
        rkgFileInput.onchange();
    }

    rksysDropArea.addEventListener('drop', handleRksysDrop, false);
    rksysDropArea2.addEventListener('drop', handleRksysDrop, false);
    rkgDropArea.addEventListener('drop', handleRKGDrop, false);

    // highlighting functions

    rksysDropArea.addEventListener("dragenter", (e) => {rksysDropArea.classList.add('highlight');}, false);
    rksysDropArea2.addEventListener("dragenter", (e) => {rksysDropArea2.classList.add('highlight');}, false);
    rkgDropArea.addEventListener("dragenter", (e) => {rkgDropArea.classList.add('highlight');}, false);
    
    ;['dragleave', 'drop'].forEach(eventName => {
        rksysDropArea.addEventListener(eventName, (e) => {rksysDropArea.classList.remove('highlight');}, false);
        rksysDropArea2.addEventListener(eventName, (e) => {rksysDropArea2.classList.remove('highlight');}, false);
        rkgDropArea.addEventListener(eventName, (e) => {rkgDropArea.classList.remove('highlight');}, false);
    })
});

DOWNLOADING_GHOSTS = false;

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

function create_ghost_tooltip(td, info) {
    var tooltip = document.createElement("div");
    tooltip.innerHTML = "test";
    td.appendChild(tooltip);
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
            tr.parentNode.querySelector(".tooltip").classList.add("fade");
        }, 100);
    }
}

var destroy_ghost_tooltip = function (ghost) {
    return function (event) {
        var tooltips = event.target.parentNode.querySelectorAll('.tooltip');
        tooltips.forEach(function(tooltip) {
            event.target.parentNode.removeChild(tooltip);
        })
    }
}

var remove_import_ghost = function (event) {
    var test = parseInt(event.target.id.split('-')[1]);
    GHOSTS_IMPORT.splice(parseInt(event.currentTarget.parentNode.id.split('-')[1]), 1);
    update_import_table();
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