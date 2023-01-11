import 'dart:async';

import '../index.dart';
import '../serializers.dart';
import 'package:built_value/built_value.dart';

part 'user_event_struct.g.dart';

abstract class UserEventStruct
    implements Built<UserEventStruct, UserEventStructBuilder> {
  static Serializer<UserEventStruct> get serializer =>
      _$userEventStructSerializer;

  DocumentReference? get event;

  @BuiltValueField(wireName: 'current_checkpoint')
  int? get currentCheckpoint;

  /// Utility class for Firestore updates
  FirestoreUtilData get firestoreUtilData;

  static void _initializeBuilder(UserEventStructBuilder builder) => builder
    ..currentCheckpoint = 0
    ..firestoreUtilData = FirestoreUtilData();

  UserEventStruct._();
  factory UserEventStruct([void Function(UserEventStructBuilder) updates]) =
      _$UserEventStruct;
}

UserEventStruct createUserEventStruct({
  DocumentReference? event,
  int? currentCheckpoint,
  Map<String, dynamic> fieldValues = const {},
  bool clearUnsetFields = true,
  bool create = false,
  bool delete = false,
}) =>
    UserEventStruct(
      (u) => u
        ..event = event
        ..currentCheckpoint = currentCheckpoint
        ..firestoreUtilData = FirestoreUtilData(
          clearUnsetFields: clearUnsetFields,
          create: create,
          delete: delete,
          fieldValues: fieldValues,
        ),
    );

UserEventStruct? updateUserEventStruct(
  UserEventStruct? userEvent, {
  bool clearUnsetFields = true,
}) =>
    userEvent != null
        ? (userEvent.toBuilder()
              ..firestoreUtilData =
                  FirestoreUtilData(clearUnsetFields: clearUnsetFields))
            .build()
        : null;

void addUserEventStructData(
  Map<String, dynamic> firestoreData,
  UserEventStruct? userEvent,
  String fieldName, [
  bool forFieldValue = false,
]) {
  firestoreData.remove(fieldName);
  if (userEvent == null) {
    return;
  }
  if (userEvent.firestoreUtilData.delete) {
    firestoreData[fieldName] = FieldValue.delete();
    return;
  }
  if (!forFieldValue && userEvent.firestoreUtilData.clearUnsetFields) {
    firestoreData[fieldName] = <String, dynamic>{};
  }
  final userEventData = getUserEventFirestoreData(userEvent, forFieldValue);
  final nestedData = userEventData.map((k, v) => MapEntry('$fieldName.$k', v));

  final create = userEvent.firestoreUtilData.create;
  firestoreData.addAll(create ? mergeNestedFields(nestedData) : nestedData);

  return;
}

Map<String, dynamic> getUserEventFirestoreData(
  UserEventStruct? userEvent, [
  bool forFieldValue = false,
]) {
  if (userEvent == null) {
    return {};
  }
  final firestoreData =
      serializers.toFirestore(UserEventStruct.serializer, userEvent);

  // Add any Firestore field values
  userEvent.firestoreUtilData.fieldValues
      .forEach((k, v) => firestoreData[k] = v);

  return forFieldValue ? mergeNestedFields(firestoreData) : firestoreData;
}

List<Map<String, dynamic>> getUserEventListFirestoreData(
  List<UserEventStruct>? userEvents,
) =>
    userEvents?.map((u) => getUserEventFirestoreData(u, true)).toList() ?? [];
