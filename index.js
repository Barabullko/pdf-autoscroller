const pdfjsLib = window['pdfjs-dist/build/pdf'];

// The workerSrc property shall be specified.
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://mozilla.github.io/pdf.js/build/pdf.worker.js';

var pdfDoc = null,
    pageNum = 1,
    pageRendering = false,
    pageNumPending = null,
    scrollSpeed = 10,
    isScrolling = false,
    scrollIntervalId = null,
    pdfPageHeight = null,
    scale = null;

function renderPDF(url, canvasContainer) {
    function detectScale(page) {
        const pdfContainer = document.getElementById('pdf-container');
        const containerWidth = pdfContainer.offsetWidth;
        let scale = 1;
        let shouldLoop = true;
        while (shouldLoop) {
            const viewport = page.getViewport({scale: scale});
            const viewportWidth = viewport.width;
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
        if (!scale) {
            scale = detectScale(page);
        }
        const viewport = page.getViewport({scale: scale});
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const renderContext = {
            canvasContext: ctx,
            viewport: viewport
        };
        pdfPageHeight = viewport.height;
            
        canvas.height = viewport.height;
        canvas.width = viewport.width;
    
        canvasContainer.appendChild(canvas);
            
        page.render(renderContext);
    }
        
    function renderPages(pdfDoc) {
        for(let num = 1; num <= pdfDoc.numPages; num++)
            pdfDoc.getPage(num).then(renderPage);
    }
    
    pdfjsLib.disableWorker = true;
    pdfjsLib.getDocument(url).promise.then(renderPages);
}


// 1 = whole screen in 1 minute
function getMinimumInterval(speed) {
    let interval = 10;
    let shouldLoop = true;
    if (speed === 0) {
        return interval;
    }
    while(shouldLoop) {   
        let pixelsPerInterval = getPixelsPerInterval(interval, speed);
        if (pixelsPerInterval > 0.5) {
            shouldLoop = false;
        } else {
            interval += 1;
        }
    }
    return interval;
}

function getPixelsPerInterval(interval, speed) {
    return speed * pdfPageHeight / 600000 * interval;
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

    speedInput.addEventListener('change', (event) => {
        if (isScrolling) {
            clearInterval(scrollIntervalId);
            const speed = parseInt(speedInput.value);
            const interval = getMinimumInterval(speed);
            const pixelsPerInterval = getPixelsPerInterval(interval, speed);
            scrollIntervalId = setInterval(() => {
                window.scrollBy({
                    top: pixelsPerInterval,
                    left: 0,
                    behavior: 'smooth'
                });
            }, interval);
        }
    });
    
    startStopButton.addEventListener('click', (event) => {
        if (isScrolling) {
            clearInterval(scrollIntervalId);
            isScrolling = false;
        } else {
            const speed = parseInt(speedInput.value);
            const interval = getMinimumInterval(speed);
            const pixelsPerInterval = getPixelsPerInterval(interval, speed);
            scrollIntervalId = setInterval(() => {
                window.scrollBy({ 
                    top: pixelsPerInterval,
                    left: 0, 
                    behavior: 'smooth' 
                  });
            }, interval);
            isScrolling = true;
        }
    });

}, false);
