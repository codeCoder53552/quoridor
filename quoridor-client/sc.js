'use strict'

const GRID_WIDTH = 9;
const GRID_HEIGHT = 9;
const GRID_COLOR_PRIMARY = "#dbb8a1";
const GRID_COLOR_SECONDARY = "#7d5942";
const WALL_INACTIVE_COLOR = "#38281e";
const WALL_ACTIVE_COLOR = "#f66206";
const HOVER_COLOR = "#8c8c8c";
const HOVER_SELECT_COLOR = "#4c4c4c";

var squareSize, wallWidth;
var lastRow = -1, lastCol = -1;

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

    squareSize = Math.floor(containerHeight / GRID_WIDTH);
    wallWidth = Math.floor(squareSize/8);

    for (let i = 0; i < GRID_WIDTH; i++) {
        for (let j = 0; j < GRID_HEIGHT; j++) {
            ctx.fillStyle = ((i + j) % 2) ? GRID_COLOR_PRIMARY : GRID_COLOR_SECONDARY;
            ctx.fillRect((i * squareSize) + (i * wallWidth), (j * squareSize) + (j * wallWidth), squareSize, squareSize);
            ctx.fillStyle = WALL_INACTIVE_COLOR;
            // Handle filling in the inactive vertical walls
            if(i != 0){
                // Fills in vertical inactive walls & covers the space between verticle & horizontal walls
                if(j != GRID_WIDTH-1){
                    ctx.fillRect((i * squareSize) + ((i-1) * wallWidth), (j * squareSize) + (j * wallWidth), wallWidth, squareSize + wallWidth);
                }
                else{
                    ctx.fillRect((i * squareSize) + ((i-1) * wallWidth), (j * squareSize) + (j * wallWidth), wallWidth, squareSize);
                }
            }
            // Handle filling in the inactive horizontal walls
            if(j != 0){
                ctx.fillRect((i * squareSize) + (i * wallWidth), (j * squareSize) + ((j-1) * wallWidth), squareSize, wallWidth);
            }
        }
    }
    // Loads in Pawns
    var player1 = new Image();
    var player2 = new Image();
    player1.src = 'res/Player-1.png';
    player2.src = 'res/Player-2.png';
    player1.onload = function() {
        ctx.drawImage(player1, (4*squareSize) + (4*wallWidth), 0, squareSize, squareSize);
    }
    player2.onload = function() {
        ctx.drawImage(player2, (4*squareSize) + (4*wallWidth), (8*squareSize) + (8*wallWidth), squareSize, squareSize);
    }

    addVerticalWall(ctx, squareSize, 1, 1, WALL_ACTIVE_COLOR);
    addHorizontalWall(ctx, squareSize, 7, 7, WALL_ACTIVE_COLOR);

    canv.addEventListener("mousemove", evt => handleHover(evt, ctx));
    canv.addEventListener("click", evt => handleSelect(evt, ctx));

    return ctx;
}

function eventLocation(evt) {
    const col = Math.floor(evt.offsetX / squareSize);
    const row = Math.floor(evt.offsetY / squareSize);

    // Position inside of the square
    const squareX = evt.offsetX % squareSize;
    const squareY = evt.offsetY % squareSize;

    let wallDirection = "none";
    if (squareX > squareSize - wallWidth) {
        wallDirection = "right";
    }
    else if (squareY > squareSize - wallWidth) {
        wallDirection = "bottom";
    }

    return { row, col, wallDirection };
}

// Allow the user to see where they can move / place walls
function handleHover(evt, ctx) {
    fillSquare(ctx, lastCol, lastRow, (lastRow + lastCol) % 2 ? GRID_COLOR_PRIMARY : GRID_COLOR_SECONDARY);
    if (lastCol < GRID_WIDTH - 1) addVerticalWall(ctx, lastCol + 1, lastRow, WALL_INACTIVE_COLOR);
    if (lastRow < GRID_HEIGHT - 1) addHorizontalWall(ctx, lastCol, lastRow + 1, WALL_INACTIVE_COLOR);

    let { row, col, wallDirection } = eventLocation(evt);
    
    if (row >= GRID_WIDTH || col >= GRID_HEIGHT) return;

    lastRow = row;
    lastCol = col;
    
    if (wallDirection === "right" && col < GRID_WIDTH - 1 && row < GRID_HEIGHT - 1) {
        addVerticalWall(ctx, col + 1, row, HOVER_COLOR);
    }
    else if (wallDirection === "bottom" && row < GRID_HEIGHT - 1 && col < GRID_WIDTH - 1) {
        addHorizontalWall(ctx, col, row + 1, HOVER_COLOR);
    }
    else {
        fillSquare(ctx, col, row, HOVER_COLOR);
    }
}

function handleSelect(evt, ctx) {
    let { row, col, wallDirection } = eventLocation(evt);
    if (wallDirection === "right") {
        console.log(`Clicked wall to the right of (${row}, ${col})`);
    }
    else if (wallDirection === "bottom") {
        console.log(`Clicked wall below (${row}, ${col})`);
    }
    else {
        console.log(`Clicked square (${row}, ${col})`);
    }
}

function fillSquare(ctx, col, row, color) {
    let x = (col * squareSize) + (col * wallWidth); // Calculates x/y location based upon array location & squareSize
    let y = row * squareSize + (row * wallWidth);

    ctx.fillStyle = color;
    ctx.fillRect(x, y, squareSize, squareSize);

    if (color === HOVER_COLOR) {
        ctx.beginPath();
        ctx.arc(x + squareSize/2, y + squareSize/2, 18, 0, 2 * Math.PI, false);
        ctx.fillStyle = HOVER_SELECT_COLOR;
        ctx.fill();
    }
}

// Draws vertical walls based upon row/column location
function addVerticalWall(ctx, column, row, color) {
    if (row === GRID_HEIGHT - 1) row--;
    // X is valid at 1-8, Y is valid at 0-7
    let x = column * squareSize; // Calculates x/y location based upon array location & squareSize
    let y = row * squareSize;

    ctx.fillStyle = color; 
    ctx.fillRect(x + ((column - 1) * wallWidth), y + (row * wallWidth), wallWidth, (squareSize * 2) + wallWidth);
}

// Draws horizontal walls based upon row/column location
function addHorizontalWall(ctx, column, row, color) {
    if (column === GRID_WIDTH - 1) column--;
    // X is valid at 0-7, Y is valid at 1-8
    let x = column * squareSize;
    let y = row * squareSize;

    ctx.fillStyle = color;
    ctx.fillRect(x + (column * wallWidth), y + ((row-1) * wallWidth), (squareSize * 2) + wallWidth, wallWidth);
}
