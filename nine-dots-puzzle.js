(function() {
    "use strict";

    // TODO cursor icon

    // TODO to stylesheet
    var context = {
        canvasId: "canvas-nine-dots-puzzle",
        dotColorNeutral: "blue",
        dotColorChecked: "green",
        dotColorFail: "red",
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

    Coordinate.prototype.draw = function() {
        var canvas = this.raster.canvasWrapper.canvas;
        var canvasContext = canvas.getContext("2d");

        if (this.isDot) {
            var color = this.covered ? context.dotColorChecked : context.dotColorNeutral;

            canvasContext.fillStyle = color;
            canvasContext.beginPath();
            canvasContext.arc(this.getPositionX(), this.getPositionY(), context.dotRadius, 0, 2 * Math.PI);
            canvasContext.fill();
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
        var rasterSpacing = canvasSize / (this.raster.size + 1);
        var padding = rasterSpacing;

        return horizontal ? padding + this.x * rasterSpacing : padding + this.y * rasterSpacing;
    };

    function Raster(parent) {
        var x, y, dot;
        this.canvasWrapper = parent;
        this.coordinates = new Array(this.size);

        for (x = 0; x < this.size; ++x) {
            this.coordinates[x] = new Array(this.size);

            for (y = 0; y < this.size; ++y) {
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

        for (i = 0; i < 3; ++i) {
            for (j = 0; j < 3; ++j) {
                dots[d] = this.coordinates[indentation + i * this.dotSpacing][indentation + j * this.dotSpacing];
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

    Raster.prototype.getGridIndex = function(clickPosition) {
        var canvasSize = this.canvasWrapper.width;
        var rasterSpacing = canvasSize / (this.size + 1);
        var padding = rasterSpacing;
        var gridIndex = Math.round((clickPosition - padding) / rasterSpacing);

        if (gridIndex < 0) {
            gridIndex = 0;
        }
        if (gridIndex >= this.size) {
            gridIndex = this.size - 1;
        }

        return gridIndex;
    };

    Raster.prototype.getCoordinate = function(clickX, clickY) {
        return this.coordinates[this.getGridIndex(clickX)][this.getGridIndex(clickY)];
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

        this.canvas.addEventListener("click", this.onClick.bind(this));
    }

    CanvasWrapper.prototype.draw = function() {
        this.raster.draw();

        if (this.polyline)
            this.polyline.draw();
    };

    CanvasWrapper.prototype.onClick = function(event) {
        var node = this.raster.getCoordinate(event.layerX, event.layerY);

        if (!this.polyline) {
            this.polyline = new Polyline(this);
        }

        this.polyline.addNode(node);
        this.raster.updateCheckState(this.polyline);
        this.draw();

        if (this.polyline.isComplete()) {
            if (this.raster.covered()) {
                alert("congrats");
            } else {
                alert("fail");
            }
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
        this.nodes[this.nodeCount] = newNode;
        ++this.nodeCount;
    };

    Polyline.prototype.draw = function() {        
        if (this.nodeCount > 0) {
            var canvas = this.canvasWrapper.canvas;
            var canvasContext = canvas.getContext("2d");
            var i;
             
            canvasContext.strokeStyle = context.lineColor;
            canvasContext.lineWidth = context.lineWidth;
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
