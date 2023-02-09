'use strict'

const GRID_WIDTH = 9;
const GRID_HEIGHT = 9;
const GRID_COLOR_PRIMARY = "#dbb8a1";
const GRID_COLOR_SECONDARY = "#7d5942";
const WALL_INACTIVE_COLOR = "#38281e";
const WALL_ACTIVE_COLOR = "#f66206";

// Init canvas and start game loop
document.addEventListener("DOMContentLoaded", () => {
    let ctx = initCanvas();
});

// Draw / scale the initial game board and return the canvas context
function initCanvas() {
    const canv = document.getElementById("game_canvas");
    const ctx = canv.getContext("2d");

    // Make sure the width of the canvas is the closest multiple of the grid height
    let containerHeight = document.getElementById("game_container").clientHeight;
    containerHeight = containerHeight - (containerHeight % GRID_HEIGHT);
    canv.width = containerHeight + (containerHeight / 8);
    canv.height = containerHeight + (containerHeight / 8);

    const squareSize = Math.floor(containerHeight / GRID_WIDTH);
    const offset = Math.floor(squareSize/8);
    console.log("Square size", squareSize);

    for (let i = 0; i < GRID_WIDTH; i++) {
        for (let j = 0; j < GRID_HEIGHT; j++) {
            ctx.fillStyle = ((i + j) % 2) ? GRID_COLOR_PRIMARY : GRID_COLOR_SECONDARY;
            ctx.fillRect((i * squareSize) + (i * offset), (j * squareSize) + (j * offset), squareSize, squareSize);
            ctx.fillStyle = WALL_INACTIVE_COLOR;
            //Handle filling in the inactive vertical walls
            if(i != 0){
                //Fills in vertical inactive walls & covers the space between verticle & horizontal walls
                if(j != GRID_WIDTH-1){
                    ctx.fillRect((i * squareSize) + ((i-1) * offset), (j * squareSize) + (j * offset), offset, squareSize+offset);
                }
                else{
                    ctx.fillRect((i * squareSize) + ((i-1) * offset), (j * squareSize) + (j * offset), offset, squareSize);
                }
            }
            //Handle filling in the inactive horizontal walls
            if(j != 0){
                ctx.fillRect((i * squareSize) + (i * offset), (j * squareSize) + ((j-1) * offset), squareSize, offset);
            }
        }
    }
    //Loads in Pawns
    var player1 = new Image();
    var player2 = new Image();
    player1.src = 'res/Player-1.png';
    player2.src = 'res/Player-2.png';
    player1.onload = function() {
        ctx.drawImage(player1, (4*squareSize) + (4*offset), 0, squareSize, squareSize);
    }
    player2.onload = function() {
        ctx.drawImage(player2, (4*squareSize) + (4*offset), (8*squareSize) + (8*offset), squareSize, squareSize);
    }

    return ctx;
}

//Draws vertical walls based upon row/column location
function addVerticalWall(ctx, squareSize, column, row) {
    const offset = Math.floor(squareSize/8); //The offset used for walls

    //X is valid at 1-8, Y is valid at 0-7
    let x = column * squareSize; // Calculates x/y location based upon array location & squareSize
    let y = row * squareSize;

    ctx.fillStyle = WALL_ACTIVE_COLOR; 
    ctx.fillRect(x + ((column - 1) * offset), y + (row * offset), offset, (squareSize * 2) + offset)
}

//Draws horizontal walls based upon row/column location
function addHorizontalWall(ctx, squareSize, column, row) {
    const offset = Math.floor(squareSize/8); //The offset used for walls

    //X is valid at 0-7, Y is valid at 1-8
    let x = column * squareSize;
    let y = row * squareSize;

    ctx.fillStyle = WALL_ACTIVE_COLOR;
    ctx.fillRect(x + (column * offset), y + ((row-1) * offset), (squareSize * 2) + offset, offset);
}