// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'registrations_record.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

Serializer<RegistrationsRecord> _$registrationsRecordSerializer =
    new _$RegistrationsRecordSerializer();

class _$RegistrationsRecordSerializer
    implements StructuredSerializer<RegistrationsRecord> {
  @override
  final Iterable<Type> types = const [
    RegistrationsRecord,
    _$RegistrationsRecord
  ];
  @override
  final String wireName = 'RegistrationsRecord';

  @override
  Iterable<Object?> serialize(
      Serializers serializers, RegistrationsRecord object,
      {FullType specifiedType = FullType.unspecified}) {
    final result = <Object?>[];
    Object? value;
    value = object.event;
    if (value != null) {
      result
        ..add('event')
        ..add(serializers.serialize(value,
            specifiedType: const FullType(
                DocumentReference, const [const FullType.nullable(Object)])));
    }
    value = object.id;
    if (value != null) {
      result
        ..add('id')
        ..add(serializers.serialize(value,
            specifiedType: const FullType(String)));
    }
    value = object.status;
    if (value != null) {
      result
        ..add('status')
        ..add(serializers.serialize(value,
            specifiedType: const FullType(String)));
    }
    value = object.currentCheckpoint;
    if (value != null) {
      result
        ..add('current_checkpoint')
        ..add(serializers.serialize(value, specifiedType: const FullType(int)));
    }
    value = object.category;
    if (value != null) {
      result
        ..add('category')
        ..add(serializers.serialize(value,
            specifiedType: const FullType(String)));
    }
    value = object.started;
    if (value != null) {
      result
        ..add('started')
        ..add(
            serializers.serialize(value, specifiedType: const FullType(bool)));
    }
    value = object.startTime;
    if (value != null) {
      result
        ..add('start_time')
        ..add(serializers.serialize(value,
            specifiedType: const FullType(DateTime)));
    }
    value = object.limitTime;
    if (value != null) {
      result
        ..add('limit_time')
        ..add(serializers.serialize(value,
            specifiedType: const FullType(DateTime)));
    }
    value = object.ffRef;
    if (value != null) {
      result
        ..add('Document__Reference__Field')
        ..add(serializers.serialize(value,
            specifiedType: const FullType(
                DocumentReference, const [const FullType.nullable(Object)])));
    }
    return result;
  }

  @override
  RegistrationsRecord deserialize(
      Serializers serializers, Iterable<Object?> serialized,
      {FullType specifiedType = FullType.unspecified}) {
    final result = new RegistrationsRecordBuilder();

    final iterator = serialized.iterator;
    while (iterator.moveNext()) {
      final key = iterator.current! as String;
      iterator.moveNext();
      final Object? value = iterator.current;
      switch (key) {
        case 'event':
          result.event = serializers.deserialize(value,
              specifiedType: const FullType(DocumentReference, const [
                const FullType.nullable(Object)
              ])) as DocumentReference<Object?>?;
          break;
        case 'id':
          result.id = serializers.deserialize(value,
              specifiedType: const FullType(String)) as String?;
          break;
        case 'status':
          result.status = serializers.deserialize(value,
              specifiedType: const FullType(String)) as String?;
          break;
        case 'current_checkpoint':
          result.currentCheckpoint = serializers.deserialize(value,
              specifiedType: const FullType(int)) as int?;
          break;
        case 'category':
          result.category = serializers.deserialize(value,
              specifiedType: const FullType(String)) as String?;
          break;
        case 'started':
          result.started = serializers.deserialize(value,
              specifiedType: const FullType(bool)) as bool?;
          break;
        case 'start_time':
          result.startTime = serializers.deserialize(value,
              specifiedType: const FullType(DateTime)) as DateTime?;
          break;
        case 'limit_time':
          result.limitTime = serializers.deserialize(value,
              specifiedType: const FullType(DateTime)) as DateTime?;
          break;
        case 'Document__Reference__Field':
          result.ffRef = serializers.deserialize(value,
              specifiedType: const FullType(DocumentReference, const [
                const FullType.nullable(Object)
              ])) as DocumentReference<Object?>?;
          break;
      }
    }

    return result.build();
  }
}

class _$RegistrationsRecord extends RegistrationsRecord {
  @override
  final DocumentReference<Object?>? event;
  @override
  final String? id;
  @override
  final String? status;
  @override
  final int? currentCheckpoint;
  @override
  final String? category;
  @override
  final bool? started;
  @override
  final DateTime? startTime;
  @override
  final DateTime? limitTime;
  @override
  final DocumentReference<Object?>? ffRef;

  factory _$RegistrationsRecord(
          [void Function(RegistrationsRecordBuilder)? updates]) =>
      (new RegistrationsRecordBuilder()..update(updates))._build();

  _$RegistrationsRecord._(
      {this.event,
      this.id,
      this.status,
      this.currentCheckpoint,
      this.category,
      this.started,
      this.startTime,
      this.limitTime,
      this.ffRef})
      : super._();

  @override
  RegistrationsRecord rebuild(
          void Function(RegistrationsRecordBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  RegistrationsRecordBuilder toBuilder() =>
      new RegistrationsRecordBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is RegistrationsRecord &&
        event == other.event &&
        id == other.id &&
        status == other.status &&
        currentCheckpoint == other.currentCheckpoint &&
        category == other.category &&
        started == other.started &&
        startTime == other.startTime &&
        limitTime == other.limitTime &&
        ffRef == other.ffRef;
  }

  @override
  int get hashCode {
    return $jf($jc(
        $jc(
            $jc(
                $jc(
                    $jc(
                        $jc(
                            $jc($jc($jc(0, event.hashCode), id.hashCode),
                                status.hashCode),
                            currentCheckpoint.hashCode),
                        category.hashCode),
                    started.hashCode),
                startTime.hashCode),
            limitTime.hashCode),
        ffRef.hashCode));
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'RegistrationsRecord')
          ..add('event', event)
          ..add('id', id)
          ..add('status', status)
          ..add('currentCheckpoint', currentCheckpoint)
          ..add('category', category)
          ..add('started', started)
          ..add('startTime', startTime)
          ..add('limitTime', limitTime)
          ..add('ffRef', ffRef))
        .toString();
  }
}

class RegistrationsRecordBuilder
    implements Builder<RegistrationsRecord, RegistrationsRecordBuilder> {
  _$RegistrationsRecord? _$v;

  DocumentReference<Object?>? _event;
  DocumentReference<Object?>? get event => _$this._event;
  set event(DocumentReference<Object?>? event) => _$this._event = event;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  String? _status;
  String? get status => _$this._status;
  set status(String? status) => _$this._status = status;

  int? _currentCheckpoint;
  int? get currentCheckpoint => _$this._currentCheckpoint;
  set currentCheckpoint(int? currentCheckpoint) =>
      _$this._currentCheckpoint = currentCheckpoint;

  String? _category;
  String? get category => _$this._category;
  set category(String? category) => _$this._category = category;

  bool? _started;
  bool? get started => _$this._started;
  set started(bool? started) => _$this._started = started;

  DateTime? _startTime;
  DateTime? get startTime => _$this._startTime;
  set startTime(DateTime? startTime) => _$this._startTime = startTime;

  DateTime? _limitTime;
  DateTime? get limitTime => _$this._limitTime;
  set limitTime(DateTime? limitTime) => _$this._limitTime = limitTime;

  DocumentReference<Object?>? _ffRef;
  DocumentReference<Object?>? get ffRef => _$this._ffRef;
  set ffRef(DocumentReference<Object?>? ffRef) => _$this._ffRef = ffRef;

  RegistrationsRecordBuilder() {
    RegistrationsRecord._initializeBuilder(this);
  }

  RegistrationsRecordBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _event = $v.event;
      _id = $v.id;
      _status = $v.status;
      _currentCheckpoint = $v.currentCheckpoint;
      _category = $v.category;
      _started = $v.started;
      _startTime = $v.startTime;
      _limitTime = $v.limitTime;
      _ffRef = $v.ffRef;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(RegistrationsRecord other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$RegistrationsRecord;
  }

  @override
  void update(void Function(RegistrationsRecordBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  RegistrationsRecord build() => _build();

  _$RegistrationsRecord _build() {
    final _$result = _$v ??
        new _$RegistrationsRecord._(
            event: event,
            id: id,
            status: status,
            currentCheckpoint: currentCheckpoint,
            category: category,
            started: started,
            startTime: startTime,
            limitTime: limitTime,
            ffRef: ffRef);
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: always_put_control_body_on_new_line,always_specify_types,annotate_overrides,avoid_annotating_with_dynamic,avoid_as,avoid_catches_without_on_clauses,avoid_returning_this,deprecated_member_use_from_same_package,lines_longer_than_80_chars,no_leading_underscores_for_local_identifiers,omit_local_variable_types,prefer_expression_function_bodies,sort_constructors_first,test_types_in_equals,unnecessary_const,unnecessary_new,unnecessary_lambdas
