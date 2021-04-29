var pdfjsLib = window['pdfjs-dist/build/pdf'];

// The workerSrc property shall be specified.
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://mozilla.github.io/pdf.js/build/pdf.worker.js';

var pdfDoc = null,
    pageNum = 1,
    pageRendering = false,
    pageNumPending = null,
    scrollSpeed = 10,
    isScrolling = false,
    scrollIntervalId = null;

function renderPDF(url, canvasContainer) {
    function detectScale(page) {
        const pdfContainer = document.getElementById('pdf-container');
        const containerWidth = pdfContainer.offsetWidth;
        var scale = 1;
        var shouldLoop = true;
        while (shouldLoop) {
            var viewport = page.getViewport({scale: scale});
            var viewportWidth = viewport.width;
            if (viewportWidth < containerWidth) {
                scale = scale * 1.5;
            } else {
                scale = scale / 1.5;
            }
            if (pdfContainer.offsetWidth - viewport.width < 100) {
                shouldLoop = false;
            }
        }
        return scale;
    }
            
    function renderPage(page) {
        const scale = detectScale(page);
        var viewport = page.getViewport({scale: scale});
        var canvas = document.createElement('canvas');
        var ctx = canvas.getContext('2d');
        var renderContext = {
            canvasContext: ctx,
            viewport: viewport
        };
            
        canvas.height = viewport.height;
        canvas.width = viewport.width;
    
        canvasContainer.appendChild(canvas);
            
        page.render(renderContext);
    }
        
    function renderPages(pdfDoc) {
        for(var num = 1; num <= pdfDoc.numPages; num++)
            pdfDoc.getPage(num).then(renderPage);
    }
    
    pdfjsLib.disableWorker = true;
    pdfjsLib.getDocument(url).promise.then(renderPages);
} 

document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('file-input');
    const speedInput = document.getElementById('scroll-speed');
    speedInput.value = scrollSpeed;
    const startStopButton = document.getElementById('start-stop');

    fileInput.addEventListener('change', (event) => {
        const pdfContainer = document.getElementById('pdf-container');
        const url = URL.createObjectURL(event.target.files[0]);
        renderPDF(url, pdfContainer);
    });
    
    startStopButton.addEventListener('click', (event) => {
        if (isScrolling) {
            clearInterval(scrollIntervalId);
            isScrolling = false;
        } else {
            scrollIntervalId = setInterval(() => {
                document.body.scrollTop += parseInt(speedInput.value);
            }, 100);
            isScrolling = true;
        }
    });

}, false);
