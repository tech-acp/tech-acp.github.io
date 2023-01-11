// Automatic FlutterFlow imports
import '../../backend/backend.dart';
import '../../flutter_flow/flutter_flow_theme.dart';
import '../../flutter_flow/flutter_flow_util.dart';
import 'index.dart'; // Imports other custom widgets
import '../../flutter_flow/custom_functions.dart'; // Imports custom functions
import 'package:flutter/material.dart';
// Begin custom widget code
// DO NOT REMOVE OR MODIFY THE CODE ABOVE!

import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart' as latlon;

class OpenStreetMap extends StatefulWidget {
  const OpenStreetMap({
    Key? key,
    this.width,
    this.height,
    required this.startLocation,
    required this.finishLocation,
    required this.checkpoints,
  }) : super(key: key);

  final double? width;
  final double? height;
  final LatLng startLocation;
  final LatLng finishLocation;
  final List<LatLng> checkpoints;

  @override
  _OpenStreetMapState createState() => _OpenStreetMapState();
}

class _OpenStreetMapState extends State<OpenStreetMap> {
  @override
  Widget build(BuildContext context) {
    return FlutterMap(
      mapController: MapController(),
      options: MapOptions(
        center: latlon.LatLng(46.227638, 2.213749),
        zoom: 6,
      ),
      nonRotatedChildren: [
        AttributionWidget.defaultWidget(
          source: 'OpenStreetMap contributors',
          onSourceTapped: null,
        ),
      ],
      children: [
        TileLayer(
          urlTemplate:
              'https://tile.thunderforest.com/atlas/{z}/{x}/{y}.png?apikey=c039ca3093f842ac8ffd0039ad22226c',
          userAgentPackageName: 'com.example.app',
        ),
        PolylineLayer(
          polylineCulling: false,
          polylines: [
            Polyline(
              points: widget.checkpoints
                  .map((checkpoint) =>
                      latlon.LatLng(checkpoint.latitude, checkpoint.longitude))
                  .toList()
                ..insert(
                    0,
                    latlon.LatLng(widget.startLocation.latitude,
                        widget.startLocation.longitude))
                ..add(latlon.LatLng(widget.finishLocation.latitude,
                    widget.finishLocation.longitude)),
              color: Color.fromARGB(255, 61, 33, 243),
              strokeWidth: 2,
            ),
          ],
        ),
        MarkerLayer(
          markers: [
            Marker(
              point: latlon.LatLng(widget.startLocation.latitude,
                  widget.startLocation.longitude),
              anchorPos: AnchorPos.align(AnchorAlign.bottom),
              width: 8,
              height: 8,
              builder: (context) => Container(
                //key: Key('blue'),
                child: Icon(
                  Icons.flag,
                  color: Color.fromARGB(255, 54, 244, 127),
                  size: 30.0,
                ),
              ),
            ),
            Marker(
              point: latlon.LatLng(widget.finishLocation.latitude,
                  widget.finishLocation.longitude),
              anchorPos: AnchorPos.align(AnchorAlign.bottom),
              width: 8,
              height: 8,
              builder: (context) => Container(
                //key: Key('blue'),
                child: Icon(
                  Icons.sports_score,
                  color: Color.fromARGB(255, 244, 54, 73),
                  size: 30.0,
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }
}
