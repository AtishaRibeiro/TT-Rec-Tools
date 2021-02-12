// all things that need to happen on load

document.addEventListener("DOMContentLoaded", function() {

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

    // drag&drop functionality (rksys)

    const rksysDropArea = document.getElementById('rksys');
    ;['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        rksysDropArea.addEventListener(eventName, preventDefaults, false);
    })

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    rksysDropArea.addEventListener('drop', handleRksysDrop, false);

    function handleRksysDrop(e) {
        rksysFileInput.files = e.dataTransfer.files
        rksysFileInput.onchange();
    }

    // highlighting functions (rksys)

    ;['dragenter', 'dragover'].forEach(eventName => {
        rksysDropArea.addEventListener(eventName, highlight, false);
    })
    
    ;['dragleave', 'drop'].forEach(eventName => {
    rksysDropArea.addEventListener(eventName, unhighlight, false);
    })
    
    function highlight(e) {
    rksysDropArea.classList.add('highlight');
    }
    
    function unhighlight(e) {
    rksysDropArea.classList.remove('highlight');
    }
});

function toggle_checkboxes(license_button) {
    var license_index = parseInt(license_button.id.slice(license_button.id.length - 1));
    var tbody = document.getElementById(`l${license_index}_t`);
    var select_all = license_button.innerHTML == "Select All";
    for (var row of tbody.rows) {
        row.cells[3].childNodes[0].checked = select_all;
    }
    if (select_all) {
        license_button.innerHTML = "Deselect All";
    } else {
        license_button.innerHTML = "Select All";
    }
}

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
        //l_col.style.borderRight = '#DDDDDD solid 1px';
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
        r_col.innerHTML = `<li>${ghost["character"]}</li>
        <li>${ghost["vehicle"]}</li>
        <li>${ghost["controller"]}</li>
        <li>${ghost["drift"]}</li>`

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