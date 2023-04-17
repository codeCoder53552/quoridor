'use strict'

const GRID_WIDTH = 9;
const GRID_HEIGHT = 9;
const GRID_COLOR_PRIMARY = "#BCAAA4";
const GRID_COLOR_SECONDARY = "#795548";
const WALL_INACTIVE_COLOR = "#4E342E";
const WALL_ACTIVE_COLOR = "#E64A19";
const HOVER_COLOR = "#8c8c8c";
const HOVER_SELECT_COLOR = "#4c4c4c";
const SERVER_ADDRESS = "localhost:8082";

const PLAYER_COLORS = ["#43A047", "#E53935", "#000000", "#1565C0"];

var squareSize, wallWidth;
var lastRows = [], lastCols = [], lastDirections = [], lastMoveValid = false;
var images = new Map();
var turn = 1, wallsLeft = 0, nextPlayer = -1;
var playerNum = -1, playerString = "";
var gameFinished = false;
var socket, roomID;
var ctx;

var gameBoard = [], validMoves = [];

const getLastRow = () => lastRows.length > 0 ? lastRows[lastRows.length - 1] : -1;
const getLastCol = () => lastCols.length > 0 ? lastCols[lastCols.length - 1] : -1;
const getLastDir = () => lastDirections.length > 0 ? lastDirections[lastDirections.length - 1] : -1;

// Preload an image and store it by filename when ready
const preload = async filenames => {
    for (const filename of filenames) {
        const img = new Image();
        img.src = `res/${filename}`;
        await img.decode();
        images.set(filename, img);
    }
}

// Copy the room code to the client's clipboard. Document must be in focus
const copyRoomCode = () => {
    navigator.clipboard.writeText(roomID)
        .then(() => {
            alert(`Copied room code to clipboard (${roomID})`);
        })
        .catch(() => {
            alert(`Failed to copy room code (${roomID}) to clipboard.`);
        });
}

// Init canvas and start game loop
document.addEventListener("DOMContentLoaded", async () => {
    let img = preload(["Player-1.png", "Player-2.png", "Player-3.png", "Player-4.png"]);
    roomID = window.location.href.match(/room\/(.*)\//)[1];
    console.log("Attempting to join room:", roomID);

    const canvas = document.getElementById("game_canvas");
    ctx = initCanvas(canvas);

    await img;

    socket = new WebSocket(`ws://${SERVER_ADDRESS}/ws/${roomID}`);
    socket.onmessage = handleMessage;

    document.getElementById("game_code").addEventListener("click", copyRoomCode);
});

// Handle incoming message from the web socket
function handleMessage(msg) {
    const turnLabel = document.getElementById("game_turn");
    const wallCounter = document.getElementById("game_walls");
    const data = JSON.parse(msg.data);
    console.log(data);

    // Check the contents of the message and update game state
    if (data.hasOwnProperty('success') && !data.success) {
        turn = playerNum;
        alert("Invalid move. Try again!");
    }
    else if (data.hasOwnProperty('gameOver') && data.gameOver) {
        alert("Game over!");
        gameFinished = true;
    }

    if (data.hasOwnProperty('playerNum')) {
        // On the first message, set the player number and total number of walls
        playerNum = data.playerNum;
        wallsLeft = data.wallsLeft;
        nextPlayer = (playerNum + 1) % data.gameBoard.length;

        switch (playerNum) {
            case 0:
                playerString = "player_n";
                break;
            case 1:
                playerString = "player_s";
                break;
            case 2:
                playerString = "player_e";
                break;
            case 3:
                playerString = "player_w";
                break;
            default:
                playerString = "viewer";
                break;
        }

        wallCounter.textContent = wallsLeft;
    }
    if (data.hasOwnProperty("playerTurn")) {
        turn = data.playerTurn;
    }
    if (data.hasOwnProperty('validMoves') && data.validMoves) {
        validMoves = [];
        data.validMoves.forEach(move => {
            validMoves.push({ row: move[1], col: move[0] });
        });
    }
    if (data.hasOwnProperty('gameBoard')) {
        // Update the gameboard if supplied
        clearGameBoard(ctx);
        gameBoard = data.gameBoard;
        turn = data.playerTurn;

        if (gameFinished) {
            turnLabel.textContent = "Game over!";
            turnLabel.style.backgroundColor = null;
        }
        else if (playerNum === -1) {
            turnLabel.textContent = "Observing Live Game";
            wallCounter.parentNode.style.display = "none";
            turnLabel.style.backgroundColor = null;
        }
        else if (turn === playerNum) {
            turnLabel.textContent = "Choose your move!";
            turnLabel.style.backgroundColor = PLAYER_COLORS[playerNum];
        }
        else {
            turnLabel.textContent = "Waiting for opponent . . .";
            turnLabel.style.backgroundColor = null;
        }

        drawGameBoard(ctx);
    }
    if (data.hasOwnProperty('wallsLeft') && turn === nextPlayer) {
        wallCounter.textContent = data.wallsLeft;
        wallsLeft = data.wallsLeft;
    }
}

// Pack game piece as JSON string and send over the socket
function sendMessage(msg) {
    const msgStr = JSON.stringify(msg);
    socket.send(msgStr);
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
                ctx.drawImage(images.get(`Player-${piece.playerNum}.png`), piece.col * (squareSize + wallWidth) + wallWidth / 2, piece.row * (squareSize + wallWidth) + wallWidth / 2, squareSize - (wallWidth), squareSize - (wallWidth));
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

    canv.width = canv.width - wallWidth;
    canv.height = canv.height - wallWidth;

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
    if (turn !== playerNum || gameFinished || row >= GRID_WIDTH || col >= GRID_HEIGHT) {
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
        
        clearGameBoard(ctx);
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

    if (wallsLeft > 0 && wallDirection === "right" && col < GRID_WIDTH - 1 && row < GRID_HEIGHT - 1) {
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
    else if (wallsLeft > 0 && wallDirection === "bottom" && row < GRID_HEIGHT - 1 && col < GRID_WIDTH - 1) {
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
        turn++;

        let { row, col, wallDirection } = eventLocation(evt);

        let piece;
        if (wallDirection === "right" || wallDirection === "bottom") {
            piece = { type: "wall", row: row, col: col, player: playerString, direction: wallDirection };
        }
        else {
            piece = { type: "player", row: row, col: col, player: playerString };
        }

        console.log("Submit piece for validation: ", piece);
        sendMessage(piece);
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
