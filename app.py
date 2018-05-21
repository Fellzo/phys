from flask import *
from sympy import *

app = Flask(__name__)


@app.route('/', methods=['GET'])
def index():
    return render_template('index.html')


@app.route('/centroid', methods=['POST'])
def get_centroid():
    points_raw = request.get_json()['points']
    points = []
    for point in points_raw:
        points.append((point['x'], point['y']))
    polygon = Polygon(*points)
    polygon_center = polygon.centroid.evalf()
    return jsonify({
        'centroid': {
            'x': str(round(polygon_center.x)),
            'y': str(round(polygon_center.y))
        }
    })


@app.route('/curves', methods=['POST'])
def get_curves():
    points_raw = request.get_json()['points']
    curves_raw = request.get_json()['curves']
    points = [(point['x'], point['y']) for point in points_raw]
    curves = []
    for curve in curves_raw:
        curves.append(list((point['x'], point['y']) for point in curve))
        crv = curves[-1]
        for i in range(len(points)):
            if points[i] == crv[1]:
                if points[i - 1] == crv[2]:
                    curves[-1][1], curves[-1][2] = curves[-1][2], curves[-1][1]

    polygon = Polygon(*points)
    polygon_area = polygon.area
    direction = polygon_area < 0
    polygon_area = abs(polygon_area)
    polygon_centroid = polygon.centroid.evalf()
    for curve in curves:
        # curve[0] - bezier_pt 1, 2 - poly points
        curve[0], curve[1], curve[2] = curve[1], curve[2], curve[0]
        triangle = Triangle(*curve)
        bezier_area = (triangle.area.evalf() * 2 / 3)
        if not direction:
            bezier_area = -bezier_area
        bezier_centre = (0.4 * curve[0][0] + 0.4 * curve[1][0] + 0.2 * curve[2][0],
                         0.4 * curve[0][1] + 0.4 * curve[1][1] + 0.2 * curve[2][1])
        polygon_centroid = (polygon_centroid[0] * polygon_area + bezier_centre[0] * bezier_area) / (
                    bezier_area + polygon_area), (
                                       polygon_centroid[1] * polygon_area + bezier_centre[1] * bezier_area) / (
                                       bezier_area + polygon_area)
        polygon_area += bezier_area

    return jsonify({
        'center': json.dumps((round(polygon_centroid[0]), round(polygon_centroid[1])))
    })


if __name__ == '__main__':
    app.run()
