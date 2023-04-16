'use strict'

const GRID_WIDTH = 9;
const GRID_HEIGHT = 9;
const GRID_COLOR_PRIMARY = "#dbb8a1";
const GRID_COLOR_SECONDARY = "#7d5942";
const WALL_INACTIVE_COLOR = "#38281e";
const WALL_ACTIVE_COLOR = "#f66206";
const HOVER_COLOR = "#8c8c8c";
const HOVER_SELECT_COLOR = "#4c4c4c";
const SERVER_ADDRESS = "localhost:8082";

var squareSize, wallWidth;
var lastRows = [], lastCols = [], lastDirections = [], lastMoveValid = false;
var images = new Map();
var turn = 0;
var playerNum = 1;
var gameFinished = false;
var socket, roomID;

var gameBoard = [
    { type: "player", row: 0, col: 4, playerNum: 1 },
    { type: "player", row: 8, col: 4, playerNum: 2 }
];
var validMoves = [
    { row: 0, col: 0 },
    { row: 1, col: 1 }
];

const getLastRow = () => lastRows.length > 0 ? lastRows[lastRows.length - 1] : -1;
const getLastCol = () => lastCols.length > 0 ? lastCols[lastCols.length - 1] : -1;
const getLastDir = () => lastDirections.length > 0 ? lastDirections[lastDirections.length - 1] : -1;
const preload = async filenames => {
    for (const filename of filenames) {
        const img = new Image();
        img.src = `res/${filename}`;
        await img.decode();
        images.set(filename, img);
    }
}

// Init canvas and start game loop
document.addEventListener("DOMContentLoaded", async () => {
    let img = preload(["Player-1.png", "Player-2.png"]);
    roomID = window.location.href.match(/room\/(.*)\//)[1];
    console.log("Attempting to join room:", roomID);
    socket = new WebSocket(`ws://${SERVER_ADDRESS}/ws/${roomID}`);
    socket.onmessage = handleMessage;

    const canvas = document.getElementById("game_canvas");
    let ctx = initCanvas(canvas);

    await img;
    drawGameBoard(ctx);
});

function handleMessage(msg) {
    console.log(JSON.parse(msg.data));
}

// Initialize the game board with all empty spaces
function clearGameBoard(ctx) {
    for (const piece of gameBoard) {
        switch (piece.type) {
            case "player":
                const color = (piece.row + piece.col) % 2 ? GRID_COLOR_PRIMARY : GRID_COLOR_SECONDARY;
                fillSquare(ctx, piece.col, piece.row, color);
                break;
            case "wall":
                if (piece.direction === 'bottom') {
                    addHorizontalWall(ctx, piece.col, piece.row, WALL_INACTIVE_COLOR);
                }
                else {
                    addVerticalWall(ctx, piece.col, piece.row, WALL_INACTIVE_COLOR);
                }
                break;
            default:
                console.log("Unknown game piece: ", piece.type);
                break;
        }
    }
}

// Draw each game piece. Accepts a callback to run after all pieces are drawn including image loads
// Callback might be run multiple times, so avoid expensive operations
function drawGameBoard(ctx, callback) {
    for (const piece of gameBoard) {
        switch (piece.type) {
            case "player":
                ctx.drawImage(images.get(`Player-${piece.playerNum}.png`), piece.col * (squareSize + wallWidth), piece.row * (squareSize + wallWidth), squareSize, squareSize);
                break;
            case "wall":
                if (piece.direction === 'bottom') {
                    addHorizontalWall(ctx, piece.col, piece.row, WALL_ACTIVE_COLOR);
                }
                else {
                    addVerticalWall(ctx, piece.col, piece.row, WALL_ACTIVE_COLOR);
                }
                break;
            default:
                console.log("Unknown game piece: ", piece.type);
                break;
        }
    }
    callback?.(ctx);
}

// Draw / scale the initial game board and return the canvas context
function initCanvas(canv) {
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
            if (i != 0) {
                // Fills in vertical inactive walls & covers the space between verticle & horizontal walls
                if (j != GRID_WIDTH - 1) {
                    ctx.fillRect((i * squareSize) + ((i-1) * wallWidth), (j * squareSize) + (j * wallWidth), wallWidth, squareSize + wallWidth);
                }
                else {
                    ctx.fillRect((i * squareSize) + ((i-1) * wallWidth), (j * squareSize) + (j * wallWidth), wallWidth, squareSize);
                }
            }
            // Handle filling in the inactive horizontal walls
            if (j != 0) {
                ctx.fillRect((i * squareSize) + (i * wallWidth), (j * squareSize) + ((j-1) * wallWidth), squareSize, wallWidth);
            }
        }
    }

    canv.addEventListener("mousemove", evt => handleHover(evt, ctx));
    canv.addEventListener("click", evt => handleSelect(evt, ctx));

    return ctx;
}

// Get row, column, and wall from event/cursor location
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
function handleHover(evt, ctx, clear) {
    let { lastRow, lastCol, lastDirection } = { lastRow: getLastRow(), lastCol: getLastCol(), lastDirection: getLastDir() };
    let { row, col, wallDirection } = clear ? { lastRow, lastCol, lastDirection } : eventLocation(evt);
    if (turn !== 0 || row >= GRID_WIDTH || col >= GRID_HEIGHT) {
        lastMoveValid = false;
        return;
    }

    // If the position has changed, update the hover
    if (clear || row != lastRow || col != lastCol || wallDirection != lastDirection) {
        document.getElementById("game_canvas").style.cursor = "default";

        // First, clear the previous squares
        while (lastRows.length > 0) {
            let lastRow = lastRows.pop();
            let lastCol = lastCols.pop();
            lastDirections.pop();

            fillSquare(ctx, lastCol, lastRow, (lastRow + lastCol) % 2 ? GRID_COLOR_PRIMARY : GRID_COLOR_SECONDARY);
            if (lastCol < GRID_WIDTH - 1) addVerticalWall(ctx, lastCol, lastRow, WALL_INACTIVE_COLOR);
            if (lastRow < GRID_HEIGHT - 1) addHorizontalWall(ctx, lastCol, lastRow, WALL_INACTIVE_COLOR);
        }
        
        // Next, draw the game piece (player, wall) and draw the hover elements afterwards
        drawGameBoard(ctx, ctx => drawHover(ctx, row, col, wallDirection));
    }
}

// Draw hover element
function drawHover(ctx, row, col, wallDirection) {
    const canv = document.getElementById("game_canvas");

    lastMoveValid = false;
    lastRows.push(row);
    lastCols.push(col);
    lastDirections.push(wallDirection);

    if (wallDirection === "right" && col < GRID_WIDTH - 1 && row < GRID_HEIGHT - 1) {
        // Check to see if there are any overlapping wall pieces
        for (const piece of gameBoard) {
            if (piece.type === "wall" && 
                (piece.direction === "right" && piece.col === col && 
                    (piece.row === row || piece.row + 1 === row || piece.row === row + 1))
                || (piece.direction === "bottom" && piece.row === row && piece.col === col)
                ) return;
        }
        lastMoveValid = true;
        addVerticalWall(ctx, col, row, HOVER_COLOR);
        canv.style.cursor = "pointer";
    }
    else if (wallDirection === "bottom" && row < GRID_HEIGHT - 1 && col < GRID_WIDTH - 1) {
        // Check to see if there are any overlapping wall pieces
        for (const piece of gameBoard) {
            if (piece.type === "wall" && 
                (piece.direction === "bottom" && piece.row === row && 
                    (piece.col === col || piece.col + 1 === col || piece.col === col + 1))
                || (piece.direction === "right" && piece.row === row && piece.col === col)
                ) return;
        }
        lastMoveValid = true;
        addHorizontalWall(ctx, col, row, HOVER_COLOR);
        canv.style.cursor = "pointer";
    }
    else {
        // Only highlight squares that are listed in the valid moves
        for (const sq of validMoves) {
            if (sq.row === row && sq.col === col) {
                lastMoveValid = true;
                fillSquare(ctx, col, row, HOVER_COLOR);
                canv.style.cursor = "pointer";
                return;
            }
        }
    }
}

// Handle a click
function handleSelect(evt, ctx) {
    if (lastMoveValid) {
        handleHover(void 0, ctx, true);
        // turn = (turn + 1) % 2;

        let { row, col, wallDirection } = eventLocation(evt);

        let piece;
        if (wallDirection === "right" || wallDirection === "bottom") {
            piece = { type: "wall", row: row, col: col, direction: wallDirection };
            gameBoard.push(piece);
            drawGameBoard(ctx);
        }
        else {
            piece = { type: "player", row: row, col: col, playerNum: playerNum };
        }

        console.log("Submit piece for validation: ", piece);
    }
}

// Fill in a square with a specified color
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
    let x = (column + 1) * squareSize; // Calculates x/y location based upon array location & squareSize
    let y = row * squareSize;

    ctx.fillStyle = color; 
    ctx.fillRect(x + (column * wallWidth), y + (row * wallWidth), wallWidth, (squareSize * 2) + wallWidth);
}

// Draws horizontal walls based upon row/column location
function addHorizontalWall(ctx, column, row, color) {
    if (column === GRID_WIDTH - 1) column--;
    let x = column * squareSize;
    let y = (row + 1) * squareSize;

    ctx.fillStyle = color;
    ctx.fillRect(x + (column * wallWidth), y + (row * wallWidth), (squareSize * 2) + wallWidth, wallWidth);
}
