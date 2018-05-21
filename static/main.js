var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Math['radians'] = function (degrees) {
    return degrees * Math.PI / 180;
};
// Converts from radians to degrees.
Math['degrees'] = function (radians) {
    return radians * 180 / Math.PI;
};
var Shape = /** @class */ (function (_super) {
    __extends(Shape, _super);
    function Shape() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return Shape;
}(createjs.Shape));
var Point2D = /** @class */ (function () {
    function Point2D(x, y) {
        this.x = x;
        this.y = y;
    }
    Point2D.prototype.toJson = function () {
        return JSON.stringify({
            x: this.x,
            y: this.y
        });
    };
    return Point2D;
}());
defaultConfig = {
    point: {
        color: 'green',
        radius: 4
    },
    centroid: {
        color: 'magenta',
        radius: 5
    },
    gridSize: 25,
    gridColor: '#50E3FF',
    canvasWidth: 5000,
    canvasHeight: 2000,
    pickedPointColor: 'red'
};
pointsShapes = [];
pickedPoints = [];
pointsPicks = [];
bezierPoint = new Shape;
centroidShape = new Shape;
pickedPointsInds = [];
points = [];
lines = [];
curves = [];
centroid = new Point2D(-1, -1);
function init() {
    canvas = new createjs.Stage(document.getElementById('centerMass'));
    canvas.on('stagemousedown', drawPointEvent);
    document.onkeydown = undoDrawPoint;
    drawGrid();
}
function undoDrawPoint(event) {
    if (event.key == 'z' && event.ctrlKey) {
        if (points.length > 0) {
            points.pop();
            var shape = pointsShapes.pop();
            shape.graphics.clear();
            canvas.removeChildAt(canvas.getChildIndex(shape));
            if (lines.length > 0) {
                var line = lines.pop();
                canvas.removeChildAt(canvas.getChildIndex(line));
            }
            canvas.update();
            updateInfo();
        }
    }
}
function drawGrid() {
    var VLine = new Shape();
    canvas.addChild(VLine);
    for (var i = 0; i < defaultConfig.canvasWidth; i += defaultConfig.gridSize) {
        VLine.graphics.setStrokeStyle(1).beginStroke(defaultConfig.gridColor);
        VLine.graphics.moveTo(i, 0);
        VLine.graphics.lineTo(i, defaultConfig.canvasHeight);
        VLine.graphics.endStroke();
        canvas.update();
    }
    var HLine = new Shape();
    canvas.addChild(HLine);
    for (var i = 0; i < defaultConfig.canvasHeight; i += defaultConfig.gridSize) {
        HLine.graphics.setStrokeStyle(1).beginStroke(defaultConfig.gridColor);
        HLine.graphics.moveTo(0, i);
        HLine.graphics.lineTo(defaultConfig.canvasWidth, i);
        HLine.graphics.endStroke();
        canvas.update();
    }
    updateInfo();
}
function finishDrawEvent() {
    drawLineBetweenLastPoints(true);
    $.LoadingOverlay('show');
    document.onkeydown = function () { };
    $(this).attr('disabled', 'true');
    var centroidRaw;
    fetch('/centroid', {
        'method': 'POST',
        'headers': {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            points: points
        })
    }).then(function (response) {
        return response.json();
    }).then(function (json) {
        centroidRaw = json.centroid;
        centroid = new Point2D(centroidRaw.x, centroidRaw.y);
        centroidShape = drawPoint(new Point2D(centroid.x, centroid.y), defaultConfig.centroid);
        centroidShape.x = parseFloat(centroidShape.x);
        centroidShape.y = parseFloat(centroidShape.y);
        updateInfo();
        $.LoadingOverlay('hide');
    });
    for (var i in pointsShapes) {
        pointsShapes[i].state = 'not picked';
        pointsShapes[i].addEventListener('click', pickPoint);
    }
    canvas.removeAllEventListeners('stagemousedown');
}
function pickPoint(event) {
    var x = event.target.x;
    var y = event.target.y;
    var pointInd = -1;
    for (var i = 0; i < points.length; ++i) {
        if (points[i].x == x && points[i].y == y) {
            pointInd = i;
            break;
        }
    }
    if (pickedPointsInds.length > 0) {
        var prev = pickedPointsInds[0];
        if (Math.abs(prev - pointInd) != 1) {
            if (pointInd != points.length - 1 && prev != points.length - 1) {
                return;
            }
            if (!((pointInd == 0 && prev == points.length - 1) || (prev == 0 && pointInd == points.length - 1))) {
                return;
            }
        }
    }
    pickedPointsInds.push(pointInd);
    pickedPoints.push(event.target);
    var color = event.target.state == 'picked' ? defaultConfig.point.color : defaultConfig.pickedPointColor;
    event.target.state = event.target.state == 'picked' ? 'not picked' : 'picked';
    event.target.graphics.beginFill(color).drawCircle(0, 0, defaultConfig.point.radius).endFill('red');
    canvas.update();
    if (pickedPoints.length == 2) {
        canvas.addEventListener('stagemousedown', createBezierPoint);
    }
}
function createBezierPoint(event) {
    bezierPoint = drawPoint(new Point2D(event.stageX, event.stageY), { color: 'red', radius: 10 });
    drawCurves();
}
function drawCurves() {
    var curve = new Shape();
    $.LoadingOverlay('show');
    curve.graphics.beginStroke('black').bezierCurveTo(pickedPoints[0].x, pickedPoints[0].y, bezierPoint.x, bezierPoint.y, pickedPoints[1].x, pickedPoints[1].y).endStroke();
    canvas.addChild(curve);
    var p1Ind = pickedPointsInds[0];
    var p2Ind = pickedPointsInds[1];
    curves.push([new Point2D(bezierPoint.x, bezierPoint.y), points[p1Ind], points[p2Ind]]);
    pointsShapes[p1Ind].state = 'not picked';
    pointsShapes[p1Ind].graphics.beginFill(defaultConfig.point.color).drawCircle(0, 0, defaultConfig.point.radius).endFill();
    pointsShapes[p2Ind].state = 'not picked';
    pointsShapes[p2Ind].graphics.beginFill(defaultConfig.point.color).drawCircle(0, 0, defaultConfig.point.radius).endFill();
    canvas.removeAllEventListeners('stagemousedown');
    canvas.removeChild(bezierPoint);
    canvas.update();
    pickedPoints = [];
    pickedPointsInds = [];
    fetch('/curves', {
        'method': 'POST',
        'headers': {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            points: points,
            curves: curves
        })
    }).then(function (response) {
        return response.json();
    }).then(function (json) {
        var center = JSON.parse(json['center']);
        centroidShape.x = center[0];
        centroidShape.y = center[1];
        centroid = new Point2D(center[0], center[1]);
        $.LoadingOverlay('hide');
        if (Math.abs(p1Ind - p2Ind) == 1)
            lines[Math.min(p1Ind, p2Ind)].graphics.clear();
        else
            lines[lines.length - 1].graphics.clear();
        canvas.update();
    });
}
function drawPoint(point, cfg) {
    if (cfg === void 0) { cfg = defaultConfig.point; }
    var circle = new Shape();
    circle.snapToPixel = true;
    circle.graphics.beginFill(cfg.color).drawCircle(0, 0, cfg.radius).endFill();
    circle.x = point.x;
    circle.y = point.y;
    canvas.addChild(circle);
    canvas.update();
    return circle;
}
function createPoint(point) {
    var circle = drawPoint(point);
    pointsShapes.push(circle);
    points.push(point);
    drawLineBetweenLastPoints();
    updateInfo();
}
function drawLineBetweenLastPoints(finish) {
    if (finish === void 0) { finish = false; }
    if (points.length > 1) {
        var pt1 = points[points.length - 1];
        var pt2 = points[points.length - 2];
        if (finish) {
            pt2 = pt1;
            pt1 = points[0];
        }
        var line = new Shape();
        canvas.addChild(line);
        line.graphics.setStrokeStyle(1).beginStroke('black');
        line.graphics.moveTo(pt1.x, pt1.y).lineTo(pt2.x, pt2.y);
        line.graphics.endStroke();
        lines.push(line);
        canvas.update();
    }
    if (points.length == 3) {
        $('#finishBtn').removeAttr('disabled').click(finishDrawEvent);
    }
}
function drawPointEvent(event) {
    var point = new Point2D(event.stageX, event.stageY);
    createPoint(point);
}
function updateInfo() {
    $('#pointsInfo').html('');
    $('#centroidInfo').html('<tr><td>' + (centroid.x == -1 ? 'Неопредленна' : centroid.x) + '</td><td>' + (centroid.y == -1 ? 'Неопредленна' : centroid.y) + '</td></tr>');
    points.forEach(function (point) {
        $('<tr><td>' + point.x + '</td><td>' +
            point.y + '</td></tr>').appendTo('#pointsInfo');
    });
}
$('#start').click(function () {
    $('#animationInfo').modal('toggle');
    var speed = $('#speed').val();
    var angle = Math.radians(parseInt($('#angle').val()) + 30);
    var maxT = 2 * speed * Math.sin(angle) / 9.8;
    var i = 0;
    var y, x;
    var sy = centroidShape.y;
    var int = setInterval(function () {
        y = speed * Math.sin(angle) * i - 9.8 * i * i / 2;
        x = speed * Math.cos(angle) * i;
        drawPoint(new Point2D(centroidShape.x, centroidShape.y), { color: 'red', radius: 2 });
        centroidShape.x += x * 25;
        centroidShape.y -= y * 25;
        console.log(centroidShape);
        console.log(i);
        canvas.update();
        i += 0.01;
        if (centroidShape.y >= sy && i > 0.5) {
            clearInterval(int);
            return;
        }
    }, 10);
});
//# sourceMappingURL=main.js.map