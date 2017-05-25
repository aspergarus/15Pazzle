let state = {
	blocked: false,
	matrix: [[],[],[],[]],
	emptyPos: {},
	touch: {},
	startMove: false,
	endMove: false
};

const EMPTY_VAL = 16;
const NUMBER_ELEMENTS = 16;
const NUMBER_IN_ROW = Math.sqrt(NUMBER_ELEMENTS);

const SIZE_EL = 130;
const MARGIN_EL = 16;

function init() {
	let elements = document.getElementsByClassName('el');

	// Add click handlers to each element
	for (let i = 0; i < NUMBER_ELEMENTS; i++) {
		elements[i].addEventListener('click', elementClickHandler);
	}

	let count = 0;
	for (let i = 0; i < NUMBER_IN_ROW; i++) {
		for (let j = 0; j < NUMBER_IN_ROW; j++) {
			let top = MARGIN_EL * (i + 1) + SIZE_EL * i;
			let left = MARGIN_EL * (j + 1) + SIZE_EL * j;

			state.matrix[i][j] = elements[count];
			state.matrix[i][j].setAttribute("style", `top: ${top}px; left: ${left}px;`);

			count++;
		}
	}

	// Add keypress handler to document
	document.addEventListener('keyup', keyUpHandler);

	// Add handlers for mobile devices
	document.addEventListener("touchstart", handleMoveStart);
	document.addEventListener("touchend", handleMoveEnd);

	document.addEventListener("touchmove", function(e) {
		e.preventDefault();
	}, {passive: false});
}

function startNewGame() {
	let vals = Array(NUMBER_ELEMENTS).fill(0).map((el, i) => i + 1);
	do {
		vals.sort(() => Math.floor(Math.random() * 3) - 1);
	} while (checkStartMatrix(vals));

	let emptyPosRaw = vals.indexOf(EMPTY_VAL);
	state.emptyPos = {
		x: Math.floor(emptyPosRaw / 4),
		y: emptyPosRaw % 4
	};

	for (let i = 0; i < NUMBER_ELEMENTS; i++) {
		let el = state.matrix[Math.floor(i / 4)][i % 4];
		el.innerText = vals[i];

		if (vals[i] == EMPTY_VAL) {
			el.classList.add('empty');
		}
		else {
			if (el.classList.contains('empty')) {
				el.classList.remove('empty');
			}
		}
	}
}

document.addEventListener("DOMContentLoaded", function() {
	init();
	startNewGame();
});


function elementClickHandler(e) {
	if (state.blocked) {
		return;
	}
	state.blocked = true;

	if (!validateNeighbor(e.target)) {
		state.blocked = false;
		return;	
	}

	// User clicked on the neighbor			
	moveElementByTarget(e.target);

	reactOnVictory();
}

function validateNeighbor(target) {
	let variants = [[0, -1], [0, 1], [-1, 0], [1, 0]];

	for (let variant of variants) {
		let res = [];
		let x = state.emptyPos.x + variant[0];
		let y = state.emptyPos.y + variant[1];
		if (x >= 0 && x <= 3 && y >= 0 && y <= 3) {
			if (state.matrix[x][y] == target) {
				return true;
			}
		}
	}
	return false;
}

function keyUpHandler(e) {
	if (state.blocked) {
		return;
	}
	state.blocked = true;

	const keyName = event.key;

	handleDirection(keyName);
}

function handleDirection(direction) {
	const mapping = {
		ArrowLeft: 	[0 , -1],
		ArrowRight:	[0 ,  1],
		ArrowUp: 	[-1,  0],
		ArrowDown:  [1 ,  0]
	};

	if (!mapping[direction]) {
		state.blocked = false;
		return;
	}

	let neighbor = findNeighbor(mapping[direction]);
	if (neighbor != null) {
		moveElementByCoords(neighbor);
	}

	reactOnVictory();
}

function handleMoveStart(e) {
	if (state.blocked) {
		return;
	}
	state.blocked = true;

	let t = e.changedTouches[0];
	state.touch.x = t.pageX;
	state.touch.y = t.pageY;
}

function handleMoveEnd(e) {
	let t = e.changedTouches[0];

	let dx = t.pageX - state.touch.x;
	let dy = t.pageY - state.touch.y;

	if (Math.abs(dx) <= 2 * t.radiusX && Math.abs(dy) <= 2 * t.radiusY) {
		console.log('touch cancel');
		state.blocked = false;
		return;
	}

	state.touch = {};
	let direction = '';

	if (Math.abs(dx) > Math.abs(dy)) {
		if (dx > 0) {
			direction = 'ArrowRight';
		}
		if (dx < 0) {
			direction = 'ArrowLeft';
		}
	}
	if (Math.abs(dx) < Math.abs(dy)) {
		if (dy > 0) {
			direction = 'ArrowDown';
		}
		if (dy < 0) {
			direction = 'ArrowUp';
		}
	}

	state.blocked = false;
	if (direction) {
		handleDirection(direction);
	}
}

function findNeighbor(variant) {
	let x = state.emptyPos.x + variant[0];
	let y = state.emptyPos.y + variant[1];
	if (x >= 0 && x <= 3 && y >= 0 && y <= 3) {
		return {x, y};
	}
	return null;
}

function moveElementByTarget(target) {
	for (let x = 0; x < NUMBER_IN_ROW; x++) {
		for (let y = 0; y < NUMBER_IN_ROW; y++) {
			if (state.matrix[x][y] == target) {
				moveElementByCoords({x, y});
				return;
			}
		}
	}
}

function moveElementByCoords({x, y}) {
	let movedEl = state.matrix[x][y];
	let emptyEl = state.matrix[state.emptyPos.x][state.emptyPos.y];

	let movedLeft = movedEl.style.left;
	let movedTop = movedEl.style.top;
	let emptyLeft = emptyEl.style.left;
	let emptyTop = emptyEl.style.top;

	debugger;

	movedEl.style.left = emptyLeft;
	movedEl.style.top = emptyTop;
	emptyEl.style.left = movedLeft;
	emptyEl.style.top = movedTop;

	movedEl.classList.add("move-animation");
	emptyEl.classList.add("empty-animation");
	setTimeout(function() {
		movedEl.classList.remove("move-animation");
		emptyEl.classList.remove("empty-animation");
	}, 500);

	// Update matrix
	state.matrix[x][y] = emptyEl;
	state.matrix[state.emptyPos.x][state.emptyPos.y] = movedEl;

	// Update position of empty cell.
	state.emptyPos = {x, y};
}

function checkWin(matrix) {
	let prev = 0;
	for (let row of matrix) {
		for (let elDOM of row) {
			let el = +elDOM.textContent;
			if (el == EMPTY_VAL) continue;
			if (el - prev != 1) return false;
			prev = el;
		}
	}
	return true;
}

function reactOnVictory() {
	setTimeout(function () {
		state.blocked = false;
		if (checkWin(state.matrix)) {
			alert('You have won this game. Congratulations!');
			startNewGame();
			return;
		}
	}, 10);
}

// Tells us whether game can be complited or not.
// @see http://mathworld.wolfram.com/15Puzzle.html
function checkStartMatrix(vals) {
	let N = 0;
	let e = 0;
	for (let i = 0; i < vals.length; i++) {
		let val = vals[i];
		let ni = vals.slice(i + 1).filter((e) => e > val).length;
		N += ni;

		if (val == EMPTY_VAL) {
			N += Math.floor(i / 4) + 1;
		}
	}

	return N % 2 == 0;
}

/**
 * Tests
 */
function tests() {
	var goodMatrix = [[1,2],[3,4,16,5]];
	var badMatrix = [[1,2],[4,3,16,5]];

	console.log(checkWin(goodMatrix));
	console.log(checkWin(badMatrix));

	var badGame = [1,2,3,4,5,6,7,8,9,10,11,12,13,15,14,EMPTY_VAL];
	var goodGame = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,EMPTY_VAL];
	console.log(checkStartMatrix(goodGame));
	console.log(checkStartMatrix(badGame));	
}
