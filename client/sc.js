'use strict'

const GRID_WIDTH = 9;
const GRID_HEIGHT = 9;
const GRID_COLOR_PRIMARY = "#dbb8a1";
const GRID_COLOR_SECONDARY = "#7d5942";

document.addEventListener("DOMContentLoaded", () => {
    let ctx = initCanvas();
});

function initCanvas() {
    const canv = document.getElementById("game_canvas");
    const ctx = canv.getContext("2d");

    let containerHeight = document.getElementById("game_container").clientHeight;
    containerHeight = containerHeight - (containerHeight % GRID_WIDTH);
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