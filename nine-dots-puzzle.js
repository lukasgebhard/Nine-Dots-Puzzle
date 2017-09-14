(function() {
    "use strict";

    // TODO to stylesheet
    var context = {
        canvasId: "canvas-nine-dots-puzzle",
        colourBackround: 'white',
        colourNeutral: "blue",
        colourSuccess: "green",
        colourFail: "red",
        dotRadius: 5,
        lineColor: "green",
        lineWidth: 3
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

    Coordinate.prototype.cover = function() {
        this.covered = true;
        this.colour = context.colourSuccess;
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
    }

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
        var canvasSize = canvas.width;
        var rasterSpacing = canvasSize / (Raster.prototype.size + 1);
        var padding = rasterSpacing;

        return horizontal ? padding + this.x * rasterSpacing : padding + this.y * rasterSpacing;
    };

    Coordinate.prototype.equals = function(other) {
        return other && other.x === this.x && other.y === this.y;
    }

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
        var canvasSize = this.canvasWrapper.width;
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

    Raster.prototype._updateCoveredState = function(startNode, targetNode) {       
        if (startNode.x == targetNode.x) { // Vertical line
            if (startNode.y > targetNode.y) {
                var swap = targetNode;
                targetNode = startNode;
                startNode = swap;
            }

            var y;
            var x = startNode.x;

            for (y = startNode.y; y <= targetNode.y; ++y) {
                this.coordinates[x][y].cover();
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
                    this.coordinates[x][Math.floor(y)].cover();
                }

                y += slope;
            }      
        }      
    };

    Raster.prototype.updateCoveredState = function(polyline) {
        if (polyline.nodeCount == 1) {
            this._updateCoveredState(polyline.nodes[0], polyline.nodes[0]);
        } else {
            this._updateCoveredState(polyline.nodes[polyline.nodeCount - 2], polyline.nodes[polyline.nodeCount - 1]);
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
        this.canvas.addEventListener("click", this.onClick.bind(this));
        this.canvas.addEventListener("mousemove", this.onMouseMove.bind(this));

        this.canvas.style.cursor = 'crosshair';
    }

    CanvasWrapper.prototype.draw = function() {
        var canvasContext = this.canvas.getContext("2d");

        canvasContext.fillStyle = context.colourBackround;
        canvasContext.fillRect(0, 0, this.width, this.height);

        this.raster.draw();

        if (this.polyline)
            this.polyline.draw();
    };

    CanvasWrapper.prototype.drawFace = function(happy) {
        var canvasContext = this.canvas.getContext("2d");
        var centre = Math.min(this.width, this.height) / 2;
        var headRadius = centre * 0.8;
        var eyeRadius = centre * 0.05;
        var eyesOffsetX = centre * 0.25;
        var eyesOffsetY = centre * 0.3;

        canvasContext.strokeStyle = 'black';
        canvasContext.lineWidth = 3;

        // Background
        canvasContext.fillStyle = happy ? context.colourSuccess : context.colourFail;
        canvasContext.fillRect(0, 0, this.width, this.height);

        // Head
        canvasContext.fillStyle = 'yellow';
        canvasContext.beginPath();
        canvasContext.arc(centre, centre, headRadius, 0, Math.PI * 2, true); 
        canvasContext.fill();
        canvasContext.stroke();

        // Mouth
        if (happy) {
            var mouthRadius = centre * 0.5;
            
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
    }

    CanvasWrapper.prototype.showResult = function(puzzleSolved) {
        if (puzzleSolved) {
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
            this.drawFace(puzzleSolved);
            this.faceDisplayed = true;
        }.bind(this), Coordinate.prototype.animationDuration);
    };

    CanvasWrapper.prototype.startGame = function() {
        this.raster = new Raster(this);
        this.polyline = new Polyline(this);
        this.hasGameEnded = false;
        this.faceDisplayed = false;
        this.draw();
    };

    CanvasWrapper.prototype.onClick = function(event) {
        if (this.hasGameEnded) {
            if (this.faceDisplayed)
                this.startGame();
        } else {
            var node = this.raster.getCoordinate(event.layerX, event.layerY);

            this.polyline.addNode(node);
            this.raster.updateCoveredState(this.polyline);
            this.draw();

            if (this.polyline.isComplete()) {
                this.hasGameEnded = true;
                this.showResult(this.raster.covered());
            }  
        }
    };

    CanvasWrapper.prototype.onMouseMove = function(event) {  
        var node = this.raster.getCoordinate(event.layerX, event.layerY);
                         
        if (this.polyline.nodeCount === 0) {
            
        } else {
            
        }
    };

    function Polyline(parent) {
        this.canvasWrapper = parent;
        this.nodes = new Array(this.maxNodeCount);
        this.nodeCount = 0;
    }

    Polyline.prototype.maxNodeCount = 5;

    Polyline.prototype.isComplete = function() {
        return this.nodeCount == Polyline.prototype.maxNodeCount;
    };

    Polyline.prototype.addNode = function(newNode) {
        console.assert(this.nodeCount < this.maxNodeCount, "Illegal state: Maximum number of polyline nodes exceeded.");

        if (this.nodeCount === 0 || !this.nodes[this.nodeCount - 1].equals(newNode)) {
            this.nodes[this.nodeCount] = newNode;    
            ++this.nodeCount;
        }     
    };

    Polyline.prototype.draw = function() {        
        if (this.nodeCount > 0) {
            var canvas = this.canvasWrapper.canvas;
            var canvasContext = canvas.getContext("2d");
            var i;
             
            canvasContext.strokeStyle = context.lineColor;
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
