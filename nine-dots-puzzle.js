(function() {
    "use strict";

    // TODO cursor icon

    // TODO to stylesheet
    var context = {
        canvasId: "canvas-nine-dots-puzzle",
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
    }

    Coordinate.prototype._blinkInterval = 500; // ms
    Coordinate.prototype.blinkDuration = 2500; // ms

    Coordinate.prototype._draw = function(x, y, colour) {
        var canvas = this.raster.canvasWrapper.canvas;
        var canvasContext = canvas.getContext("2d");

        canvasContext.fillStyle = colour;
        canvasContext.strokeStyle = colour;
        canvasContext.lineWidth = 1;
        canvasContext.beginPath();
        canvasContext.arc(x, y, context.dotRadius, 0, 2 * Math.PI);
        canvasContext.fill();
        canvasContext.stroke();
    };

    Coordinate.prototype.blink = function() {
        var intervalId = this._blink();

        setTimeout(function() {
            this._stopAnimation(intervalId);
        }.bind(this), Coordinate.prototype.blinkDuration);
    };

    Coordinate.prototype._stopAnimation = function(id) {
        clearInterval(id);
    };

    Coordinate.prototype._blink = function() {
        if (!this._colour) {
            this._colour = context.colourNeutral;
        }

        return setInterval(function() {
            this._colour = this._colour === context.colourFail ? context.colourNeutral : context.colourFail;
            this._draw(this.getPositionX(), this.getPositionY(), this._colour);
        }.bind(this), Coordinate.prototype._blinkInterval);
    };

    Coordinate.prototype._expand = function() {

    };

    Coordinate.prototype.draw = function() {
        if (this.isDot) {
            var colour = this.covered ? context.colourSuccess : context.colourNeutral;

            this._draw(this.getPositionX(), this.getPositionY(), colour);
        }
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

    Raster.prototype._updateCheckState = function(startNode, targetNode) {       
        if (startNode.x == targetNode.x) { // Vertical line
            if (startNode.y > targetNode.y) {
                var swap = targetNode;
                targetNode = startNode;
                startNode = swap;
            }

            var y;
            var x = startNode.x;

            for (y = startNode.y; y <= targetNode.y; ++y) {
                this.coordinates[x][y].covered = true;
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
                if (Math.abs(Math.floor(y) - y) < epsilon)
                    this.coordinates[x][Math.floor(y)].covered = true;

                y += slope;
            }      
        }      
    };

    Raster.prototype.updateCheckState = function(polyline) {
        if (polyline.nodeCount == 1) {
            this._updateCheckState(polyline.nodes[0], polyline.nodes[0]);
        } else {
            this._updateCheckState(polyline.nodes[polyline.nodeCount - 2], polyline.nodes[polyline.nodeCount - 1]);
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
        this.raster = new Raster(this);
        this.hasGameEnded = false;

        this.canvas.addEventListener("click", this.onClick.bind(this));
    }

    CanvasWrapper.prototype.draw = function() {
        this.raster.draw();

        if (this.polyline)
            this.polyline.draw();
    };

    CanvasWrapper.prototype.drawHappyFace = function() {
        var canvasContext = this.canvas.getContext("2d");
        var centre = Math.floor(Math.min(this.width, this.height) / 2);
        var outerRadius = Math.floor(centre * 0.8);
        var innerRadius = Math.floor(centre * 0.5);
        var eyeRadius = Math.floor(centre * 0.05);
        var deltaXEyes = Math.floor(centre * 0.25);
        var deltaYEyes = Math.floor(centre * 0.3);

        canvasContext.strokeStyle = 'black';
        canvasContext.lineWidth = 3;

        // Background
        canvasContext.fillStyle = context.colourSuccess
        canvasContext.fillRect(0, 0, this.width, this.height);

        // Head
        canvasContext.fillStyle = 'yellow';
        canvasContext.beginPath();
        canvasContext.arc(centre, centre, outerRadius, 0, Math.PI * 2, true); 
        canvasContext.fill();
        canvasContext.stroke();

        // Mouth
        canvasContext.fillStyle = 'white';
        canvasContext.beginPath();
        canvasContext.arc(centre, centre, innerRadius, 0, Math.PI, false);
        canvasContext.lineTo(centre + innerRadius, centre);
        canvasContext.fill();
        canvasContext.stroke();

        // Eyes
        canvasContext.fillStyle = 'black';
        canvasContext.beginPath();
        canvasContext.arc(centre - deltaXEyes, centre - deltaYEyes, eyeRadius, 0, Math.PI * 2, true);
        canvasContext.fill();
        canvasContext.stroke();
        canvasContext.beginPath();
        canvasContext.arc(centre + deltaXEyes, centre - deltaYEyes, eyeRadius, 0, Math.PI * 2, true);
        canvasContext.fill();
        canvasContext.stroke();
    }

    CanvasWrapper.prototype.showFailure = function() {
        this.raster.getDots().forEach(function(dot) {
            if (!dot.covered) {
                dot.blink();
            }
        })
    };

    CanvasWrapper.prototype.showSuccess = function() {
        setTimeout(function() {
            this.drawHappyFace();
        }.bind(this), Coordinate.prototype.blinkDuration);
    };

    CanvasWrapper.prototype.onClick = function(event) {
        if (this.hasGameEnded) {
            //TODO
        } else {
            var node = this.raster.getCoordinate(event.layerX, event.layerY);

            if (!this.polyline) {
                this.polyline = new Polyline(this);
                this.canvas.addEventListener("mousemove", this.onMouseMove.bind(this));
            }

            this.polyline.addNode(node);
            this.raster.updateCheckState(this.polyline);
            this.draw();

            if (this.polyline.isComplete()) {
                this.hasGameEnded = true;
                this.canvas.removeEventListener("click", this.onClick);

                if (this.raster.covered()) {
                    this.showSuccess();
                } else {
                    this.showFailure();
                }
            }  
        }
    };

    CanvasWrapper.prototype.onMouseMove = function(event) {
        
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
        var canvasWrapper = new CanvasWrapper();

        canvasWrapper.draw();
    })();
})();
