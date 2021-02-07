// all things that need to happen on load

document.addEventListener("DOMContentLoaded", function() {

    // function init_page() {
    //     update_table([0, 1, 2, 3]);
    // }

    //init_page();

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

    // const licenseButton = document.querySelectorAll('.rkg-button');
    // licenseButton.forEach(function(licenseButton) {
    //     licenseButton.onclick = (button) => {
    //         toggle_checkboxes(button.target);
    //     };
    // })

    // const importButton = document.querySelector('#import-save-butt');
    // importButton.onclick = async () => {
    //     await download();
    // };

    const miniButtons = document.querySelectorAll('.mini');
    miniButtons.forEach(function(miniButton) {
        miniButton.onclick = () => {
            const index = parseInt(miniButton.id.split('-')[1]) - 1;
            update_chosen_license(index, 'pb');
        }
    })

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
    var button = document.getElementById('import-save-butt');
    if (turn_on) {
        DOWNLOADING_GHOSTS = true;
        button.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i><p id="export_progress"></p>';
        button.disabled = true;
    } else {
        DOWNLOADING_GHOSTS = false;
        button.innerHTML = 'Export & Download';
        button.disabled = false;
    }
}

function update_progress(completed, total) {
    var progress_text = document.getElementById('export_progress');
    progress_text.innerHTML = `&nbsp; ${completed} / ${total}`;
}