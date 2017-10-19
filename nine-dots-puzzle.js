/*
NINE DOTS PUZZLE

Copyright (c) 2017 Lukas Gebhard <github.com/mr-kojo/Nine-Dots-Puzzle>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

///////////////////////////////////////////
// Feel free to edit this configuration: //
///////////////////////////////////////////
var NINE_DOTS_PUZZLE_CANVAS_ID = "canvas-nine-dots-puzzle";
var NINE_DOTS_PUZZLE_DEFAULT_CONFIG = {
    show_hint_button_after_round: 2,
    text_button_hint: "Hint",
    text_hint: "Think outside the box.",
    colour_background: "rgb(0, 0, 128)",
    colour_neutral: "rgb(153, 221, 255)",
    colour_success: "rgb(0, 128, 0)",
    colour_fail: "rgb(230, 46, 0)",
    colour_face: "rgb(255, 217, 26)",
    colour_text: "white",
    colour_text_background_dark: "rgb(51, 51, 51)",
    colour_text_background_light: "rgb(115, 115, 115)"
};

///////////////////////////////////////////
// No need to edit below this line       //
///////////////////////////////////////////
(function(canvasId, defaultConfig) {
    "use strict";

    function Context() {
        this.canvas = document.getElementById(canvasId);
        this.height = this.canvas.height;
        this.width = this.canvas.width;
        this.size = Math.min(this.height, this.width);
    }

    Context.prototype = {
        getCanvas : function() {
            return this.canvas;
        },

        get : function(key) {
            if (key === "height" || key === "width" || key === "size") {
                return this[key];
            }

            var config = this.canvas.dataset[key];

            return config ? config : defaultConfig[key];
        },

        getDrawingContext : function() {
            return this.canvas.getContext("2d");
        }
    };

    function Coordinate(x, y, context) {
        this.context = context;
        this.x = x;
        this.y = y;
        this.covered = false;
        this.isDot = false;
        this.radius = Math.max(4, this.context.get("size") / 50);
        this.colour = this.context.get("colour_neutral");
        this.animationId = - 1;
    }

    Coordinate.prototype = {
        _blinkInterval : 300, // ms

        animationDuration : 2400, // ms

        draw : function() {
            if (this.isDot) {
                var drawingContext = this.context.getDrawingContext();

                drawingContext.fillStyle = this.colour;
                drawingContext.strokeStyle = this.colour;
                drawingContext.lineWidth = 1;
                drawingContext.beginPath();
                drawingContext.arc(this.getPositionX(), this.getPositionY(), this.radius, 0, 2 * Math.PI);
                drawingContext.fill();
                drawingContext.stroke();
            }
        },

        updateState : function(covered) {
            this.covered = covered;
            this.colour = this.covered ? this.context.get("colour_success") : this.context.get("colour_neutral");
        },

        blink : function() {
            this.animationId = this._blink();

            setTimeout(function() {
                clearInterval(this.animationId);
            }.bind(this), Coordinate.prototype.animationDuration);
        },

        _blink : function() {
            return setInterval(function() {
                this.colour = this.colour === this.context.get("colour_fail") ? this.context.get("colour_neutral") 
                    : this.context.get("colour_fail");
                this.draw();
            }.bind(this), Coordinate.prototype._blinkInterval);
        },

        expand : function() {
            this.animationId = requestAnimationFrame(function() {
                this._expand();
            }.bind(this));

            setTimeout(function() {
                cancelAnimationFrame(this.animationId);
            }.bind(this), Coordinate.prototype.animationDuration);
        },

        _expand : function() {
            if (!this._scalingFactor) {
                var rStart = this.radius;
                var rTarget = this.context.get("size") / 2;
                var exponent = (this.animationDuration / 1000) * 60 // 60 frames per second

                this._scalingFactor = Math.pow(rTarget / rStart, 1 / exponent);
            }

            this.radius *= this._scalingFactor;
            this.draw();

            this.animationId = requestAnimationFrame(function() {
                this._expand();
            }.bind(this));
        },

        getPositionX : function() {
            return this._getPosition(true);
        },

        getPositionY : function() {
            return this._getPosition(false);
        },

        _getPosition : function(horizontal) {
            var rasterSpacing = this.context.get("size") / (Raster.prototype.size + 1);
            var padding = rasterSpacing;

            return horizontal ? padding + this.x * rasterSpacing : padding + this.y * rasterSpacing;
        },

        equals : function(other) {
            return other && other.x === this.x && other.y === this.y;
        }
    };

    function Raster(context) {
        var x, y, dot;
        this.context = context;
        this.coordinates = new Array(Raster.prototype.size);

        for (x = 0; x < Raster.prototype.size; ++x) {
            this.coordinates[x] = new Array(Raster.prototype.size);

            for (y = 0; y < Raster.prototype.size; ++y) {
                this.coordinates[x][y] = new Coordinate(x, y, context);
            }
        }

        for (dot of this.getDots()) {
            dot.isDot = true;
        }
    }

    Raster.prototype = { 
        size : 9,

        dotSpacing : 2,

        getDots : function() {
            var dotCount = 9;
            var dots = new Array(dotCount);
            var d = 0, i, j;
            var indentation = 2;
            var dotSpacing = Raster.prototype.dotSpacing;

            for (i = 0; i < 3; ++i) {
                for (j = 0; j < 3; ++j) {
                    dots[d] = this.coordinates[indentation + i * dotSpacing][indentation + j * dotSpacing];
                    ++d;
                }
            }

            return dots;
        },

        draw : function() {
            var row;
            var coordinate;

            for (row of this.coordinates) {
                for (coordinate of row) {
                    coordinate.draw();
                }
            }
        },

        _getGridIndex : function(clickPosition) {
            var rasterSpacing = this.context.get("size") / (Raster.prototype.size + 1);
            var padding = rasterSpacing;
            var gridIndex = Math.round((clickPosition - padding) / rasterSpacing);

            if (gridIndex < 0) {
                gridIndex = 0;
            }
            if (gridIndex >= Raster.prototype.size) {
                gridIndex = Raster.prototype.size - 1;
            }

            return gridIndex;
        },

        getCoordinate : function(clickX, clickY) {
            return this.coordinates[this._getGridIndex(clickX)][this._getGridIndex(clickY)];
        },

        _updateState : function(startNode, targetNode) {       
            if (startNode.x == targetNode.x) { // Vertical line
                if (startNode.y > targetNode.y) {
                    var swap = targetNode;
                    targetNode = startNode;
                    startNode = swap;
                }

                var y;
                var x = startNode.x;

                for (y = startNode.y; y <= targetNode.y; ++y) {
                    this.coordinates[x][y].updateState(true);
                }
            } else {
                if (startNode.x > targetNode.x) {
                    var swap = targetNode;
                    targetNode = startNode;
                    startNode = swap;
                }

                var slope = (targetNode.y - startNode.y) / (targetNode.x - startNode.x);
                var y = startNode.y;
                var x;
                var epsilon = 0.0001;

                for (x = startNode.x; x <= targetNode.x; ++x) {
                    if (Math.abs(Math.round(y) - y) < epsilon) {
                        this.coordinates[x][Math.round(y)].updateState(true);
                    }

                    y += slope;
                }      
            }      
        },

        updateState : function(polyline) {
            this.getDots().forEach(dot => dot.updateState(false));

            if (polyline.nodeCount == 0) {
                polyline.previewNode.updateState(true);
            } else {
                var i;

                for (i = 0; i < polyline.nodeCount - 1; ++i) {
                    this._updateState(polyline.nodes[i], polyline.nodes[i + 1]);
                }

                this._updateState(polyline.nodes[polyline.nodeCount - 1], polyline.previewNode);
            }
        },

        covered : function() {
            return this.getDots().every(dot => dot.covered);
        }
    };

    function NineDotsPuzzle(context) {   
        this.context = context;
        this.canvas = this.context.canvas;    
        this.drawingContext = this.context.getDrawingContext();
        this.size = this.context.size;
        this.width = this.context.width;
        this.height = this.context.height;
        this.hintButtonHeight = this.height * 0.1;
        this.hintButtonWidth = this.size * 0.2;  
        this.hintReceived = false;
        this.currentRound = 0;
        this.canvas.addEventListener("click", this.onClick.bind(this));
        this.canvas.addEventListener("mousemove", this.onMouseMove.bind(this));
    }

    NineDotsPuzzle.prototype = {
        draw : function() {
            this.drawingContext.fillStyle = this.context.get("colour_background");
            this.drawingContext.fillRect(0, 0, this.width, this.height);

            this.raster.draw();
            this.polyline.draw();
            this.drawCounter();
        },

        drawCounter : function() {
            var count = this.polyline.maxNodeCount - this.polyline.nodeCount; 
            var backgroundRadius = this.size / 5;  
            var textPaddingX = backgroundRadius / 4;
            var textPaddingY = backgroundRadius / 5;
            var fontSize = backgroundRadius / 2;

            this.drawingContext.font = fontSize + "px sans-serif"
            this.drawingContext.strokeStyle = this.context.get("colour_text_background_dark");
            this.drawingContext.fillStyle = this.context.get("colour_text_background_dark");
            this.drawingContext.lineWidth = 1;

            // Background
            this.drawingContext.beginPath();
            this.drawingContext.arc(0, this.height, backgroundRadius, 0, 2 * Math.PI, true);
            this.drawingContext.fill();
            this.drawingContext.stroke();

            // Text
            this.drawingContext.fillStyle = this.context.get("colour_text");
            this.drawingContext.fillText(count, textPaddingX, this.height - textPaddingY);
        },

        drawHintButton : function(showHint) {
            var count = this.polyline.maxNodeCount - this.polyline.nodeCount; 
            var backgroundHeight = this.hintButtonHeight;
            var backgroundWidth = this.hintButtonWidth;
            var backgroundY = this.height - backgroundHeight;
            var backgroundPointerX = backgroundWidth + backgroundHeight / 2;
            var backgroundPointerY = backgroundY + backgroundHeight / 2;
            var fontSize = backgroundHeight * 0.7;
            var textPadding = (backgroundHeight - fontSize) * 0.7;

            // Background
            this.drawingContext.fillStyle = showHint ? this.context.get("colour_text_background_dark") : this.context.get("colour_fail");
            this.drawingContext.fillRect(0, backgroundY, this.width, backgroundHeight);
            this.drawingContext.fillStyle = this.context.get("colour_text_background_light");
            this.drawingContext.beginPath();
            this.drawingContext.moveTo(0, backgroundY);
            this.drawingContext.lineTo(backgroundWidth, backgroundY);
            this.drawingContext.lineTo(backgroundPointerX, backgroundPointerY);
            this.drawingContext.lineTo(backgroundWidth, this.height);
            this.drawingContext.lineTo(0, this.height);
            this.drawingContext.fill();

            // Text
            this.drawingContext.font = fontSize + "px sans-serif";
            this.drawingContext.lineWidth = 1;
            this.drawingContext.fillStyle = this.context.get("colour_text");
            this.drawingContext.fillText(this.context.get("text_button_hint"), textPadding, this.height - textPadding);

            if (showHint) {
                this.drawingContext.fillText(this.context.get("text_hint"), backgroundPointerX + textPadding, this.height - textPadding);         
            }
        },

        drawFace : function() {
            var centre = this.size / 2;
            var headRadius = centre * 0.75;
            var eyeRadius = centre * 0.04;
            var eyesOffsetX = centre * 0.25;
            var eyesOffsetY = centre * 0.3;

            this.drawingContext.strokeStyle = "black";
            this.drawingContext.lineWidth = Math.max(3, this.size / 67);

            // Background
            this.drawingContext.fillStyle = this.puzzleSolved ? this.context.get("colour_success") : this.context.get("colour_fail");
            this.drawingContext.fillRect(0, 0, this.width, this.height);

            // Head
            this.drawingContext.fillStyle = this.context.get("colour_face");
            this.drawingContext.beginPath();
            this.drawingContext.arc(centre, centre, headRadius, 0, Math.PI * 2, true); 
            this.drawingContext.fill();
            this.drawingContext.stroke();

            // Mouth
            if (this.puzzleSolved) {
                var mouthRadius = centre * 0.45;

                this.drawingContext.fillStyle = "white";
                this.drawingContext.beginPath();
                this.drawingContext.arc(centre, centre, mouthRadius, 0, Math.PI, false);
                this.drawingContext.lineTo(centre + mouthRadius, centre);
                this.drawingContext.fill();
                this.drawingContext.stroke();
            } else {
                var leftCornerOfMouthX = centre - headRadius * 0.6;
                var leftCornerOfMouthY = centre + headRadius * 0.1;
                var rightCornerOfMouthX = centre + headRadius * 0.55;
                var rightCornerOfMouthY = centre + headRadius * 0.4;

                this.drawingContext.lineWidth = Math.max(4, this.size / 50);
                this.drawingContext.beginPath();
                this.drawingContext.moveTo(leftCornerOfMouthX, leftCornerOfMouthY);
                this.drawingContext.lineTo(rightCornerOfMouthX, rightCornerOfMouthY);
                this.drawingContext.stroke();
            }

            // Eyes
            this.drawingContext.fillStyle = "black";
            this.drawingContext.beginPath();
            this.drawingContext.arc(centre - eyesOffsetX, centre - eyesOffsetY, eyeRadius, 0, Math.PI * 2, true);
            this.drawingContext.fill();
            this.drawingContext.stroke();
            this.drawingContext.beginPath();
            this.drawingContext.arc(centre + eyesOffsetX, centre - eyesOffsetY, eyeRadius, 0, Math.PI * 2, true);
            this.drawingContext.fill();
            this.drawingContext.stroke();
        },

        showResult : function() {
            if (this.puzzleSolved) {
                this.raster.getDots().forEach(function(dot) {
                    dot.expand();
                })
            } else {
                this.raster.getDots().forEach(function(dot) {
                    if (!dot.covered) {
                        dot.blink();
                    }
                })
            }

            // Show happy/sad face
            setTimeout(function() {
                if (this.showHintButton()) {
                    this.drawingContext.save();
                    this.drawingContext.translate(0, - this.hintButtonHeight / 2);
                }

                this.drawFace();

                if (this.showHintButton()) {
                    this.drawingContext.restore();
                    this.drawHintButton(false);
                }

                this.canvas.style.cursor = "default";
                this.faceDisplayed = true;
            }.bind(this), Coordinate.prototype.animationDuration);
        },

        showHintButton : function() {
            return this.hasGameEnded && !this.puzzleSolved && !this.hintReceived
                && this.currentRound >= this.context.get("show_hint_button_after_round");
        },

        startGame : function() {
            this.raster = new Raster(this.context);
            this.polyline = new Polyline(this.context);
            this.hasGameEnded = false;
            this.faceDisplayed = false;
            this.puzzleSolved = false;
            this.currentRound += 1;
            this.canvas.style.cursor = "crosshair";
            this.draw();
        },

        onClick : function(event) {
            if (this.hasGameEnded) {
                if (this.hintButtonSelected(event)) {
                    this.drawHintButton(true); 
                    this.hintReceived = true;
                } else if (this.faceDisplayed) {
                    if (this.puzzleSolved) {
                        this.currentRound = 0;
                        this.hintReceived = false;
                    }

                    this.startGame(); // Next round
                }
            } else {
                var node = this.raster.getCoordinate(this.getCursorX(event), this.getCursorY(event));

                this.polyline.addNode(node);
                this.raster.updateState(this.polyline);
                this.draw();

                if (this.polyline.isComplete()) {
                    this.hasGameEnded = true;
                    this.puzzleSolved = this.raster.covered();
                    this.showResult();
                }  
            }
        },

        hintButtonSelected : function(event) {
            return this.faceDisplayed && this.showHintButton()
                && this.getCursorY(event) >= this.height - this.hintButtonHeight
                && this.getCursorX(event) <= this.hintButtonWidth;
        },

        onMouseMove : function(event) {  
            if (this.hasGameEnded) {
                if (this.faceDisplayed) {
                    this.canvas.style.cursor = this.hintButtonSelected(event) ? "pointer" : "default";
                }
            } else {
                var node = this.raster.getCoordinate(this.getCursorX(event), this.getCursorY(event));

                this.polyline.addNode(node, true);
                this.raster.updateState(this.polyline);
                this.draw();        
            }
        },

        getCursorX : function(event) {
            var rect = this.canvas.getBoundingClientRect();

            return event.clientX - rect.left;
        },

        getCursorY : function(event) {
            var rect = this.canvas.getBoundingClientRect();

            return event.clientY - rect.top;
        }
    };

    function Polyline(context) {
        this.context = context
        this.nodes = new Array(this.maxNodeCount);
        this.nodeCount = 0; // Number of nodes excluding the preview node
        this.previewNode = null; // Current node below the cursor
        this.lineWidth = Math.max(3, this.context.get("size") / 70);
    }

    Polyline.prototype = {
        maxNodeCount : 5,

        isComplete : function() {
            return this.nodeCount == Polyline.prototype.maxNodeCount;
        },

        addNode : function(newNode, isPreviewNode) {
            console.assert(this.nodeCount < this.maxNodeCount, "Illegal state: Maximum number of polyline nodes exceeded.");

            this.previewNode = newNode;

            // A permanent (non-preview) node is only added if it is different from the previously added node.
            if (!isPreviewNode && (this.nodeCount === 0 || !this.nodes[this.nodeCount - 1].equals(newNode))) {
                this.nodes[this.nodeCount] = newNode;    
                ++this.nodeCount;
            }
        },

        draw : function() {        
            if (this.nodeCount > 0) {
                var drawingContext = this.context.getDrawingContext();
                var i;

                drawingContext.strokeStyle = this.context.get("colour_success");
                drawingContext.lineWidth = this.lineWidth;
                drawingContext.lineCap = "round";
                drawingContext.beginPath();

                for (i = 0; i < this.nodeCount; ++i) {
                    var x = this.nodes[i].getPositionX();
                    var y = this.nodes[i].getPositionY();

                    if (i == 0) {
                        drawingContext.moveTo(x, y);
                    } else {
                        drawingContext.lineTo(x, y);
                    }
                }

                drawingContext.lineTo(this.previewNode.getPositionX(), this.previewNode.getPositionY());
                drawingContext.stroke();
            }
        },

        toString : function() {
            var stringRepresentation = "Polyline(";
            var i;

            for (i = 0; i < this.nodeCount; ++i) {
                stringRepresentation += "(" + this.nodes[i].x + "," + this.nodes[i].y + ")";

                if (i < this.nodeCount - 1) {
                    stringRepresentation += ", ";
                }
            }
            stringRepresentation += ")";
            return stringRepresentation;
        }
    };

    (new NineDotsPuzzle(new Context())).startGame();
})(NINE_DOTS_PUZZLE_CANVAS_ID, NINE_DOTS_PUZZLE_DEFAULT_CONFIG);
