import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'flutter_flow/lat_lng.dart';

class FFAppState extends ChangeNotifier {
  static final FFAppState _instance = FFAppState._internal();

  factory FFAppState() {
    return _instance;
  }

  FFAppState._internal() {
    initializePersistedState();
  }

  Future initializePersistedState() async {
    prefs = await SharedPreferences.getInstance();
  }

  void update(VoidCallback callback) {
    callback();
    notifyListeners();
  }

  late SharedPreferences prefs;

  String _currentPlace = '';
  String get currentPlace => _currentPlace;
  set currentPlace(String _value) {
    _currentPlace = _value;
  }

  String _mapboxApiKey =
      'pk.eyJ1IjoiaHVnbzk0NjQiLCJhIjoiY2wxa3VxNDhvMDI1ajNlcHN5czFyZDg4NSJ9.pxhkJKgiJ4IwG5AIdEUoTg';
  String get mapboxApiKey => _mapboxApiKey;
  set mapboxApiKey(String _value) {
    _mapboxApiKey = _value;
  }
}

LatLng? _latLngFromString(String? val) {
  if (val == null) {
    return null;
  }
  final split = val.split(',');
  final lat = double.parse(split.first);
  final lng = double.parse(split.last);
  return LatLng(lat, lng);
}
