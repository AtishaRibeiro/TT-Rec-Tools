// all things that need to happen on load

document.addEventListener("DOMContentLoaded", function() {

    function init_page() {
        update_table([0, 1, 2, 3]);
    }

    init_page();

    const tabSelector = document.querySelectorAll('#tabs li');
    tabSelector.forEach(function(tabObject) {
        tabObject.onclick = () => {
            if (!DOWNLOADING_GHOSTS) { // don't allow tab switching when ghosts are being downloaded
                var tab = tabObject.dataset.tab;
          
                tabSelector.forEach(function(tabObject2) {tabObject2.classList.remove('is-active');})
                tabObject.classList.add('is-active');
    
                switch_mode(tab == 1);
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

    handle_input_event();
    

    const licenseButton = document.querySelectorAll('.rkg-button');
    licenseButton.forEach(function(licenseButton) {
        licenseButton.onclick = (button) => {
            toggle_checkboxes(button.target);
        };
    })

    const importButton = document.querySelector('#import-save-butt');
    importButton.onclick = async () => {
        await download();
    };

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

function handle_input_event() {
    const rkgFileInputs = document.querySelectorAll('.rkg-button input[type=file]');
    rkgFileInputs.forEach(function(rkgFileInput) {
        rkgFileInput.onchange = () => {
            if (rkgFileInput.files.length > 0) {
                read_rkg_files(rkgFileInput.files, parseInt(rkgFileInput.id[3]) - 1);
            }
        };
    })
}

// switching from import to export mode and back

function switch_mode(importing=true) {
    if (importing != IMPORTING) {
        IMPORTING = importing;
        var big_button = document.getElementById('import-save-butt')
        big_button.innerHTML = IMPORTING ? 'Import & Download' : 'Export & Download';

        for (var i = 1; i <= 4; i++) {
            var license_button = document.getElementById(`button${i}`);
            if (IMPORTING) {
                var input_text = `<input id="rkg${i}" class="file-input" type="file" name="resume" multiple="multiple" accept=".rkg">`;
                input_text += '<i class="fas fa-upload"></i>&nbsp; Upload RKG';
                license_button.innerHTML = input_text;
                handle_input_event();
            } else {
                license_button.innerHTML = "Select All";
            }
        }
        update_table([0, 1, 2, 3], IMPORTING);
    }
}

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