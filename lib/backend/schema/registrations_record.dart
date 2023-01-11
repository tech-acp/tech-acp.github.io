import 'dart:async';

import 'index.dart';
import 'serializers.dart';
import 'package:built_value/built_value.dart';

part 'registrations_record.g.dart';

abstract class RegistrationsRecord
    implements Built<RegistrationsRecord, RegistrationsRecordBuilder> {
  static Serializer<RegistrationsRecord> get serializer =>
      _$registrationsRecordSerializer;

  DocumentReference? get event;

  String? get id;

  String? get status;

  @BuiltValueField(wireName: 'current_checkpoint')
  int? get currentCheckpoint;

  String? get category;

  bool? get started;

  @BuiltValueField(wireName: 'start_time')
  DateTime? get startTime;

  @BuiltValueField(wireName: 'limit_time')
  DateTime? get limitTime;

  @BuiltValueField(wireName: kDocumentReferenceField)
  DocumentReference? get ffRef;
  DocumentReference get reference => ffRef!;

  static void _initializeBuilder(RegistrationsRecordBuilder builder) => builder
    ..id = ''
    ..status = ''
    ..currentCheckpoint = 0
    ..category = ''
    ..started = false;

  static CollectionReference get collection =>
      FirebaseFirestore.instance.collection('registrations');

  static Stream<RegistrationsRecord> getDocument(DocumentReference ref) => ref
      .snapshots()
      .map((s) => serializers.deserializeWith(serializer, serializedData(s))!);

  static Future<RegistrationsRecord> getDocumentOnce(DocumentReference ref) =>
      ref.get().then(
          (s) => serializers.deserializeWith(serializer, serializedData(s))!);

  RegistrationsRecord._();
  factory RegistrationsRecord(
          [void Function(RegistrationsRecordBuilder) updates]) =
      _$RegistrationsRecord;

  static RegistrationsRecord getDocumentFromData(
          Map<String, dynamic> data, DocumentReference reference) =>
      serializers.deserializeWith(serializer,
          {...mapFromFirestore(data), kDocumentReferenceField: reference})!;
}

Map<String, dynamic> createRegistrationsRecordData({
  DocumentReference? event,
  String? id,
  String? status,
  int? currentCheckpoint,
  String? category,
  bool? started,
  DateTime? startTime,
  DateTime? limitTime,
}) {
  final firestoreData = serializers.toFirestore(
    RegistrationsRecord.serializer,
    RegistrationsRecord(
      (r) => r
        ..event = event
        ..id = id
        ..status = status
        ..currentCheckpoint = currentCheckpoint
        ..category = category
        ..started = started
        ..startTime = startTime
        ..limitTime = limitTime,
    ),
  );

  return firestoreData;
}
