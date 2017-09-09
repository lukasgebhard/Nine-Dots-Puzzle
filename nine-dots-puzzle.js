(function() {
    "use strict";

    var context = {
        canvasId: "canvas-nine-dots-puzzle",
        dotColor: "blue",
        dotColorChecked: "red",
        dotRadius: 5
    };

    function Coordinate(parent, x, y) {
        this.raster = parent;
        this.x = x;
        this.y = y;
        this.checked = false;
        this.isDot = false;
    }

    Coordinate.prototype.draw = function() {
        var canvas = document.getElementById(context.canvasId);
        var canvasContext = canvas.getContext("2d");

        if (this.isDot) {
            canvasContext.fillStyle = context.dotColor;
            canvasContext.beginPath();
            canvasContext.arc(this.getPosition(true), this.getPosition(false), context.dotRadius, 0, 2 * Math.PI);
            canvasContext.fill();
            canvasContext.strokeStyle = context.dotColor;
            canvasContext.stroke();
        }
    };

    Coordinate.prototype.getPosition = function(horizontal) {
        var canvas = document.getElementById(context.canvasId);
        var canvasSize = canvas.width;
        var rasterSpacing = canvasSize / (this.raster.size + 2);
        var padding = rasterSpacing;

        return horizontal ? padding + this.y * rasterSpacing : padding + this.x * rasterSpacing;
    };

    function Raster(parent) {
        var x, y, dot;
        this.raster = parent;
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

    Raster.prototype.size = 8;
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

    Raster.prototype.getCoordinate = function(clickX, clickY) {
        var canvasSize = this.canvas.width;
        var rasterSpacing = canvasSize / (this.size + 2);
        var padding = rasterSpacing;

        function getGridIndex(clickPosition) {
            var gridIndex = ((clickPosition - padding) / rasterSpacing).int();

            if ((clickPosition % rasterSpacing) > (rasterSpacing / 2)) {
                ++gridIndex;
            }

            return gridIndex;
        }

        return this.coordinates[getGridIndex(clickX), getGridIndex(clickY)];
    };

    function Canvas() {
        // TODO remove coupling: insert canvas to DOM programmatically
        this.canvas = document.getElementById(context.canvasId);
        this.positionX = this.canvas.offsetLeft;
        this.positionY = this.canvas.offsetTop;
        this.height = this.canvas.height;
        this.width = this.canvas.width;
        this.raster = new Raster(this);

        this.canvas.addEventListener("click", function(event) {
            var clickX = event.pageX - this.positionX;
            var clickY = event.pageY - this.positionY;

            new Polyline(this, this.raster.getCoordinate(clickX, clickY));
        });
    }

    Canvas.prototype.draw = function() {
        this.raster.draw();
    };

    function Polyline(parent, startNode) {
        this.canvas = parent;
        this.nodes = new Array(3);
        this.nodes[0] = startNode;

        alert("Clicked at (" + startNode.x + ", " + startNode.y + ").");
    }

    (function() {
        var canvas = new Canvas();

        canvas.draw();
    })();
})();
