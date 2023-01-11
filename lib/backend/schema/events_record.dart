import 'dart:async';

import 'index.dart';
import 'serializers.dart';
import 'package:built_value/built_value.dart';

part 'events_record.g.dart';

abstract class EventsRecord
    implements Built<EventsRecord, EventsRecordBuilder> {
  static Serializer<EventsRecord> get serializer => _$eventsRecordSerializer;

  String? get type;

  BuiltList<CheckpointStruct>? get checkpoints;

  CheckpointStruct get start;

  CheckpointStruct get finish;

  int? get distance;

  @BuiltValueField(wireName: kDocumentReferenceField)
  DocumentReference? get ffRef;
  DocumentReference get reference => ffRef!;

  static void _initializeBuilder(EventsRecordBuilder builder) => builder
    ..type = ''
    ..checkpoints = ListBuilder()
    ..start = CheckpointStructBuilder()
    ..finish = CheckpointStructBuilder()
    ..distance = 0;

  static CollectionReference get collection =>
      FirebaseFirestore.instance.collection('events');

  static Stream<EventsRecord> getDocument(DocumentReference ref) => ref
      .snapshots()
      .map((s) => serializers.deserializeWith(serializer, serializedData(s))!);

  static Future<EventsRecord> getDocumentOnce(DocumentReference ref) => ref
      .get()
      .then((s) => serializers.deserializeWith(serializer, serializedData(s))!);

  EventsRecord._();
  factory EventsRecord([void Function(EventsRecordBuilder) updates]) =
      _$EventsRecord;

  static EventsRecord getDocumentFromData(
          Map<String, dynamic> data, DocumentReference reference) =>
      serializers.deserializeWith(serializer,
          {...mapFromFirestore(data), kDocumentReferenceField: reference})!;
}

Map<String, dynamic> createEventsRecordData({
  String? type,
  CheckpointStruct? start,
  CheckpointStruct? finish,
  int? distance,
}) {
  final firestoreData = serializers.toFirestore(
    EventsRecord.serializer,
    EventsRecord(
      (e) => e
        ..type = type
        ..checkpoints = null
        ..start = CheckpointStructBuilder()
        ..finish = CheckpointStructBuilder()
        ..distance = distance,
    ),
  );

  // Handle nested data for "start" field.
  addCheckpointStructData(firestoreData, start, 'start');

  // Handle nested data for "finish" field.
  addCheckpointStructData(firestoreData, finish, 'finish');

  return firestoreData;
}
