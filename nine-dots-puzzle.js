(function() {
    "use strict";

    // TODO to stylesheet
    var context = {
        canvasId: "canvas-nine-dots-puzzle",
        colourBackround: "rgb(153, 221, 255)",
        colourNeutral: "rgb(0, 0, 128)",
        colourSuccess: "rgb(0, 128, 0)",
        colourFail: "rgb(230, 46, 0)",
        colourFace: "rgb(255, 217, 26)",
        colourText: "white",
        colourTextBackgroundDark: 'rgb(51, 51, 51)',
        colourTextBackgroundLight: 'rgb(115, 115, 115)',
        dotRadius: 5,
        lineWidth: 3,
        showHintButtonAfterRound: 2,
        textButtonHint: 'Hint',
        textHint: 'Think outside the box.'
    };

    function Coordinate(parent, x, y) {
        this.raster = parent;
        this.x = x;
        this.y = y;
        this.covered = false;
        this.isDot = false;
        this.radius = context.dotRadius;
        this.colour = context.colourNeutral;
        this.animationId = - 1;
    }

    Coordinate.prototype._blinkInterval = 300; // ms
    Coordinate.prototype.animationDuration = 2400; // ms

    Coordinate.prototype.draw = function() {
        if (this.isDot) {
            var canvas = this.raster.canvasWrapper.canvas;
            var canvasContext = canvas.getContext("2d");

            canvasContext.fillStyle = this.colour;
            canvasContext.strokeStyle = this.colour;
            canvasContext.lineWidth = 1;
            canvasContext.beginPath();
            canvasContext.arc(this.getPositionX(), this.getPositionY(), this.radius, 0, 2 * Math.PI);
            canvasContext.fill();
            canvasContext.stroke();
        }
    };

    Coordinate.prototype.updateState = function(covered) {
        this.covered = covered;
        this.colour = this.covered ? context.colourSuccess : context.colourNeutral;
    }

    Coordinate.prototype.blink = function() {
        this.animationId = this._blink();

        setTimeout(function() {
            clearInterval(this.animationId);
        }.bind(this), Coordinate.prototype.animationDuration);
    };

    Coordinate.prototype._blink = function() {
        return setInterval(function() {
            this.colour = this.colour === context.colourFail ? context.colourNeutral : context.colourFail;
            this.draw();
        }.bind(this), Coordinate.prototype._blinkInterval);
    };

    Coordinate.prototype.expand = function() {
        this.animationId = requestAnimationFrame(function() {
            this._expand();
        }.bind(this));

        setTimeout(function() {
            cancelAnimationFrame(this.animationId);
        }.bind(this), Coordinate.prototype.animationDuration);
    };

    Coordinate.prototype._expand = function() {
        if (!this._scalingFactor) {
            var rStart = this.radius;
            var rTarget = Math.min(this.raster.canvasWrapper.height, this.raster.canvasWrapper.width) / 2;
            var exponent = (this.animationDuration / 1000) * 60 // 60 frames per second

            this._scalingFactor = Math.pow(rTarget / rStart, 1 / exponent);
        }

        this.radius *= this._scalingFactor;
        this.draw();

        this.animationId = requestAnimationFrame(function() {
            this._expand();
        }.bind(this));
    };

    Coordinate.prototype.getPositionX = function() {
        return this._getPosition(true);
    };

    Coordinate.prototype.getPositionY = function() {
        return this._getPosition(false);
    };

    Coordinate.prototype._getPosition = function(horizontal) {
        var canvas = this.raster.canvasWrapper.canvas;
        var canvasSize = Math.min(canvas.width, canvas.height);
        var rasterSpacing = canvasSize / (Raster.prototype.size + 1);
        var padding = rasterSpacing;

        return horizontal ? padding + this.x * rasterSpacing : padding + this.y * rasterSpacing;
    };

    Coordinate.prototype.equals = function(other) {
        return other && other.x === this.x && other.y === this.y;
    };

    function Raster(parent) {
        var x, y, dot;
        this.canvasWrapper = parent;
        this.coordinates = new Array(Raster.prototype.size);

        for (x = 0; x < Raster.prototype.size; ++x) {
            this.coordinates[x] = new Array(Raster.prototype.size);

            for (y = 0; y < Raster.prototype.size; ++y) {
                this.coordinates[x][y] = new Coordinate(this, x, y);
            }
        }

        for (dot of this.getDots()) {
            dot.isDot = true;
        }
    }

    Raster.prototype.size = 9;
    Raster.prototype.dotSpacing = 2;

    Raster.prototype.getDots = function() {
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
    };

    Raster.prototype.draw = function() {
        var row;
        var coordinate;

        for (row of this.coordinates) {
            for (coordinate of row) {
                coordinate.draw();
            }
        }
    };

    Raster.prototype._getGridIndex = function(clickPosition) {
        var canvasSize = Math.min(this.canvasWrapper.width, this.canvasWrapper.height);
        var rasterSpacing = canvasSize / (Raster.prototype.size + 1);
        var padding = rasterSpacing;
        var gridIndex = Math.round((clickPosition - padding) / rasterSpacing);

        if (gridIndex < 0) {
            gridIndex = 0;
        }
        if (gridIndex >= Raster.prototype.size) {
            gridIndex = Raster.prototype.size - 1;
        }

        return gridIndex;
    };

    Raster.prototype.getCoordinate = function(clickX, clickY) {
        return this.coordinates[this._getGridIndex(clickX)][this._getGridIndex(clickY)];
    };

    Raster.prototype._updateState = function(startNode, targetNode) {       
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
                if (Math.abs(Math.floor(y) - y) < epsilon) {
                    this.coordinates[x][Math.floor(y)].updateState(true);
                }

                y += slope;
            }      
        }      
    };

    Raster.prototype.updateState = function(polyline) {
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
    };

    Raster.prototype.covered = function() {
        return this.getDots().every(dot => dot.covered);
    };

    function CanvasWrapper() {
        // TODO remove coupling: insert canvas to DOM programmatically
        this.canvas = document.getElementById(context.canvasId);
        this.height = this.canvas.height;
        this.width = this.canvas.width;
        this.hintButtonHeight = this.height * 0.1;
        this.hintButtonWidth = Math.min(this.width, this.height) * 0.2;  
        this.hintReceived = false;
        this.currentRound = 0;
        this.canvas.addEventListener("click", this.onClick.bind(this));
        this.canvas.addEventListener("mousemove", this.onMouseMove.bind(this));
    }

    CanvasWrapper.prototype.draw = function() {
        var canvasContext = this.canvas.getContext("2d");

        canvasContext.fillStyle = context.colourBackround;
        canvasContext.fillRect(0, 0, this.width, this.height);

        this.raster.draw();
        this.polyline.draw();
        this.drawCounter();
    };

    CanvasWrapper.prototype.drawCounter = function() {
        var canvasContext = this.canvas.getContext("2d");
        var count = this.polyline.maxNodeCount - this.polyline.nodeCount; 
        var backgroundRadius = Math.min(this.width, this.height) / 5;  
        var textPaddingX = backgroundRadius / 4;
        var textPaddingY = backgroundRadius / 5;
        var fontSize = backgroundRadius / 2;

        canvasContext.font = fontSize + 'px sans-serif'
        canvasContext.strokeStyle = context.colourTextBackgroundDark;
        canvasContext.fillStyle = context.colourTextBackgroundDark;
        canvasContext.lineWidth = 1;

        // Background
        canvasContext.beginPath();
        canvasContext.arc(0, this.height, backgroundRadius, 0, 2 * Math.PI, true);
        canvasContext.fill();
        canvasContext.stroke();

        // Text
        canvasContext.fillStyle = context.colourText;
        canvasContext.fillText(count, textPaddingX, this.height - textPaddingY);
    }

    CanvasWrapper.prototype.drawHintButton = function(showHint) {
        var canvasContext = this.canvas.getContext("2d");
        var count = this.polyline.maxNodeCount - this.polyline.nodeCount; 

        var backgroundHeight = this.hintButtonHeight;
        var backgroundWidth = this.hintButtonWidth;
        var backgroundY = this.height - backgroundHeight;
        var backgroundPointerX = backgroundWidth + backgroundHeight / 2;
        var backgroundPointerY = backgroundY + backgroundHeight / 2;
        var fontSize = backgroundHeight * 0.7;
        var textPadding = (backgroundHeight - fontSize) * 0.7;

        canvasContext.font = fontSize + 'px sans-serif'
        canvasContext.lineWidth = 1;

        // Background
        canvasContext.fillStyle = showHint ? context.colourTextBackgroundDark : context.colourFail;
        canvasContext.fillRect(0, backgroundY, this.width, backgroundHeight);
        canvasContext.fillStyle = context.colourTextBackgroundLight;      
        canvasContext.beginPath();
        canvasContext.moveTo(0, backgroundY);
        canvasContext.lineTo(backgroundWidth, backgroundY);
        canvasContext.lineTo(backgroundPointerX, backgroundPointerY);
        canvasContext.lineTo(backgroundWidth, this.height);
        canvasContext.lineTo(0, this.height);
        canvasContext.fill();

        // Text
        canvasContext.fillStyle = 'white';
        canvasContext.fillText(context.textButtonHint, textPadding, this.height - textPadding);

        if (showHint) {
            canvasContext.fillText(context.textHint, backgroundPointerX + textPadding, this.height - textPadding);         
        }
    }

    CanvasWrapper.prototype.drawFace = function() {
        var canvasContext = this.canvas.getContext("2d");
        var centre = Math.min(this.width, this.height) / 2;
        var headRadius = centre * 0.75;
        var eyeRadius = centre * 0.04;
        var eyesOffsetX = centre * 0.25;
        var eyesOffsetY = centre * 0.3;

        canvasContext.strokeStyle = 'black';
        canvasContext.lineWidth = 3;

        // Background
        canvasContext.fillStyle = this.puzzleSolved ? context.colourSuccess : context.colourFail;
        canvasContext.fillRect(0, 0, this.width, this.height);

        // Head
        canvasContext.fillStyle = context.colourFace;
        canvasContext.beginPath();
        canvasContext.arc(centre, centre, headRadius, 0, Math.PI * 2, true); 
        canvasContext.fill();
        canvasContext.stroke();

        // Mouth
        if (this.puzzleSolved) {
            var mouthRadius = centre * 0.45;
            
            canvasContext.fillStyle = 'white';
            canvasContext.beginPath();
            canvasContext.arc(centre, centre, mouthRadius, 0, Math.PI, false);
            canvasContext.lineTo(centre + mouthRadius, centre);
            canvasContext.fill();
            canvasContext.stroke();
        } else {
            var leftCornerOfMouthX = centre - headRadius * 0.6;
            var leftCornerOfMouthY = centre + headRadius * 0.1;
            var rightCornerOfMouthX = centre + headRadius * 0.55;
            var rightCornerOfMouthY = centre + headRadius * 0.4;

            canvasContext.lineWidth = 4;
            canvasContext.beginPath();
            canvasContext.moveTo(leftCornerOfMouthX, leftCornerOfMouthY);
            canvasContext.lineTo(rightCornerOfMouthX, rightCornerOfMouthY);
            canvasContext.stroke();
        }

        // Eyes
        canvasContext.fillStyle = 'black';
        canvasContext.beginPath();
        canvasContext.arc(centre - eyesOffsetX, centre - eyesOffsetY, eyeRadius, 0, Math.PI * 2, true);
        canvasContext.fill();
        canvasContext.stroke();
        canvasContext.beginPath();
        canvasContext.arc(centre + eyesOffsetX, centre - eyesOffsetY, eyeRadius, 0, Math.PI * 2, true);
        canvasContext.fill();
        canvasContext.stroke();
    };

    CanvasWrapper.prototype.showResult = function() {
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

        setTimeout(function() {
            var canvasContext = this.canvas.getContext("2d");

            if (this.showHintButton()) {
                canvasContext.save();
                canvasContext.translate(0, - this.hintButtonHeight / 2);
            }

            this.drawFace();
            
            if (this.showHintButton()) {
                canvasContext.restore();
                this.drawHintButton(false);
            }
            
            this.canvas.style.cursor = 'default';
            this.faceDisplayed = true;
        }.bind(this), Coordinate.prototype.animationDuration);
    };

    CanvasWrapper.prototype.showHintButton = function() {
        return this.hasGameEnded && !this.puzzleSolved && !this.hintReceived
            && this.currentRound >= context.showHintButtonAfterRound;
    };

    CanvasWrapper.prototype.startGame = function() {
        this.raster = new Raster(this);
        this.polyline = new Polyline(this);
        this.hasGameEnded = false;
        this.faceDisplayed = false;
        this.puzzleSolved = false;
        this.currentRound += 1;
        this.canvas.style.cursor = 'crosshair';
        this.draw();
    };

    CanvasWrapper.prototype.onClick = function(event) {
        if (this.hasGameEnded) {
            if (this.hintButtonSelected(event)) {
                this.drawHintButton(true); 
                this.hintReceived = true;
            } else if (this.faceDisplayed) {
                if (this.puzzleSolved) {
                    this.currentRound = 0;
                    this.hintReceived = false;
                }

                this.startGame();
            }
        } else {
            var node = this.raster.getCoordinate(event.layerX, event.layerY);

            this.polyline.addNode(node);
            this.raster.updateState(this.polyline);
            this.draw();

            if (this.polyline.isComplete()) {
                this.hasGameEnded = true;
                this.puzzleSolved = this.raster.covered();
                this.showResult();
            }  
        }
    };

    CanvasWrapper.prototype.hintButtonSelected = function(event) {
        return this.faceDisplayed && this.showHintButton()
            && event.layerY >= this.height - this.hintButtonHeight
            && event.layerX <= this.hintButtonWidth;
    }

    CanvasWrapper.prototype.onMouseMove = function(event) {  
        if (this.hasGameEnded) {
            if (this.faceDisplayed) {
                this.canvas.style.cursor = this.hintButtonSelected(event) ? 'pointer' : 'default';
            }
        } else {
            var node = this.raster.getCoordinate(event.layerX, event.layerY);
          
            this.polyline.addNode(node, true);
            this.raster.updateState(this.polyline);
            this.draw();        
        }
    };

    function Polyline(parent) {
        this.canvasWrapper = parent;
        this.nodes = new Array(this.maxNodeCount);
        this.nodeCount = 0;
        this.previewNode = null;
    }

    Polyline.prototype.maxNodeCount = 5;

    Polyline.prototype.isComplete = function() {
        return this.nodeCount == Polyline.prototype.maxNodeCount;
    };

    Polyline.prototype.addNode = function(newNode, isPreviewNode) {
        console.assert(this.nodeCount < this.maxNodeCount, "Illegal state: Maximum number of polyline nodes exceeded.");

        this.previewNode = newNode;

        // A permanent (non-preview) node is only added if it is different from the previously added node.
        if (!isPreviewNode && (this.nodeCount === 0 || !this.nodes[this.nodeCount - 1].equals(newNode))) {
            this.nodes[this.nodeCount] = newNode;    
            ++this.nodeCount;
        }
    };

    Polyline.prototype.draw = function() {        
        if (this.nodeCount > 0) {
            var canvas = this.canvasWrapper.canvas;
            var canvasContext = canvas.getContext("2d");
            var i;
             
            canvasContext.strokeStyle = context.colourSuccess;
            canvasContext.lineWidth = context.lineWidth;
            canvasContext.lineCap = "round";
            canvasContext.beginPath();

            for (i = 0; i < this.nodeCount; ++i) {
                var x = this.nodes[i].getPositionX();
                var y = this.nodes[i].getPositionY();

                if (i == 0) 
                    canvasContext.moveTo(x, y);
                else
                    canvasContext.lineTo(x, y);
            }

            canvasContext.lineTo(this.previewNode.getPositionX(), this.previewNode.getPositionY());
            canvasContext.stroke();
        }
    };

    Polyline.prototype.toString = function() {
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
    };

    (function() {
        (new CanvasWrapper()).startGame();
    })();
})();
