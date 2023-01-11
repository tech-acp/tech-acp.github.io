import 'dart:convert';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:timeago/timeago.dart' as timeago;
import 'lat_lng.dart';
import 'place.dart';
import '../backend/backend.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

bool validateStep(
  LatLng currentLocation,
  LatLng checkpointLocation,
) {
  double lat1 = checkpointLocation.latitude;
  double lon1 = checkpointLocation.longitude;
  double lat2 = currentLocation.latitude;
  double lon2 = currentLocation.longitude;
  var p = 0.017453292519943295;
  var c = math.cos;
  var a = 0.5 -
      c((lat2 - lat1) * p) / 2 +
      c(lat1 * p) * c(lat2 * p) * (1 - c((lon2 - lon1) * p)) / 2;
  // Returns distance in Kilo-meters
  var d = (12742 * math.asin(math.sqrt(a)));
  String inString = d.toStringAsFixed(2); // '2.35'
  double inDouble = double.parse(inString);
  return inDouble < 1;
}

double getLatitude(LatLng location) {
  return location.latitude;
}

double getLongitude(LatLng location) {
  return location.longitude;
}

LatLng toLatLng(
  String latitude,
  String longitude,
) {
  return LatLng(double.parse(latitude), double.parse(longitude));
}

bool disableValidateCheckpoint(
  int currentCheckpoint,
  int index,
) {
  return index != (currentCheckpoint + 1);
}

bool allCheckpointsValidated(
  List<CheckpointStruct> checkpoints,
  int currentCheckpoint,
) {
  return currentCheckpoint == checkpoints.length - 1;
}

int getFinishStep(List<CheckpointStruct> checkpoints) {
  return checkpoints.length + 1;
}

bool validateNextCheckpoint(
  LatLng currentLocation,
  int currentCheckpoint,
  List<CheckpointStruct> checkpoints,
) {
  if (currentCheckpoint == -2) {
    return false;
  } else {
    CheckpointStruct nextCheckpoint = checkpoints[currentCheckpoint + 1];

    return validateStep(currentLocation, nextCheckpoint.location!);
  }
}

CheckpointStruct getNextCheckpoint(
  int currentCheckpoint,
  List<CheckpointStruct> checkpoints,
) {
  return checkpoints[currentCheckpoint + 1];
}

int getDistanceBetweenCheckpoints(
  LatLng currentLocation,
  LatLng checkpointLocation,
) {
  double lat1 = checkpointLocation.latitude;
  double lon1 = checkpointLocation.longitude;
  double lat2 = currentLocation.latitude;
  double lon2 = currentLocation.longitude;
  var p = 0.017453292519943295;
  var c = math.cos;
  var a = 0.5 -
      c((lat2 - lat1) * p) / 2 +
      c(lat1 * p) * c(lat2 * p) * (1 - c((lon2 - lon1) * p)) / 2;
  // Returns distance in Kilo-meters
  var d = (12742 * math.asin(math.sqrt(a)));
  String inString = d.toStringAsFixed(2); // '2.35'
  double inDouble = double.parse(inString);
  return inDouble.round();
}

DateTime getLimitTime(
  String category,
  int distance,
  DateTime startTime,
) {
  int averageSpeed;

  if (distance >= 100 && distance <= 250) {
    averageSpeed = (category == 'or') ? 25 : 20;
  } else if (distance >= 251 && distance <= 400) {
    averageSpeed = (category == 'or') ? 24 : 19;
  } else if (distance >= 401 && distance <= 550) {
    averageSpeed = (category == 'or') ? 23 : 18;
  } else if (distance >= 551 && distance <= 700) {
    averageSpeed = (category == 'or') ? 22 : 17;
  } else if (distance >= 701 && distance <= 850) {
    averageSpeed = (category == 'or') ? 21 : 16;
  } else {
    averageSpeed = (category == 'or') ? 20 : 15;
  }

  double time = distance / averageSpeed;

  return startTime.add(Duration(minutes: (time * 60).toInt()));
}

String getRemainingTime(DateTime limitTime) {
  // get the numbers of hours and minutes from now to the given limitTime
  Duration timeLeft = limitTime.difference(DateTime.now());
  int hh = timeLeft.inHours as int;
  int mm = (timeLeft.inMinutes % 60) as int;
  int ss = (timeLeft.inSeconds % 60) as int;
  //todo change to actual hours and minutes and seconds instead of * 100;

  return "${hh}h ${mm}min";
}
