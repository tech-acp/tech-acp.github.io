import 'dart:async';

import '../index.dart';
import '../serializers.dart';
import 'package:built_value/built_value.dart';

part 'checkpoint_struct.g.dart';

abstract class CheckpointStruct
    implements Built<CheckpointStruct, CheckpointStructBuilder> {
  static Serializer<CheckpointStruct> get serializer =>
      _$checkpointStructSerializer;

  int? get position;

  String? get city;

  LatLng? get location;

  /// Utility class for Firestore updates
  FirestoreUtilData get firestoreUtilData;

  static void _initializeBuilder(CheckpointStructBuilder builder) => builder
    ..position = 0
    ..city = ''
    ..firestoreUtilData = FirestoreUtilData();

  CheckpointStruct._();
  factory CheckpointStruct([void Function(CheckpointStructBuilder) updates]) =
      _$CheckpointStruct;
}

CheckpointStruct createCheckpointStruct({
  int? position,
  String? city,
  LatLng? location,
  Map<String, dynamic> fieldValues = const {},
  bool clearUnsetFields = true,
  bool create = false,
  bool delete = false,
}) =>
    CheckpointStruct(
      (c) => c
        ..position = position
        ..city = city
        ..location = location
        ..firestoreUtilData = FirestoreUtilData(
          clearUnsetFields: clearUnsetFields,
          create: create,
          delete: delete,
          fieldValues: fieldValues,
        ),
    );

CheckpointStruct? updateCheckpointStruct(
  CheckpointStruct? checkpoint, {
  bool clearUnsetFields = true,
}) =>
    checkpoint != null
        ? (checkpoint.toBuilder()
              ..firestoreUtilData =
                  FirestoreUtilData(clearUnsetFields: clearUnsetFields))
            .build()
        : null;

void addCheckpointStructData(
  Map<String, dynamic> firestoreData,
  CheckpointStruct? checkpoint,
  String fieldName, [
  bool forFieldValue = false,
]) {
  firestoreData.remove(fieldName);
  if (checkpoint == null) {
    return;
  }
  if (checkpoint.firestoreUtilData.delete) {
    firestoreData[fieldName] = FieldValue.delete();
    return;
  }
  if (!forFieldValue && checkpoint.firestoreUtilData.clearUnsetFields) {
    firestoreData[fieldName] = <String, dynamic>{};
  }
  final checkpointData = getCheckpointFirestoreData(checkpoint, forFieldValue);
  final nestedData = checkpointData.map((k, v) => MapEntry('$fieldName.$k', v));

  final create = checkpoint.firestoreUtilData.create;
  firestoreData.addAll(create ? mergeNestedFields(nestedData) : nestedData);

  return;
}

Map<String, dynamic> getCheckpointFirestoreData(
  CheckpointStruct? checkpoint, [
  bool forFieldValue = false,
]) {
  if (checkpoint == null) {
    return {};
  }
  final firestoreData =
      serializers.toFirestore(CheckpointStruct.serializer, checkpoint);

  // Add any Firestore field values
  checkpoint.firestoreUtilData.fieldValues
      .forEach((k, v) => firestoreData[k] = v);

  return forFieldValue ? mergeNestedFields(firestoreData) : firestoreData;
}

List<Map<String, dynamic>> getCheckpointListFirestoreData(
  List<CheckpointStruct>? checkpoints,
) =>
    checkpoints?.map((c) => getCheckpointFirestoreData(c, true)).toList() ?? [];
