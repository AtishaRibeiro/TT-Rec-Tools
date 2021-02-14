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

    rksysDropArea.addEventListener("dragenter", rksysHighlight, false);
    
    ;['dragleave', 'drop'].forEach(eventName => {
        rksysDropArea.addEventListener(eventName, rksysUnhighlight, false);
    })
    
    function rksysHighlight(e) {
        rksysDropArea.classList.add('highlight');
    }
    
    function rksysUnhighlight(e) {
        rksysDropArea.classList.remove('highlight');
    }

    // RKG

    const rkgDropArea = document.getElementById('ghost-import');
    ;['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        rkgDropArea.addEventListener(eventName, preventDefaults, false);
    })

    rkgDropArea.addEventListener('drop', handleRKGDrop, false);

    function handleRKGDrop(e) {
        rkgFileInput.files = e.dataTransfer.files
        rkgFileInput.onchange();
    }
    
    rkgDropArea.addEventListener("dragenter", rkgHighlight, false);
    
    ;['dragleave', 'drop'].forEach(eventName => {
        rkgDropArea.addEventListener(eventName, rkgUnhighlight, false);
    })
    
    function rkgHighlight(e) {
        rkgDropArea.classList.add('highlight');
    }
    
    function rkgUnhighlight(e) {
        rkgDropArea.classList.remove('highlight');
    }
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

var remove_import_ghost = function (event) {
    var test = parseInt(event.target.id.split('-')[1]);
    GHOSTS_IMPORT.splice(parseInt(event.currentTarget.parentNode.id.split('-')[1]), 1);
    update_import_table();
}

var get_blank_rksys = function () {
    var xhr = new XMLHttpRequest();
    xhr.responseType = Blob;
    xhr.overrideMimeType(Blob);
    xhr.open('GET', 'rksys.dat', true);
    xhr.onreadystatechange= function() {
        if (this.readyState!==4) return;
        if (this.status!==200) return;
        const fileName = document.querySelector('#rksys .file-name');
        var file = new File([this.response], "rksys.dat")
        read_rksys_file(fileName, file);
    };
    xhr.send();
}