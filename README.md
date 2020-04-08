# Nine-Dots-Puzzle
The famous Nine-Dots-Puzzle as an interactive 2D app.<br />
<a href="http://www2.informatik.uni-freiburg.de/~gebhardl/">Try it out</a> and feel free to add it to your homepage.

## Setup as a WordPress plugin
Simply follow <a href="https://wordpress.org/plugins/nine-dots-puzzle/">these instructions</a>.

## Setup as a JavaScript app
1. Upload the script <code>nine_dots_puzzle.js</code> to your web browser.
2. Include the script into your HTML file. For example, add <code>\<script src="nine-dots-puzzle.js" defer\>\</script\></code> to your HTML header.
3. Add <code>\<canvas id="canvas-nine-dots-puzzle"\>\</canvas\></code> wherever you want the puzzle to appear.

To customise the puzzle, add HTML5 data attributes to the canvas element. For instance, <code>\<canvas id="canvas-nine-dots-puzzle" data-size=”300px” data-colour_background=”brown”\>\</canvas\></code> will insert the puzzle with the given size and background colour.

The following data attributes are available:

- *data-size*: The width and height of the puzzle (Default: “250px”)
- *data-show_hint_button_after_round*: The number of rounds after which a ‘hint button’ is shown (Default: “2”)
- *data-text_button_hint*: The text on the hint button (Default: “Hint”)
- *data-text_hint*: The hint that is displayed after clicking the hint button (Default: “Think outside the box.”)
- *data-colour_background*: The background colour (Default: “rgb(0, 0, 128)”)
- *data-colour_neutral*: The ‘neutral’ colour (Default: “rgb(153, 221, 255)”)
- *data-colour_success*: The ‘success’ colour (Default: “rgb(0, 128, 0)”)
- *data-colour_fail*: The ‘fail’ colour (Default: “rgb(179, 0, 0)”)
- *data-colour_face*: The ‘face’ colour (Default: “rgb(255,217, 26)”)
- *data-colour_text*: The text colour (Default: “white”)
- *data-colour_text_background_dark*: The ‘text_background_dark’ colour (Default: “rgb(51. 51, 51)”)
- *data-colour_text_background_light*: The ‘text_background_light’ colour (Default: “rgb(115, 115, 115)”)
