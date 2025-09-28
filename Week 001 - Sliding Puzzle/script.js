
/* Sources : 
    https://stackoverflow.com/questions/4459379/preview-an-image-before-it-is-uploaded
    https://developer.mozilla.org/fr/docs/Web/API/CanvasRenderingContext2D/drawImage
    https://stackoverflow.com/questions/8912917/cutting-an-image-into-pieces-through-javascript
    https://stackoverflow.com/questions/951021/what-is-the-javascript-version-of-sleep
    https://stackoverflow.com/questions/8903854/check-image-width-and-height-before-upload-with-javascript
    https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API
    https://stackoverflow.com/questions/4032179/how-do-i-get-the-width-and-height-of-a-html5-canvas
    https://www.w3schools.com/howto/howto_css_switch.asp
*/

const canvasSize = 4;
const shuffleCount = 200;
const animationFrames = 10;

let canvasTiles = [];

let image = new Image();

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

class Canvas {
    constructor(canvas, previewCanvas) {
        this.ctx = canvas.getContext('2d');
        this.previewCanvas = previewCanvas;

        let size = canvas.getBoundingClientRect().width;
        this.tileSize = size / canvasSize;
        this.image = new Image();

        this.tiles = [];
        this.moveableTiles = [];

        this.loaded = false;
    }

    loadImage(img) {
        this.loaded = false;

        let reader = new FileReader();
        reader.readAsDataURL(img[0]);
        reader.onload = function(event) {
            this.image.src = event.target.result;
        }.bind(this);

        this.image.onload = async function() {
            this.drawPreview();
            let minSize = Math.min(this.image.width, this.image.height);
            this.imageTile = minSize / canvasSize;

            this.tiles = [];

            for (let i = 0; i < canvasSize*canvasSize; i++) {
                this.tiles.push(i);
            }

            this.draw();
            this.calculateMoveableTiles();
            await this.shuffle();
            this.loaded = true;
        }.bind(this);
    }

    calculateMoveableTiles() {
        let emptyIndex = this.tiles.indexOf(canvasSize*canvasSize-1);
        let emptyX = emptyIndex % canvasSize;
        let emptyY = Math.floor(emptyIndex / canvasSize);

        this.moveableTiles = [];
        if (emptyX > 0) this.moveableTiles.push(this.tiles[emptyIndex - 1]);
        if (emptyX < canvasSize - 1) this.moveableTiles.push(this.tiles[emptyIndex + 1]);
        if (emptyY > 0) this.moveableTiles.push(this.tiles[emptyIndex - canvasSize]);
        if (emptyY < canvasSize - 1) this.moveableTiles.push(this.tiles[emptyIndex + canvasSize]);
    }

    async moveTile(tile) {
        if (!this.moveableTiles.includes(tile)) return;

        let tileIndex = this.tiles.indexOf(tile);
        let emptyIndex = this.tiles.indexOf(canvasSize*canvasSize-1);

        [this.tiles[tileIndex], this.tiles[emptyIndex]] = [this.tiles[emptyIndex], this.tiles[tileIndex]];

        this.ctx.fillStyle = "black";
        let emptyI = emptyIndex % canvasSize;
        let emptyJ = Math.floor(emptyIndex / canvasSize);

        let tileI = tileIndex % canvasSize;
        let tileJ = Math.floor(tileIndex / canvasSize);

        let deltaX = (emptyI - tileI) / animationFrames;
        let deltaY = (emptyJ - tileJ) / animationFrames;

        let imageI = tile % canvasSize;
        let imageJ = Math.floor(tile / canvasSize);
        
        if (this.loaded) {
            for (let i=0; i < animationFrames; i++) {
                this.ctx.fillStyle = "black";
                this.ctx.fillRect(tileI * this.tileSize, tileJ * this.tileSize, this.tileSize, this.tileSize);
                this.ctx.drawImage(this.image, imageI * this.imageTile, imageJ * this.imageTile, this.imageTile, this.imageTile,
                    (tileI + deltaX * i) * this.tileSize, (tileJ + deltaY * i) * this.tileSize, this.tileSize, this.tileSize);
                await sleep(1);
            }
        }

        this.draw();
        this.calculateMoveableTiles();
    }

    draw() {
        for (let i=0; i < this.tiles.length; i++) {
            let tile = this.tiles[i];

            let iCanva = i % canvasSize;
            let jCanva = Math.floor(i / canvasSize);

            if (tile == canvasSize*canvasSize-1) {
                this.ctx.fillStyle = "black";
                this.ctx.fillRect(iCanva * this.tileSize, jCanva * this.tileSize, this.tileSize, this.tileSize);
                continue;
            }

            let iImage = tile % canvasSize;
            let jImage = Math.floor(tile / canvasSize);

            this.ctx.drawImage(this.image, iImage * this.imageTile, jImage * this.imageTile, this.imageTile, this.imageTile,
                iCanva * this.tileSize, jCanva * this.tileSize, this.tileSize, this.tileSize);
        }
    }

    async shuffle() {
        for (let i = 0; i < shuffleCount; i++) {
            let randomTile = this.moveableTiles[Math.floor(Math.random() * this.moveableTiles.length)];
            this.moveTile(randomTile);

            await sleep(5);
        }
    }

    drawPreview() {
        if (this.image.width == 0 || this.image.height == 0) {
            return;
        }

        let ctx = this.previewCanvas.getContext('2d');
        let size = this.previewCanvas.getBoundingClientRect().width;
        let tileSize = size / canvasSize;

        let minSize = Math.min(this.image.width, this.image.height);

        ctx.drawImage(this.image, 0, 0, minSize, minSize, 0, 0, size, size);
        ctx.fillStyle = "black";
        ctx.fillRect((canvasSize - 1) * tileSize, (canvasSize - 1) * tileSize, tileSize, tileSize);
    }
}

function showPreview(show) {
    let resultCanvas = document.getElementById('previewCanvas');
    resultCanvas.style.visibility = show ? "visible" : "hidden";
}

const canvas = new Canvas(document.getElementById('puzzleCanvas'), document.getElementById('previewCanvas'));

showPreview(document.getElementById('showPreview').checked);

document.getElementById('showPreview').addEventListener('change', function(e) {
    showPreview(e.target.checked);
}, false);

document.getElementById('imageLoader').addEventListener('change', function(e) {
    canvas.loadImage(e.target.files);
}, false);

document.getElementById('puzzleCanvas').addEventListener('click', function(e) {
    if (!canvas.loaded) return;

    let rect = e.target.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;
    let i = Math.floor(x / canvas.tileSize);
    let j = Math.floor(y / canvas.tileSize);
    let tile = canvas.tiles[j * canvasSize + i];
    canvas.moveTile(tile);
});