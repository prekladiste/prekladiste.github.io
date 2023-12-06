canvas = document.getElementById("gameBoard");

var c = canvas.getContext("2d");

// set assets (pictures of entities and box)
const assets = [];
for (let i = 1; i <= 19; i++) {
    const asset = new Image();
    asset.src = `assets/${i}.png`;
    assets[i] = asset;
}
assets[assets.length - 1].onload = function () { // initialize on load
    gameBoard.init();
};
const back = new Image(); // back btn
back.src = 'icons/back.png';
back.onload = function () { // initialize on load
    gameBoard.init();
};

const moveType1 = new Image(); // set moveType1 btn
moveType1.src = 'icons/move.png';
moveType1.onload = function () { // initialize on load
    gameBoard.init();
};
const moveType2 = new Image(); // set moveType2 btn
moveType2.src = 'icons/catch.png';
moveType2.onload = function () { // initialize on load
    gameBoard.init();
};

const moveType3 = new Image(); // set moveType3 btn
moveType3.src = 'icons/upgrade.png';
moveType3.onload = function () { // initialize on load
    gameBoard.init();
};

const shoot = new Image();
shoot.src = 'icons/shoot.png';
shoot.onload = function () {
    gameBoard.init();
}
const breakUp = new Image();
breakUp.src = 'icons/breakUp.png';
breakUp.onload = function () {
    gameBoard.init();
}
const turnLeft = new Image();
turnLeft.src = 'icons/turnLeft.png';
turnLeft.onload = function () {
    gameBoard.init();
}
const turnRight = new Image();
turnRight.src = 'icons/turnRight.png';
turnRight.onload = function () {
    gameBoard.init();
}





class GameError extends Error { // class with errors
    cannotInsertUnit(queue) {
        let message = 'This unit cannot be inserted';
        return {
            message: message,
            queue: queue,
        };
    }
    cannotInsertBox(asset, pos) {
        let message = 'you can not insert box here'
        return {
            message: message,
            asset: asset,
            position: pos
        }
    }
    assetCannotBeMoved(asset) {
        let message = 'you can not move with this asset';
        return {
            message: message,
            asset: asset
        }
    }
    invalidDirection(from, to) {
        let message = 'you cannot move to this cell'
        return {
            message: message,
            from: from,
            to: to
        };
    }

    colorDoesNotExist(color) {
        let message = 'This color does not exist, try (b/r)';
        return {
            message: message,
            color: color
        };
    }

    theAssetIsOffTheMap(grid) {
        let message = 'The asset is off the map'
        return {
            message: message,
            grid: grid
        };
    }
    invalidMoveType(moveType) {
        let message = 'this type of move does not exist'
        return {
            message: message,
            moveType: moveType
        };
    }
    moreThanOneWinner() {
        let message = 'there are two winners'
        return {
            message: message,
        };
    }

}
const error = new GameError(); // class with errors as just error

class Board { // gameBoard
    constructor(yourColor) {
        this.grid = [ // map of asset
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [null, null, 0, 0, 0, 0, 0, null, null],
            [null, null, 0, 0, 0, 0, 0, null, null],
            [null, null, 0, 0, 0, 0, 0, null, null],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0]
        ];
        this.color = yourColor; // which color do you have (your place and your units)
        this.onMove = true; // you => true, enemy => false
        this.numberOfMoves = -1; //if equals to -2, game ends; if equals to -1, game does not start; if equals to 2, switch players => set this to 0
        this.moves = {}; // str "xy": num 1-12 (0 put box; 1-4 move; 5-8 catch enemy units on your place; 9-12 slider uprade or 9 fire, 10 break, 11-12 turn l-r)
        this.selected = null; // which move is selected (it is str "xy" see above)
        this.moveType = null; // type of move, 0 is for box inserting, 1 for moving, 2 for chatching, 3 for upgrading or ...
        this.direction = undefined; // 1 - 12
        this.using = undefined; // type === 2 => [x,y]; type === 3 => watcher or shooter
        this.canBeBoxPlaced = undefined; // can you place box right now?
        this.size = undefined; // size of cell
        if (this.color === 'b') { // colors of you and enemy
            this.units = {
                your: {
                    slider: [2],
                    watcher: [4, 5, 6, 7],
                    shooter: [12, 13, 14, 15]
                },
                enemy: {
                    slider: [3],
                    watcher: [8, 9, 10, 11],
                    shooter: [16, 17, 18, 19]
                }
            }
            this.enemyColor = 'lightcoral'
            this.yourColor = 'lightblue'

        } else if (this.color === 'r') {
            this.units = {
                your: {
                    slider: [3],
                    watcher: [8, 9, 10, 11],
                    shooter: [16, 17, 18, 19]
                },
                enemy: {
                    slider: [2],
                    watcher: [4, 5, 6, 7],
                    shooter: [12, 13, 14, 15]
                }
            }
            this.yourColor = 'lightcoral'
            this.enemyColor = 'lightblue'
        } else { throw error.colorDoesNotExist(this.color) }
        this.queue = [];
    }

    init() { // graphics initialization
        const minSize = Math.min(window.innerHeight, window.innerWidth) * 0.9; // sets game board size
        canvas.width = minSize;
        canvas.height = minSize;
        this.size = minSize / 9; // sets the cell size

        for (let y = 0; y < 9; y++) { // board rendering
            for (let x = 0; x < 9; x++) {
                if (!(y >= 3 && y <= 5 && ((x >= 0 && x <= 1) || (x >= 7 && x <= 8)))) { // colors enemy place
                    if (y >= 0 && y <= 2) {
                        c.fillStyle = this.enemyColor;
                    } else if (y >= 6 && y <= 8) { // colors your place
                        c.fillStyle = this.yourColor;
                    } else { // colors neutral place
                        c.fillStyle = 'white';
                    }

                    if (this.selected && Array.isArray(this.selected)) { // if you select some move [x,y]
                        const everyMovesArray = this.moves[`${this.selected[0]}${this.selected[1]}`]; // gets an array of moves

                        let movesArray = [];
                        switch (this.moveType) {
                            case 1:
                                movesArray = everyMovesArray.filter(value => value >= 1 && value <= 4);
                                break;
                            case 2:
                                movesArray = everyMovesArray.filter(value => value >= 5 && value <= 8);
                                break;
                            case 3:
                                movesArray = everyMovesArray.filter(value => value >= 9 && value <= 12);
                                break;
                            default:
                                break;
                        }
                        movesArray = movesArray.map(value => value > 4 ? value - 4 : value);
                        movesArray = movesArray.map(value => value > 4 ? value - 4 : value);
                        const directions = {
                            1: [this.selected[0], this.selected[1] - 1], // up
                            2: [this.selected[0] + 1, this.selected[1]], // right
                            3: [this.selected[0], this.selected[1] + 1], // down
                            4: [this.selected[0] - 1, this.selected[1]], // left
                        };

                        for (let i = 0; i < movesArray.length; i++) {
                            const newCoordinates = directions[movesArray[i]]; // converts the direction number to new coordinates

                            if (this.selected[0] === x && this.selected[1] === y) {
                                c.fillStyle = "yellow";
                                break; // stops rendering if the selected box is yellow
                            } else if (newCoordinates && newCoordinates[0] === x && newCoordinates[1] === y && !(this.moveType === 3 && this.grid[this.selected[1]][this.selected[0]] !== this.units.your.slider[0])) { // ... except uMove for special unit
                                c.fillStyle = "orange";
                                break; // Stops rendering if the box is orange at the new coordinates
                            }
                            if (this.grid[y][x] === 1 && ((y >= 6 && this.onMove) || (y <= 2 && !this.onMove)) && this.moveType === 2 && this.selected && this.direction && this.using === undefined) {
                                c.fillStyle = "red";
                            }
                        }
                    }

                    c.fillRect(x * this.size, y * this.size, this.size, this.size); // colors the cell
                    c.strokeRect(x * this.size, y * this.size, this.size, this.size);

                    const assetIndex = this.grid[y][x]; // sets asset index
                    if (assetIndex >= 1 && assetIndex < assets.length) {// if the asset is nothing or greater than assets.length
                        c.drawImage(assets[assetIndex], x * this.size, y * this.size, this.size, this.size); // draws assets
                    }
                }
            }
        }
        if (this.queue.length) { // queue drawing
            c.drawImage(assets[this.queue[0]], 0 * this.size, 4 * this.size, this.size, this.size);
        } else if (this.moveType) {
            switch (this.moveType) {
                case 1: // move is selected
                    c.drawImage(moveType2, 0 * this.size, 3 * this.size, this.size, this.size);
                    c.drawImage(moveType3, 1 * this.size, 3 * this.size, this.size, this.size);
                    break;
                case 2:
                    c.drawImage(moveType1, 0 * this.size, 3 * this.size, this.size, this.size);
                    c.drawImage(moveType3, 1 * this.size, 3 * this.size, this.size, this.size);
                    break;
                case 3:
                    c.drawImage(moveType1, 0 * this.size, 3 * this.size, this.size, this.size);
                    c.drawImage(moveType2, 1 * this.size, 3 * this.size, this.size, this.size);
                    if (this.grid[this.selected[1]][this.selected[0]] !== this.units.your.slider[0]) { // uMoves for special units
                        if (this.moves[`${this.selected[0]}${this.selected[1]}`].some(move => move === 9)) {
                            c.drawImage(shoot, 0 * this.size, 4 * this.size, this.size, this.size)
                        }
                        if (this.moves[`${this.selected[0]}${this.selected[1]}`].some(move => move === 10)) {
                            c.drawImage(breakUp, 1 * this.size, 4 * this.size, this.size, this.size)
                        }
                        if (this.moves[`${this.selected[0]}${this.selected[1]}`].some(move => move === 11)) {
                            c.drawImage(turnLeft, 0 * this.size, 5 * this.size, this.size, this.size)
                        }
                        if (this.moves[`${this.selected[0]}${this.selected[1]}`].some(move => move === 12)) {
                            c.drawImage(turnRight, 1 * this.size, 5 * this.size, this.size, this.size)
                        }
                    }
                    break;
                default:
                    throw error.invalidMoveType(this.moveType);
            }
        }
        if (this.selected) { // draws back btn
            c.drawImage(back, 8 * this.size, 4 * this.size, this.size, this.size);
        } else if (this.canBeBoxPlaced) { // draws box if it can be placed
            c.drawImage(assets[1], 8 * this.size, 4 * this.size, this.size, this.size);
        }
    }

    createMoves() { // creates moves => str "xy": num 1-12 (0 put box; 1-4 move; 5-8 catch enemy units on your place; 9-12 slider uprade or 9 fire, 10 break, 11-12 turn l-r)
        for (let iy = 3; iy <= 5; iy++) {
            if (this.grid[iy][0] !== null || this.grid[iy][1] !== null || this.grid[iy][7] !== null || this.grid[iy][8] !== null) {
                this.moves = { error: this.grid };
                throw error.theAssetIsOffTheMap(this.grid);
            }
        }
        this.moves = {}; // removes moves to generate them
        const checkArena = (startX, startY, width, height) => { // check arena (for upgrade)
            for (let i = startX; i < startX + width; i++) {
                for (let j = startY; j < startY + height; j++) {
                    if (this.grid[j] === undefined || this.grid[j][i] !== 1) {
                        return false;
                    }
                }
            }
            return true;
        };
        const CheckCanBeBoxPlaced = () => { // check if you can place a box
            let numberOfBoxes = 0; // the number of boxes on the map
            for (let y = 3; y < 6; y++) { // there must be no box on the neutral place
                if (this.grid[y].some(element => element === 1)) { // if it is, return false
                    return false;
                }
            }
            if (this.queue.length) { return false; } // there must be nothing in the queue
            for (let y = 0; y < 9; y++) { // there cannot be more than 15 boxes on the map
                for (let x = 0; x < 9; x++) {
                    if (this.grid[y][x] === 1) {
                        numberOfBoxes++;
                    }
                }
            }
            if (numberOfBoxes >= 15) {
                return false;
            }
            return true; // you can place a box
        }

        this.canBeBoxPlaced = CheckCanBeBoxPlaced(); // this.canBeBoxPlaced = boolean if the box can be placed
        for (let x = 0; x < 9; x++) {
            for (let y = 0; y < 9; y++) {
                if (Object.values(this.units.your).some(unit => unit.includes(this.grid[y][x])) || (y >= 6 && this.grid[y][x] === null)) { // you can only move your units
                    const possibleMoves = [];

                    let endWithNothing = false; // if there is a space
                    let moveWithBox = 0; // the number of boxes you move
                    let moveWithAssetOnYourPlace = false; // if you move with some asstes on your place
                    let moveWithSomethigElse = false; // if you move with something else

                    for (let iy = y - 1; iy >= 0 && this.grid[iy][x] !== null; iy--) { // move up
                        if (this.grid[iy][x] === 0) {
                            endWithNothing = true;
                            break;
                        } else if (this.grid[iy][x] === 1) {
                            moveWithBox++;
                        } else if ((iy >= 6 && this.onMove) || (iy <= 2 && !this.onMove)) {
                            moveWithAssetOnYourPlace = true;
                        } else {
                            moveWithSomethigElse = true;
                        }
                    }
                    if ((this.grid[y - 1] !== undefined && this.grid[y - 1][x] === 0) || (endWithNothing && (moveWithAssetOnYourPlace || moveWithBox)) || (moveWithBox >= 1 && moveWithBox <= 2 && !endWithNothing && !moveWithSomethigElse && !moveWithAssetOnYourPlace)) {
                        possibleMoves.push(1);
                    }

                    endWithNothing = false;
                    moveWithBox = 0;
                    moveWithAssetOnYourPlace = false;
                    moveWithSomethigElse = false;

                    for (let ix = x + 1; ix < 9 && this.grid[y][ix] !== null; ix++) { // move right
                        if (this.grid[y][ix] === 0) {
                            endWithNothing = true;
                            break;
                        } else if (this.grid[y][ix] === 1) {
                            moveWithBox++;
                        } else if ((y >= 6 && this.onMove) || (y <= 2 && !this.onMove)) {
                            moveWithAssetOnYourPlace = true;
                        } else {
                            moveWithSomethigElse = true;
                        }
                    }
                    if ((this.grid[y] !== undefined && this.grid[y][x + 1] === 0) || (endWithNothing && (moveWithAssetOnYourPlace || moveWithBox)) || (moveWithBox >= 1 && moveWithBox <= 2 && !endWithNothing && !moveWithSomethigElse && !moveWithAssetOnYourPlace)) {
                        possibleMoves.push(2);
                    }

                    endWithNothing = false;
                    moveWithBox = 0;
                    moveWithAssetOnYourPlace = false;
                    moveWithSomethigElse = false;

                    for (let iy = y + 1; iy < 9 && this.grid[iy][x] !== null; iy++) { // move down
                        if (this.grid[iy][x] === 0) {
                            endWithNothing = true;
                            break;
                        } else if (this.grid[iy][x] === 1) {
                            moveWithBox++;
                        } else if ((iy >= 6 && this.onMove) || (iy <= 2 && !this.onMove)) {
                            moveWithAssetOnYourPlace = true;
                        } else {
                            moveWithSomethigElse = true;
                        }
                    }
                    if ((this.grid[y + 1] !== undefined && this.grid[y + 1][x] === 0) || (endWithNothing && (moveWithAssetOnYourPlace || moveWithBox)) || (moveWithBox >= 1 && moveWithBox <= 2 && !endWithNothing && !moveWithSomethigElse && !moveWithAssetOnYourPlace)) {
                        possibleMoves.push(3);
                    }

                    endWithNothing = false;
                    moveWithBox = 0;
                    moveWithAssetOnYourPlace = false;
                    moveWithSomethigElse = false;

                    for (let ix = x - 1; ix >= 0 && this.grid[y][ix] !== null; ix--) { // move left
                        if (this.grid[y][ix] === 0) {
                            endWithNothing = true;
                            break;
                        } else if (this.grid[y][ix] === 1) {
                            moveWithBox++;
                        } else if ((y >= 6 && this.onMove) || (y <= 2 && !this.onMove)) {
                            moveWithAssetOnYourPlace = true;
                        } else {
                            moveWithSomethigElse = true;
                        }
                    }
                    if ((this.grid[y] !== undefined && this.grid[y][x - 1] === 0) || (endWithNothing && (moveWithAssetOnYourPlace || moveWithBox)) || (moveWithBox >= 1 && moveWithBox <= 2 && !endWithNothing && !moveWithSomethigElse && !moveWithAssetOnYourPlace)) {
                        possibleMoves.push(4);
                    }

                    if (this.grid[y - 1] !== undefined && Object.values(this.units.enemy).some(enemyValueArray => enemyValueArray.includes(this.grid[y - 1][x])) && ((y >= 7 && this.onMove) || (y <= 3 && !this.onMove))) { // catch up 
                        possibleMoves.push(5);
                    }

                    if (Object.values(this.units.enemy).some(enemyValueArray => enemyValueArray.includes(this.grid[y][x + 1])) && ((y >= 6 && this.onMove) || (y <= 2 && !this.onMove))) { // catch right
                        possibleMoves.push(6);
                    }

                    if (this.grid[y + 1] !== undefined && Object.values(this.units.enemy).some(enemyValueArray => enemyValueArray.includes(this.grid[y + 1][x])) && ((y >= 5 && this.onMove) || (y <= 1 && !this.onMove))) { // catch down
                        possibleMoves.push(7);
                    }

                    if (Object.values(this.units.enemy).some(enemyValueArray => enemyValueArray.includes(this.grid[y][x - 1])) && ((y >= 6 && this.onMove) || (y <= 2 && !this.onMove))) { // catch left
                        possibleMoves.push(8);
                    }

                    const combineUpgrades = (watcher, shooter) => {
                        if (!watcher && !shooter) {
                            return 0;
                        } else if (watcher && !shooter) {
                            return 1;
                        } else if (!watcher && shooter) {
                            return 2;
                        } else {
                            return 3;
                        }
                    };

                    const uMoves = []; // upgrade moves

                    if (this.grid[y][x] === this.units.your.slider[0]) { // if is your slider
                        if (checkArena(x, y - 3, 1, 3) || checkArena(x - 1, y - 1, 3, 1)) {
                            possibleMoves.push(9);
                        }
                        if (checkArena(x + 1, y, 3, 1) || checkArena(x + 1, y - 1, 1, 3)) {
                            possibleMoves.push(10);
                        }
                        if (checkArena(x, y + 1, 1, 3) || checkArena(x - 1, y + 1, 3, 1)) {
                            possibleMoves.push(11);
                        }
                        if (checkArena(x - 3, y, 3, 1) || checkArena(x - 1, y - 1, 1, 3)) {
                            possibleMoves.push(12);
                        }

                        uMoves.push(combineUpgrades(checkArena(x - 1, y - 1, 3, 1), checkArena(x, y - 3, 1, 3))); // uMoves up
                        uMoves.push(combineUpgrades(checkArena(x + 1, y - 1, 1, 3), checkArena(x + 1, y, 3, 1))); // uMoves right
                        uMoves.push(combineUpgrades(checkArena(x - 1, y + 1, 3, 1), checkArena(x, y + 1, 1, 3))); // uMoves down
                        uMoves.push(combineUpgrades(checkArena(x - 1, y - 1, 1, 3), checkArena(x - 3, y, 3, 1))); // uMoves left
                    } else { // your watcher or shooter
                        let turn;
                        if (this.units.your.watcher.some(unit => unit === this.grid[y][x])) {
                            turn = this.grid[y][x] - this.units.your.watcher[0];
                        } else if (this.units.your.shooter.some(unit => unit === this.grid[y][x])) {
                            turn = this.grid[y][x] - this.units.your.shooter[0];
                        }

                        switch (turn) {
                            case 0:
                                if (this.grid[y + 1] && this.grid[y + 1][x] === 1) { // shoot up
                                    possibleMoves.push(9);
                                }
                                break;
                            case 1:
                                if (this.grid[y][x - 1] === 1) { // shoot right
                                    possibleMoves.push(9);
                                }
                                break;
                            case 2:
                                if (this.grid[y - 1] && this.grid[y - 1][x] === 1) { // shoot down
                                    possibleMoves.push(9);
                                }
                                break;
                            case 3:
                                if (this.grid[y][x + 1] === 1) { // shoot left
                                    possibleMoves.push(9);
                                }
                                break;
                            default:
                                break;
                        }
                        possibleMoves.push(10); // it can always break
                        possibleMoves.push(11); // it can always turn left
                        possibleMoves.push(12); // it can always turn right
                    }

                    if (possibleMoves !== undefined && possibleMoves.length > 0) { // if any moves need to be added
                        this.moves[`${x}${y}`] = possibleMoves; // adds them
                    }
                    if (uMoves !== undefined && uMoves.some(element => element !== 0)) {// if any uMoves need to be added
                        this.moves[`u${x}${y}`] = uMoves; // adds them
                    }
                }
            }
        }
    }
    move(pos, act, using = undefined) { // makes moves => [x,y], num 1-12 (0 put box; 1-4 move; 5-8 catch enemy units on your place; 9-12 slider uprade or 9 fire, 10 break, 11-12 turn l-r)
        const x = pos[0];
        const y = pos[1];
        let endedBy0 = false;
        let finalPosition = undefined;
        const breakUp = (unit) => {
            if (Object.values(this.units.your).some(units => units.includes(unit))) { // your units
                return this.units.your.slider[0];
            } else if (Object.values(this.units.enemy).some(units => units.includes(unit))) { // enemy units
                return this.units.enemy.slider[0];
            }
        }
        switch (act) {
            case 0: // box inserting
                this.grid[y][x] = 1;
                finalPosition = null;
                break;
            case 1: // move up
                let iyUp = y;
                finalPosition = `${x}${y - 1}`;

                while (iyUp > 0 && this.grid[iyUp][x] !== null) { // until it finds a wall
                    iyUp--;
                    if (this.grid[iyUp][x] === 0) { // is it ended by 0 ?
                        endedBy0 = true;
                        break;
                    }
                }
                if (endedBy0) { // moves or moves with assets
                    for (iyUp; iyUp < y; iyUp++) { // moves all assets in a row
                        this.grid[iyUp][x] = this.grid[iyUp + 1][x];
                    }
                    this.grid[iyUp][x] = 0;
                } else { // swapps your unit and box
                    [this.grid[y][x], this.grid[y - 1][x]] = [this.grid[y - 1][x], this.grid[y][x]];
                }

                break;

            case 2: // move right
                let ixRight = x;
                finalPosition = `${x + 1}${y}`;

                while (ixRight <= 8 && this.grid[y][ixRight] !== null) { // until it finds a wall
                    ixRight++;
                    if (this.grid[y][ixRight] === 0) { // is it ended by 0 ?
                        endedBy0 = true;
                        break;
                    }
                }
                if (endedBy0) { // moves or moves with assets
                    for (ixRight; ixRight > x; ixRight--) { // moves all assets in a column
                        this.grid[y][ixRight] = this.grid[y][ixRight - 1];
                    }
                    this.grid[y][ixRight] = 0;
                } else { // swapps your unit and box
                    [this.grid[y][x], this.grid[y][x + 1]] = [this.grid[y][x + 1], this.grid[y][x]];
                }

                break;

            case 3: // move down
                let iyDown = y;
                finalPosition = `${x}${y + 1}`;

                while (iyDown <= 8 && this.grid[iyDown][x] !== null) { // until it finds a wall
                    iyDown++;
                    if (this.grid[iyDown] !== undefined && this.grid[iyDown][x] === 0) { // is it ended by 0 ? (iyDown can be 9)
                        endedBy0 = true;
                        break;
                    }
                }
                if (endedBy0) { // moves or moves with assets
                    for (iyDown; iyDown > y; iyDown--) { // moves all assets in a column
                        this.grid[iyDown][x] = this.grid[iyDown - 1][x];
                    }
                    this.grid[iyDown][x] = 0;
                } else { // swapps your unit and box
                    [this.grid[y][x], this.grid[y + 1][x]] = [this.grid[y + 1][x], this.grid[y][x]];
                }

                break;

            case 4: // move left
                let ixLeft = x;
                finalPosition = `${x - 1}${y}`;

                while (ixLeft > 0 && this.grid[y][ixLeft] !== null) { // until it finds a wall
                    ixLeft--;
                    if (this.grid[y][ixLeft] === 0) { // is it ended by 0 ?
                        endedBy0 = true;
                        break;
                    }
                }
                if (endedBy0) { // moves or moves with assets
                    for (ixLeft; ixLeft < x; ixLeft++) { // moves all assets in a row
                        this.grid[y][ixLeft] = this.grid[y][ixLeft + 1];
                    }
                    this.grid[y][ixLeft] = 0;
                } else { // swapps your unit and box
                    [this.grid[y][x], this.grid[y][x - 1]] = [this.grid[y][x - 1], this.grid[y][x]];
                }

                break;


            case 5: // catch up
                finalPosition = `${x}${y - 1}`;
                this.grid[using[1]][using[0]] = 0; // remove the box (cost of this move)

                this.queue.push(breakUp(this.grid[y - 1][x])); // captured unit is inserted to queue
                this.grid[y - 1][x] = this.grid[y][x]; // moves with your units
                this.grid[y][x] = 0;
                break;
            case 6: // catch right
                finalPosition = `${x + 1}${y}`;
                this.grid[using[1]][using[0]] = 0; // remove the box (cost of this move)

                this.queue.push(breakUp(this.grid[y][x + 1])); // captured unit is inserted to queue
                this.grid[y][x + 1] = this.grid[y][x]; // moves with your units
                this.grid[y][x] = 0;
                break;
            case 7: // catch down
                finalPosition = `${x}${y + 1}`;
                this.grid[using[1]][using[0]] = 0; // remove the box (cost of this move)

                this.queue.push(breakUp(this.grid[y + 1][x])); // captured unit is inserted to queue
                this.grid[y + 1][x] = this.grid[y][x]; // moves with your units
                this.grid[y][x] = 0;
                break;
            case 8: // catch left
                finalPosition = `${x - 1}${y}`;
                this.grid[using[1]][using[0]] = 0; // remove the box (cost of this move)

                this.queue.push(breakUp(this.grid[y][x - 1])); // captured unit is inserted to queue
                this.grid[y][x - 1] = this.grid[y][x]; // moves with your units
                this.grid[y][x] = 0;
                break;

            default:
                break;
        }
        const updateRectangle = (startY, startX, height, width, addToQueue) => {
            for (let i = startY; i < startY + height; i++) {
                for (let j = startX; j < startX + width; j++) {
                    if (addToQueue) {
                        if (this.grid[i] && Object.values(this.units.your).some(arr => arr.includes(this.grid[i][j]))) { // break your unit
                            this.queue.push(this.units.your.slider[0])
                        } else if (this.grid[i] && Object.values(this.units.enemy).some(arr => arr.includes(this.grid[i][j]))) { // break enemy unit
                            this.queue.push(this.units.enemy.slider[0])
                        } else if (this.grid[i] && this.grid[i][j] !== 0) {
                            this.queue.push(this.grid[i][j])
                        }
                    }

                    this.grid[i][j] = 0;
                }
            }
        }

        if (this.grid[y][x] === this.units.your.slider[0] && this.moves[`u${x}${y}`][act - 9] === 1) { // upgrades of slider to watcher
            switch (act) {
                case 9: // upgrade up
                    updateRectangle(y - 1, x - 1, 1, 3, false);
                    this.grid[y][x] = this.units.your.watcher[0];
                    break;
                case 10: // upgrade right
                    updateRectangle(y - 1, x + 1, 3, 1, false);
                    this.grid[y][x] = this.units.your.watcher[1];
                    break;
                case 11: // upgrade down
                    updateRectangle(y + 1, x - 1, 1, 3, false);
                    this.grid[y][x] = this.units.your.watcher[2];
                    break;
                case 12: // upgrade left
                    updateRectangle(y - 1, x - 1, 3, 1, false);
                    this.grid[y][x] = this.units.your.watcher[3];
                    break;
                default:
                    break;
            }
        } else if (this.grid[y][x] === this.units.your.slider[0] && this.moves[`u${x}${y}`][act - 9] === 2) {// upgrades of slider to shooter
            switch (act) {
                case 9: // upgrade up
                    updateRectangle(y - 3, x, 3, 1, false);
                    this.grid[y][x] = this.units.your.shooter[0];
                    break;
                case 10: // upgrade right
                    updateRectangle(y, x + 1, 1, 3, false);
                    this.grid[y][x] = this.units.your.shooter[1];
                    break;
                case 11: // upgrade down
                    updateRectangle(y + 1, x, 3, 1, false);
                    this.grid[y][x] = this.units.your.shooter[2];
                    break;
                case 12: // upgrade left
                    updateRectangle(y, x - 3, 1, 3, false);
                    this.grid[y][x] = this.units.your.shooter[3];
                    break;
                default:
                    break;
            }
        } else if (this.units.your.watcher.some(unit => unit === this.grid[y][x]) && act === 9) { // watchers shoot
            switch (this.grid[y][x] - this.units.your.watcher[0]) {
                case 0: // shoot up
                    updateRectangle(y - 1, x - 1, 1, 3, true);
                    this.grid[y + 1][x] = 0;
                    break;
                case 1: // shoot right
                    updateRectangle(y - 1, x + 1, 3, 1, true);
                    this.grid[y][x - 1] = 0;
                    break;
                case 2: // shoot down
                    updateRectangle(y + 1, x - 1, 1, 3, true);
                    this.grid[y - 1][x] = 0;
                    break;
                case 3: // shoot left
                    updateRectangle(y - 1, x - 1, 3, 1, true);
                    this.grid[y][x + 1] = 0;
                    break;
                default:
                    break;
            }
        } else if (this.units.your.shooter.some(unit => unit === this.grid[y][x]) && act === 9) { // shooterss shoot

            switch (this.grid[y][x] - this.units.your.shooter[0]) {
                case 0: // shoot up
                    updateRectangle(y - 3, x, 3, 1, true);
                    this.grid[y + 1][x] = 0;
                    break;
                case 1: // shoot right
                    updateRectangle(y, x + 1, 1, 3, true);
                    this.grid[y][x - 1] = 0;
                    break;
                case 2: // shoot down
                    updateRectangle(y + 1, x, 3, 1, true);
                    this.grid[y - 1][x] = 0;
                    break;
                case 3: // shoot left
                    updateRectangle(y, x - 3, 1, 3, true);
                    this.grid[y][x + 1] = 0;
                    break;
                default:
                    break;
            }
        } else if (act === 10) { // break
            this.grid[y][x] = this.units.your.slider[0];
        } else if (act === 11) { // turn left
            if (this.units.your.watcher.some(unit => unit === this.grid[y][x])) { // turn left watcher
                this.grid[y][x] = this.grid[y][x] - 1 < Math.min(...this.units.your.watcher) ? this.units.your.watcher[this.units.your.watcher.length - 1] : this.grid[y][x] - 1;
            } else if (this.units.your.shooter.some(unit => unit === this.grid[y][x])) { // turn left shooter
                this.grid[y][x] = this.grid[y][x] - 1 < Math.min(...this.units.your.shooter) ? this.units.your.shooter[this.units.your.shooter.length - 1] : this.grid[y][x] - 1;
            }
        } else if (act === 12) { // turn right
            if (this.units.your.watcher.some(unit => unit === this.grid[y][x])) { // turn right watcher
                this.grid[y][x] = this.grid[y][x] + 1 > Math.max(...this.units.your.watcher) ? this.units.your.watcher[0] : this.grid[y][x] + 1;
            } else if (this.units.your.shooter.some(unit => unit === this.grid[y][x])) { // turn right shooter
                this.grid[y][x] = this.grid[y][x] + 1 > Math.max(...this.units.your.shooter) ? this.units.your.shooter[0] : this.grid[y][x] + 1;
            }
        }


        this.createMoves();
        if (finalPosition === undefined) { // you can not move with same unit in same time
            finalPosition = `${x}${y}`
        }
        if (finalPosition) {
            delete this.moves[finalPosition];
        }

        this.unselect();
        const checkBoxesWin = () => { // chcek how many boxes player has
            const counts = [0, 0];

            // Prochází prvními třemi řádky
            for (let i = 0; i < 3; i++) {
                for (let j = 0; j < this.grid[i].length; j++) {
                    if (this.grid[i][j] === 1) {
                        counts[0]++;
                    }
                }
            }

            // Prochází posledními třemi řádky
            for (let i = this.grid.length - 3; i < this.grid.length; i++) {
                for (let j = 0; j < this.grid[i].length; j++) {
                    if (this.grid[i][j] === 1) {
                        counts[1]++;
                    }
                }
            }

            if (counts[0] >= 9 && counts[1] >= 9){
                throw error.moreThanOneWinner();
            } else if (counts[0] >= 9){
                return false;
            } else if (counts[1] >= 9){
                return true;
            } else {
                return null;
            }
        }

        if (Object.keys(this.moves).length === 0 && !this.canBeBoxPlaced) {
            this.winner(!this.onMove)
        } else if (checkBoxesWin() !== null) {
            this.winner(checkBoxesWin())
        }
        this.numberOfMoves++;
        if (this.queue.length === 0 && this.numberOfMoves !==-2 && this.numberOfMoves >= 2) { // switch players // TODO error po druhém tahu vkládání na cizí půlku (units se přehodí)
            this.switchPlayers();
        } 
        this.init();

    }
    click(cx, cy) { // processes the click
        let x = Math.floor(cx / this.size); // sets x (number from 0 to 8)
        let y = Math.floor(cy / this.size); // sets y (number from 0 to 8)

        if (this.numberOfMoves === -2) {
            window.location.reload();
            return
        }

        if (this.numberOfMoves === -1) { // if game does not start
            const canBeUnitPlace = (isYour) => {
                let count = 0;
                const unit = isYour ? this.units.your.slider[0] : this.units.enemy.slider[0];

                for (let y = 0 + (isYour * 6); y < 3 + (isYour * 6); y++) {
                    for (let x = 0; x < 9; x++) {
                        if (this.grid[y][x] === unit) {
                            count++;
                        }
                    }
                }
                return count < 5;
            }

            if (y <= 2 && canBeUnitPlace(false)) {
                this.grid[y][x] = this.units.enemy.slider[0];
            } else if (y >= 6 && canBeUnitPlace(true)) {
                this.grid[y][x] = this.units.your.slider[0];
            }
            if (!canBeUnitPlace(true) && !canBeUnitPlace(false)) {
                this.numberOfMoves = 1;
                this.createMoves();
            }
        } else if (this.queue.length) { // if is something in queue
            if (((y >= 6 && y <= 8 && this.onMove) || (y >= 0 && y <= 2 && !this.onMove)) && this.grid[y][x] === 0 && this.queue[0] > 0) { // if you can insert it
                this.grid[y][x] = this.queue[0]; // inserts it
                this.queue.shift(); // removes it from the queu
                if (this.numberOfMoves >= 2){ // switch players
                    this.switchPlayers();
                }
                this.createMoves(); // makes moves
            } else {
                throw error.cannotInsertUnit(this.queue); // something is broken
            }
        } else if (!this.selected) { // normal move (nothing is selected)
            if (this.moves[`${x}${y}`] !== undefined) { // if this move exist
                this.selected = [x, y] // you select it
                this.moveType = 1; // default type of move
            }
            else if (x === 8 && y == 4 && this.canBeBoxPlaced) { // if you want to place a box
                this.selected = 1; // you select this move (placing a box)
            } else {
                throw error.assetCannotBeMoved(this.grid[y][x]); // something is broken

            }
        } else if (x === 8 && y == 4) { // back
            this.unselect();
        } else if (x >= 0 && x <= 1 && y == 3) { // change of moveType
            switch (this.moveType) {
                case 1: // move is selected
                    if (x === 0) {
                        this.moveType = 2;
                    } else {
                        this.moveType = 3;
                    }
                    break;
                case 2:
                    if (x === 0) {
                        this.moveType = 1;
                    } else {
                        this.moveType = 3;
                    }
                    break;
                case 3:
                    if (x === 0) {
                        this.moveType = 1;
                    } else {
                        this.moveType = 2;
                    }
                    break;
                default:
                    throw error.invalidMoveType(this.moveType);
            }
        } else if ((x >= 0 && x <= 1) && (y >= 4 && y <= 5) && this.units.your.slider[0] !== this.grid[y][x]) { // special unit uMove
            if (x === 0 && y === 4) { // shoot
                this.move(this.selected, 9);
            } else if (x === 1 && y === 4) { // break
                this.move(this.selected, 10);
            } else if (x === 0 && y === 5) { // turn left
                this.move(this.selected, 11);
            } else if (x === 1 && y === 5) { // turn right
                this.move(this.selected, 12);
            }
        } else if (this.selected && this.direction) { // adds using
            if (this.moveType === 2 && this.grid[y][x] === 1 && ((y >= 6 && this.onMove) || (y <= 2 && !this.onMove))) {
                this.using = [x, y];
                this.move(this.selected, this.direction, this.using)

                // TODO přidej movetype 3 situace 3 (možnost vylepšení na oba)
            }
        } else { // moves with selected unit (or box) 
            if (this.selected === 1 && x >= 2 && x <= 6 && y >= 3 && y <= 5 && this.grid[y][x] === 0) { // moves with selected (box)
                this.move([x, y], 0)
            } else { // moves with selected unit
                if (x === this.selected[0] && y === this.selected[1] - 1) {
                    this.direction = 1; // up
                } else if (x === this.selected[0] + 1 && y === this.selected[1]) {
                    this.direction = 2; // right
                } else if (x === this.selected[0] && y === this.selected[1] + 1) {
                    this.direction = 3; // down
                } else if (x === this.selected[0] - 1 && y === this.selected[1]) {
                    this.direction = 4; // left
                } else {
                    throw error.invalidDirection(this.selected, [x, y]); // this direction does not exist
                }
                switch (this.moveType) { // corrects the move based on its type
                    case 1: // move
                        if (this.moves[`${this.selected[0]}${this.selected[1]}`].some(move => move === this.direction)) { // if this direction is valid move
                            this.move(this.selected, this.direction)
                        }
                        break
                    case 2: // catch (it needs using (which box))
                        this.direction += 4;
                        break;
                    case 3: // uprade or ...
                        this.direction += 8;
                        if ((this.moves[`u${this.selected[0]}${this.selected[1]}`] && (this.moves[`u${this.selected[0]}${this.selected[1]}`][this.direction - 9] === 1 || this.moves[`u${this.selected[0]}${this.selected[1]}`][this.direction - 9] === 2))) { // if upgrade does not need using
                            this.move(this.selected, this.direction);
                        } else if (this.units.your.slider[0] !== this.grid[this.selected[1]][this.selected[0]] && this.moves[`${this.selected[0]}${this.selected[1]}`].some(move => move === this.direction)) { // special units moves
                            this.move(this.selected, this.direction)
                        }
                        break;
                }
            }
        }

        this.init(); // graphical initialization
    }
    unselect() {
        this.selected = null; // sets nothing is selected
        this.moveType = null; // sets no type of move
        this.using = undefined; // sets no using
        this.direction = undefined; // sets no direction
        this.turn = undefined; // sets turn to undefinded
    }
    winner(isYou) { // who is winner
        this.numberOfMoves = -2;
        if (isYou) {
            this.yourColor = "#ffd900"
            this.enemyColor = "#b6b2a0"
        } else {
            this.yourColor = "#b6b2a0"
            this.enemyColor = "#ffd900"
        }
    }
    switchPlayers () {
        this.onMove = !this.onMove;
        this.numberOfMoves = 0;
        if (this.onMove) { // set which units are your
            this.units = {
                your: {
                    slider: [2],
                    watcher: [4, 5, 6, 7],
                    shooter: [12, 13, 14, 15]
                },
                enemy: {
                    slider: [3],
                    watcher: [8, 9, 10, 11],
                    shooter: [16, 17, 18, 19]
                }
            }
        } else {
            this.units = {
                your: {
                    slider: [3],
                    watcher: [8, 9, 10, 11],
                    shooter: [16, 17, 18, 19]
                },
                enemy: {
                    slider: [2],
                    watcher: [4, 5, 6, 7],
                    shooter: [12, 13, 14, 15]
                }
            }
        }
        this.createMoves();
    }
}



canvas.addEventListener("click", (e) => { // captures the click
    gameBoard.click(e.offsetX, e.offsetY) // processes the click
})
window.addEventListener("resize", () => { // captures the resize
    gameBoard.init(); // processes the resize (using graphical initialization)
});

const gameBoard = new Board('b'); // create a game board
gameBoard.init(); // first graphical initialization
