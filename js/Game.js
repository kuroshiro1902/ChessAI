
var STACK_SIZE = 100; // maximum size of undo stack
var undo_stack = [];

var globalSum = 0; // always from black's perspective. Negative for white's perspective.
var board = null;
var $board = $('#myBoard');

var whiteSquareGrey = '#a9a9a9';
var blackSquareGrey = '#696969';

var squareClass = 'square-55d63';
var squareToHighlight = null;
var colorToHighlight = null;
var positionCount;
var timer = null;

var config = {
  draggable: true,
  position: 'start',
  onDragStart: onDragStart,
  onDrop: onDrop,
  onMouseoutSquare: onMouseoutSquare,
  onMouseoverSquare: onMouseoverSquare,
  onSnapEnd: onSnapEnd,
};

board = new Chessboard('myBoard', config);
var chess = Chess();


function checkStatus(color) {
  if (chess.in_checkmate()) {
    $('#status').html(`<b>Checkmate!</b> Oops, <b>${color}</b> lost.`);
  } else if (chess.insufficient_material()) {
    $('#status').html(`It's a <b>draw!</b> (Insufficient Material)`);
  } else if (chess.in_threefold_repetition()) {
    $('#status').html(`It's a <b>draw!</b> (Threefold Repetition)`);
  } else if (chess.in_stalemate()) {
    $('#status').html(`It's a <b>draw!</b> (Stalemate)`);
  } else if (chess.in_draw()) {
    $('#status').html(`It's a <b>draw!</b> (50-move Rule)`);
  } else if (chess.in_check()) {
    $('#status').html(`Oops, <b>${color}</b> is in <b>check!</b>`);
    return false;
  } else {
    $('#status').html(`No check, checkmate, or draw.`);
    return false;
  }
  return true;
}

function updateAdvantage() {
  if (globalSum > 0) {
    $('#advantageColor').text('Black');
    $('#advantageNumber').text(globalSum);
  } else if (globalSum < 0) {
    $('#advantageColor').text('White');
    $('#advantageNumber').text(-globalSum);
  } else {
    $('#advantageColor').text('Neither side');
    $('#advantageNumber').text(globalSum);
  }
  $('#advantageBar').attr({
    'aria-valuenow': `${-globalSum}`,
    style: `width: ${((-globalSum + 2000) / 4000) * 100}%`,
  });
}

/*
* Calculates the best legal move for the given color.
*/
function getBestMove(chess, color, currSum) {
  positionCount = 0;

  if (color === 'b') {
    var depth = parseInt($('#search-depth').find(':selected').text());
  } else {
    var depth = parseInt($('#search-depth-white').find(':selected').text());
  }

  var d = new Date().getTime();
  var [bestMove, bestMoveValue] = minimax(
    chess,
    depth,
    Number.NEGATIVE_INFINITY,
    Number.POSITIVE_INFINITY,
    true,
    currSum,
    color
  );
  var d2 = new Date().getTime();
  var moveTime = d2 - d;
  var positionsPerS = (positionCount * 1000) / moveTime;

  $('#position-count').text(positionCount);
  $('#time').text(moveTime / 1000);
  $('#positions-per-s').text(Math.round(positionsPerS));

  return [bestMove, bestMoveValue];
}
/*
* Makes the best legal move for the given color.
*/
function makeBestMove(color) {
  if (color === 'b') {
    var move = getBestMove(chess, color, globalSum)[0];
  } else {
    var move = getBestMove(chess, color, -globalSum)[0];
  }

  globalSum = evaluateBoard(chess, move, globalSum, 'b');
  updateAdvantage();

  chess.move(move);
  board.position(chess.fen());

  if (color === 'b') {
    checkStatus('black');

    // Highlight black move
    $board.find('.' + squareClass).removeClass('highlight-black');
    $board.find('.square-' + move.from).addClass('highlight-black');
    squareToHighlight = move.to;
    colorToHighlight = 'black';

    $board
      .find('.square-' + squareToHighlight)
      .addClass('highlight-' + colorToHighlight);
  } else {
    checkStatus('white');

    // Highlight white move
    $board.find('.' + squareClass).removeClass('highlight-white');
    $board.find('.square-' + move.from).addClass('highlight-white');
    squareToHighlight = move.to;
    colorToHighlight = 'white';

    $board
      .find('.square-' + squareToHighlight)
      .addClass('highlight-' + colorToHighlight);
  }
}

/*
* Plays Computer vs. Computer, starting with a given color.
*/
function compVsComp(color) {
  if (!checkStatus({ w: 'white', b: 'black' }[color])) {
    timer = window.setTimeout(function () {
      makeBestMove(color);
      if (color === 'w') {
        color = 'b';
      } else {
        color = 'w';
      }
      compVsComp(color);
    }, 250);
  }
}

/*
* Resets the game to its initial state.
*/
function reset() {
  chess.reset();
  board.position(chess.fen());
  
  globalSum = 0;
  $('#advantageColor').text('Neither side');
  $('#advantageNumber').text(globalSum);

  $board.find('.' + squareClass).removeClass('highlight-white');
  $board.find('.' + squareClass).removeClass('highlight-black');
  $board.find('.' + squareClass).removeClass('highlight-hint');


  // Kill the Computer vs. Computer callback
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
}

/*
* Event listeners for various buttons.
*/
$('#ruyLopezBtn').on('click', function () {
  reset();
  chess.load(
    'r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 0 1'
  );
  board.position(chess.fen());
  window.setTimeout(function () {
    makeBestMove('b');
  }, 250);
});
$('#italianGameBtn').on('click', function () {
  reset();
  chess.load(
    'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 0 1'
  );
  board.position(chess.fen());
  window.setTimeout(function () {
    makeBestMove('b');
  }, 250);
});
$('#sicilianDefenseBtn').on('click', function () {
  reset();
  chess.load('rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 1');
  board.position(chess.fen());
});
$('#startBtn').on('click', function () {
  reset();
});
$('#compVsCompBtn').on('click', function () {
  reset();
  compVsComp('w');
});
$('#resetBtn').on('click', function () {
  reset();
});

function undo() {
  var move = chess.undo();
  undo_stack.push(move);

  // Maintain a maximum stack size
  if (undo_stack.length > STACK_SIZE) {
    undo_stack.shift();
  }
  board.position(chess.fen());
}

$('#undoBtn').on('click', function () {
  if (chess.history().length >= 2) {
    $board.find('.' + squareClass).removeClass('highlight-white');
    $board.find('.' + squareClass).removeClass('highlight-black');
    $board.find('.' + squareClass).removeClass('highlight-hint');

    // Undo twice: Opponent's latest move, followed by player's latest move
    undo();
    window.setTimeout(function () {
      undo();
      window.setTimeout(function () {
        showHint();
      }, 250);
    }, 250);
  } else {
    alert('Nothing to undo.');
  }
});

function redo() {
  chess.move(undo_stack.pop());
  board.position(chess.fen());
}

$('#redoBtn').on('click', function () {
  if (undo_stack.length >= 2) {
    // Redo twice: Player's last move, followed by opponent's last move
    redo();
    window.setTimeout(function () {
      redo();
      window.setTimeout(function () {
        showHint();
      }, 250);
    }, 250);
  } else {
    alert('Nothing to redo.');
  }
});

$('#showHint').change(function () {
  window.setTimeout(showHint, 250);
});

function showHint() {
  var showHint = document.getElementById('showHint');
  $board.find('.' + squareClass).removeClass('highlight-hint');

  // Show hint (best move for white)
  if (showHint.checked) {
    var move = getBestMove(chess, 'w', -globalSum)[0];

    $board.find('.square-' + move.from).addClass('highlight-hint');
    $board.find('.square-' + move.to).addClass('highlight-hint');
  }
}


/*
 * The remaining code is adapted from chessboard.js examples #5000 through #5005:
 * https://chessboardjs.com/examples#5000
 */


function greySquare(square) {
  var $square = $('#myBoard .square-' + square);

  var background = whiteSquareGrey;
  if ($square.hasClass('black-3c85d')) {
    background = blackSquareGrey;
  }

  $square.css('background', background);
}
function removeGreySquares() {
  $('#myBoard .square-55d63').css('background', '');
}
function onDragStart(source, piece) {
  // do not pick up pieces if the game is over
  if (chess.game_over()) return false;

  // or if it's not that side's turn
  if (
    (chess.turn() === 'w' && piece.search(/^b/) !== -1) ||
    (chess.turn() === 'b' && piece.search(/^w/) !== -1)
  ) {
    return false;
  }
}

function onDrop(source, target) {
  console.log("drop!");
  undo_stack = [];
  removeGreySquares();

  // see if the move is legal
  var move = chess.move({
    from: source,
    to: target,
    promotion: 'q', // NOTE: always promote to a queen for example simplicity
  });

  // Illegal move
  if (move === null) return 'snapback';

  globalSum = evaluateBoard(chess, move, globalSum, 'b');
  updateAdvantage();

  // Highlight latest move
  $board.find('.' + squareClass).removeClass('highlight-white');

  $board.find('.square-' + move.from).addClass('highlight-white');
  squareToHighlight = move.to;
  colorToHighlight = 'white';

  $board
    .find('.square-' + squareToHighlight)
    .addClass('highlight-' + colorToHighlight);

  if (!checkStatus('black'));
  {
    // Make the best move for black
    window.setTimeout(function () {
      makeBestMove('b');
      window.setTimeout(function () {
        showHint();
      }, 250);
    }, 250);
  }
}

function onMouseoverSquare(square, piece) {
  // get list of possible moves for this square
  var moves = chess.moves({
    square: square,
    verbose: true,
  });

  // exit if there are no moves available for this square
  if (moves.length === 0) return;

  // highlight the square they moused over
  greySquare(square);

  // highlight the possible squares for this piece
  for (var i = 0; i < moves.length; i++) {
    greySquare(moves[i].to);
  }
}

function onMouseoutSquare(square, piece) {
  removeGreySquares();
}

function onSnapEnd() {
  console.log("snapend!")
  board.position(chess.fen());
}
