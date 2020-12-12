CHEAT_VISIBLE = false;

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
         update_language(0);
     }

     update_iso(ISO_REG);

    // include navigation bar
    var xhr= new XMLHttpRequest();
    xhr.open('GET', '../navbar.html', true);
    xhr.onreadystatechange= function() {
        if (this.readyState!==4) return;
        if (this.status!==200) return; // or whatever error handling you want
        document.getElementById('nav-placeholder').innerHTML= this.responseText;
    };
    xhr.send();

    // cheet sheet functionality (in jQuery)
    $("#cheat-sheet-header").click(function(){
        if (CHEAT_VISIBLE) {
            $("#cheat-sheet").slideUp();
            $(".cheat-arrow").toggleClass("flip");
            CHEAT_VISIBLE = false;
        } else {
            $("#cheat-sheet").slideDown();
            $(".cheat-arrow").toggleClass("flip");
            CHEAT_VISIBLE = true;
        }
    });

    document.getElementById('result').value = "";
    document.getElementById('id_input_0').value = "";
    document.getElementById('msg_input_0').value = "";
    document.getElementById('remove_butt').enabled = false;

    const tabSelector = document.querySelectorAll('#tabs li');
    tabSelector.forEach(function(tabObject) {
        tabObject.onclick = () => {
            var tab = tabObject.dataset.tab;
        
            tabSelector.forEach(function(tabObject2) {tabObject2.classList.remove('is-active');})
            tabObject.classList.add('is-active');
            update_iso(tabObject.querySelector("span").innerHTML);
            setCookie("iso_region", ISO_REG, 1000); // cookie expires after 1000 days
        }
    });

    const language_select = document.getElementById('language_select');
    language_select.addEventListener("change", function() {
        update_language(LANGUAGES[ISO_REG].indexOf(language_select.value));
    });

    const start_butt = document.getElementById("start_butt");
    start_butt.addEventListener('click', function() {
        generate_code();
    });

    const copy_butt = document.getElementById("copy_butt");
    copy_butt.addEventListener('click', function() {
        // copy the generated code to the clipboard
        const copy_text = document.getElementById("result");
        copy_text.select();
        copy_text.setSelectionRange(0, 99999); /*For mobile devices*/
        document.execCommand("copy");
    });

    const add_butt = document.getElementById("add_butt");
    add_butt.addEventListener('click', function() {
        var table = document.getElementById('msg_table');
        var new_row = table.rows[0].cloneNode(true);
        new_row.cells[0].getElementsByTagName('input')[0].setAttribute('id', `id_input_${table.rows.length}`);
        new_row.cells[0].getElementsByTagName('input')[0].value = "";
        new_row.cells[1].getElementsByTagName('input')[0].setAttribute('id', `msg_input_${table.rows.length}`);
        new_row.cells[1].getElementsByTagName('input')[0].value = "";
        table.appendChild(new_row);

        // -1 because we already added the row
        autocomplete(document.getElementById(`msg_input_${table.rows.length - 1}`), MSG_ID, true);
        autocomplete(document.getElementById(`id_input_${table.rows.length - 1}`), MSG_ID, false);

        //enable the remove button
        document.getElementById('remove_butt').enabled = true;
    });

    const remove_butt = document.getElementById("remove_butt");
    remove_butt.addEventListener('click', function() {
        var table = document.getElementById('msg_table');
        if (table.rows.length > 1) {
            table.deleteRow(table.rows.length - 1);
            this.enabled = table.rows.length == 1;
        }
    });

    const info_butt = document.getElementById("info-butt");
    info_butt.addEventListener('click', function() {
        window.open("http://wiki.tockdom.com/wiki/BMG_(File_Format)#0x1A_Escape_Sequences");
    });
});

var ISO_REG = "PAL";
var LANGUAGES = {
    "PAL": ["English", "French", "German", "Italian", "Spanish"],
    "NTSC-U": ["English", "Spanish", "French"],
    "NTSC-J": ["Japanese"],
    "NTSC-K": ["Korean"]
};
var MSG_MAPPING = {
    "PAL": ["MSG_E", "MSG_F", "MSG_G", "MSG_I", "MSG_S"],
    "NTSC-U": ["MSG_U", "MSG_M", "MSG_Q"],
    "NTSC-J": ["MSG_J"],
    "NTSC-K": ["MSG_K"]
};
var MSG_ID = "MSG_E";

function update_iso(iso) {
    ISO_REG = iso;
    var select = document.getElementById("language_select");
    select.innerHTML = "";
    for (var i = 0; i < LANGUAGES[ISO_REG].length; i++) {
        var option = document.createElement("option");
        option.innerHTML = LANGUAGES[ISO_REG][i];
        option.id = `select_${i}`;
        select.appendChild(option);
    }
    update_language(0);
}

function update_language(language_index) {
    MSG_ID = MSG_MAPPING[ISO_REG][language_index];
    var table = document.getElementById('msg_table');
    for (var i = 0; i < table.rows.length; i++) {
        autocomplete(document.getElementById(`msg_input_${i}`), MSG_ID, true);
        autocomplete(document.getElementById(`id_input_${i}`), MSG_ID, false);
    }
}

// ===========================
// AUTOCOMPLETE FUNCTIONS
// ===========================
// taken and adapted from from https://www.w3schools.com/howto/howto_js_autocomplete.asp 

function autocomplete(inp, msg_arr, match_advanced=false) {
    /*the autocomplete function takes two arguments,
    the text field element and an array of possible autocompleted values:*/
    var currentFocus;

    function match_beginning(e) {
        var a, b, val = e.value;
        /*close any already open lists of autocompleted values*/
        closeAllLists();
        if (!val) { return false;}
        currentFocus = -1;
        /*create a DIV element that will contain the items (values):*/
        a = document.createElement("DIV");
        a.setAttribute("id", e.id + "autocomplete-list");
        a.setAttribute("class", "autocomplete-items");
        a.setAttribute("style",`width:${e.parentNode.offsetWidth}px`);
        /*append the DIV element as a child of the autocomplete container:*/
        e.parentNode.appendChild(a);
        /*for each item in the array...*/
        for (let i = 0; i < IDS.length; i++) {
            var arr_text = IDS[i];
            /*check if the item starts with the same letters as the text field value:*/
            if (arr_text.substr(0, val.length).toUpperCase() == val.toUpperCase()) {
                /*create a DIV element for each matching element:*/
                b = document.createElement("DIV");
                /*make the matching letters bold:*/
                b.innerHTML = "<strong>" + arr_text.substr(0, val.length) + "</strong>";
                b.innerHTML += arr_text.substr(val.length);
                /*insert a input field that will hold the current array item's value:*/
                b.innerHTML += "<input type='hidden' value='" + arr_text + "'>";
                /*execute a function when someone clicks on the item value (DIV element):*/
                b.addEventListener("click", function(e) {
                    /*insert the value for the autocomplete text field:*/
                    inp.value = this.getElementsByTagName("input")[0].value;
                    document.getElementById(`msg_input_${inp.id.slice(-1)}`).value = MSG_DICT[MSG_ID][i];
                    /*close the list of autocompleted values,
                    or any other open lists of autocompleted values:*/
                    closeAllLists();
                });
                a.appendChild(b);
            }
        }
    }
    
    function match_everywhere(e) {
        var a, b, val = e.value;
        /*close any already open lists of autocompleted values*/
        closeAllLists();
        if (!val || val.length == 1) { return false;}
        currentFocus = -1;
        /*create a DIV element that will contain the items (values):*/
        a = document.createElement("DIV");
        a.setAttribute("id", e.id + "autocomplete-list");
        a.setAttribute("class", "autocomplete-items");
        a.setAttribute("style",`width:${e.parentNode.offsetWidth}px`);
        /*append the DIV element as a child of the autocomplete container:*/
        e.parentNode.appendChild(a);
        /*for each item in the array...*/
        for (let i = 0; i < MSG_DICT[msg_arr].length; i++) {
            var arr_text = MSG_DICT[msg_arr][i];
            for (var j = 0; j < arr_text.length; j++) {
                
                if (arr_text.substr(j, val.length).toUpperCase() == val.toUpperCase()) {
                    /*create a DIV element for each matching element:*/
                    b = document.createElement("DIV");
                    /*make the matching letters bold:*/
                    b.innerHTML = arr_text.substr(0, j);
                    b.innerHTML += "<strong>" + arr_text.substr(j, val.length) + "</strong>";
                    b.innerHTML += arr_text.substr(j + val.length);
                    /*insert a input field that will hold the current array item's value:*/
                    b.innerHTML += "<input type='hidden' value='" + arr_text + "'>";
                    /*execute a function when someone clicks on the item value (DIV element):*/
                    b.addEventListener("click", function(e) {
                        /*insert the value for the autocomplete text field:*/
                        inp.value = this.getElementsByTagName("input")[0].value;
                        document.getElementById(`id_input_${inp.id.slice(-1)}`).value = IDS[i];
                        /*close the list of autocompleted values,
                        or any other open lists of autocompleted values:*/
                        closeAllLists();
                    });
                    a.appendChild(b);
                    break;
                }
            }
        }
    }
    /*execute a function when someone writes in the text field:*/
    if (match_advanced) {
        inp.addEventListener("input", function(e) {
            match_everywhere(this);
        });
    } else {
        inp.addEventListener("input", function(e) {
            match_beginning(this);
        });
    }

    /*execute a function presses a key on the keyboard:*/
    inp.addEventListener("keydown", function(e) {
        var x = document.getElementById(this.id + "autocomplete-list");
        if (x) x = x.getElementsByTagName("div");
        if (e.keyCode == 40) {
        /*If the arrow DOWN key is pressed,
        increase the currentFocus variable:*/
        currentFocus++;
        /*and and make the current item more visible:*/
        addActive(x);
        } else if (e.keyCode == 38) { //up
        /*If the arrow UP key is pressed,
        decrease the currentFocus variable:*/
        currentFocus--;
        /*and and make the current item more visible:*/
        addActive(x);
        } else if (e.keyCode == 13) {
        /*If the ENTER key is pressed, prevent the form from being submitted,*/
        e.preventDefault();
        if (currentFocus > -1) {
            /*and simulate a click on the "active" item:*/
            if (x) x[currentFocus].click();
        }
        }
    });

    function addActive(x) {
        /*a function to classify an item as "active":*/
        if (!x) return false;
        /*start by removing the "active" class on all items:*/
        removeActive(x);
        if (currentFocus >= x.length) currentFocus = 0;
        if (currentFocus < 0) currentFocus = (x.length - 1);
        /*add class "autocomplete-active":*/
        x[currentFocus].classList.add("autocomplete-active");
    }

    function removeActive(x) {
        /*a function to remove the "active" class from all autocomplete items:*/
        for (var i = 0; i < x.length; i++) {
            x[i].classList.remove("autocomplete-active");
        }
    }

    function closeAllLists(elmnt) {
        /*close all autocomplete lists in the document,
        except the one passed as an argument:*/
        var x = document.getElementsByClassName("autocomplete-items");
        for (var i = 0; i < x.length; i++) {
            if (elmnt != x[i] && elmnt != inp) {
            x[i].parentNode.removeChild(x[i]);
            }
        }
    }

    /*execute a function when someone clicks in the document:*/
    document.addEventListener("click", function (e) {
        closeAllLists(e.target);
    });
}