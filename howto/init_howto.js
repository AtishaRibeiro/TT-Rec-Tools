VALID_PAGES = ["recdolphin", "recconsole", "ghostmanager", "customtop10", "msgeditor", "gct"]

document.addEventListener("DOMContentLoaded", function() {

    var url_string  = window.location.href;
    var url = new URL(url_string);
    var page = url.searchParams.get("page");
    var page_html = "recdolphin.html"
    if (VALID_PAGES.includes(page)) {
        page_html = page + ".html"
    }

    var xhr= new XMLHttpRequest();
    xhr.open('GET', page_html, true);
    xhr.onreadystatechange= function() {
        if (this.readyState!==4) return;
        if (this.status!==200) return;
        document.getElementById('howto-content').innerHTML= this.responseText;
    };
    xhr.send();

    if (page == 'recdolphin') {
        var menu_r= new XMLHttpRequest();
        menu_r.open('GET', 'menudolphin.html', true);
        menu_r.onreadystatechange= function() {
            if (this.readyState!==4) return;
            if (this.status!==200) return;
            document.getElementById('menu').innerHTML= this.responseText;

            const chapters = document.querySelectorAll(".menu li");
            chapters.forEach(function(chapter) {
                chapter.onclick = () => {
                    var chapter_id = `c_${chapter.id.split('_')[1]}`;
                    document.getElementById(chapter_id).scrollIntoView();
                }
            });
        };
        menu_r.send();
    } else {
        document.getElementById('menu').innerHTML = '';
    }

    
});