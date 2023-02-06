'use strict'

const GRID_WIDTH = 9;
const GRID_HEIGHT = 9;
const GRID_COLOR_PRIMARY = "#dbb8a1";
const GRID_COLOR_SECONDARY = "#7d5942";
const WALL_ACTIVE_COLOR = "#38281e";

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
    canv.width = containerHeight;
    canv.height = containerHeight;

    const squareSize = Math.floor(containerHeight / GRID_WIDTH);
    console.log("Square size", squareSize);

    for (let i = 0; i < GRID_WIDTH; i++) {
        for (let j = 0; j < GRID_HEIGHT; j++) {
            ctx.fillStyle = ((i + j) % 2) ? GRID_COLOR_PRIMARY : GRID_COLOR_SECONDARY;
            ctx.fillRect(i * squareSize, j * squareSize, squareSize, squareSize);
        }
    }
    return ctx;
}

//Draws vertical walls based upon row/column location
function addVerticalWall(ctx, squareSize, column, row) {
    //X is valid at 1-8, Y is valid at 0-7
    let x = column * squareSize; // Calculates x/y location based upon array location & squareSize
    let y = row * squareSize;

    ctx.fillStyle = WALL_ACTIVE_COLOR; 
    ctx.fillRect(x-squareSize/16, y, squareSize/8, squareSize * 2);
}

//Draws horizontal walls based upon row/column location
function addHorizontalWall(ctx, squareSize, column, row) {
    let x = column * squareSize;
    let y = row * squareSize;

    ctx.fillStyle = WALL_ACTIVE_COLOR;
    ctx.fillRect(x, y-squareSize/16, squareSize*2, squareSize/8);
}