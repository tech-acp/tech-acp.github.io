// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'events_record.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

Serializer<EventsRecord> _$eventsRecordSerializer =
    new _$EventsRecordSerializer();

class _$EventsRecordSerializer implements StructuredSerializer<EventsRecord> {
  @override
  final Iterable<Type> types = const [EventsRecord, _$EventsRecord];
  @override
  final String wireName = 'EventsRecord';

  @override
  Iterable<Object?> serialize(Serializers serializers, EventsRecord object,
      {FullType specifiedType = FullType.unspecified}) {
    final result = <Object?>[
      'start',
      serializers.serialize(object.start,
          specifiedType: const FullType(CheckpointStruct)),
      'finish',
      serializers.serialize(object.finish,
          specifiedType: const FullType(CheckpointStruct)),
    ];
    Object? value;
    value = object.type;
    if (value != null) {
      result
        ..add('type')
        ..add(serializers.serialize(value,
            specifiedType: const FullType(String)));
    }
    value = object.checkpoints;
    if (value != null) {
      result
        ..add('checkpoints')
        ..add(serializers.serialize(value,
            specifiedType: const FullType(
                BuiltList, const [const FullType(CheckpointStruct)])));
    }
    value = object.distance;
    if (value != null) {
      result
        ..add('distance')
        ..add(serializers.serialize(value, specifiedType: const FullType(int)));
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
  EventsRecord deserialize(
      Serializers serializers, Iterable<Object?> serialized,
      {FullType specifiedType = FullType.unspecified}) {
    final result = new EventsRecordBuilder();

    final iterator = serialized.iterator;
    while (iterator.moveNext()) {
      final key = iterator.current! as String;
      iterator.moveNext();
      final Object? value = iterator.current;
      switch (key) {
        case 'type':
          result.type = serializers.deserialize(value,
              specifiedType: const FullType(String)) as String?;
          break;
        case 'checkpoints':
          result.checkpoints.replace(serializers.deserialize(value,
                  specifiedType: const FullType(
                      BuiltList, const [const FullType(CheckpointStruct)]))!
              as BuiltList<Object?>);
          break;
        case 'start':
          result.start.replace(serializers.deserialize(value,
                  specifiedType: const FullType(CheckpointStruct))!
              as CheckpointStruct);
          break;
        case 'finish':
          result.finish.replace(serializers.deserialize(value,
                  specifiedType: const FullType(CheckpointStruct))!
              as CheckpointStruct);
          break;
        case 'distance':
          result.distance = serializers.deserialize(value,
              specifiedType: const FullType(int)) as int?;
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

class _$EventsRecord extends EventsRecord {
  @override
  final String? type;
  @override
  final BuiltList<CheckpointStruct>? checkpoints;
  @override
  final CheckpointStruct start;
  @override
  final CheckpointStruct finish;
  @override
  final int? distance;
  @override
  final DocumentReference<Object?>? ffRef;

  factory _$EventsRecord([void Function(EventsRecordBuilder)? updates]) =>
      (new EventsRecordBuilder()..update(updates))._build();

  _$EventsRecord._(
      {this.type,
      this.checkpoints,
      required this.start,
      required this.finish,
      this.distance,
      this.ffRef})
      : super._() {
    BuiltValueNullFieldError.checkNotNull(start, r'EventsRecord', 'start');
    BuiltValueNullFieldError.checkNotNull(finish, r'EventsRecord', 'finish');
  }

  @override
  EventsRecord rebuild(void Function(EventsRecordBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  EventsRecordBuilder toBuilder() => new EventsRecordBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is EventsRecord &&
        type == other.type &&
        checkpoints == other.checkpoints &&
        start == other.start &&
        finish == other.finish &&
        distance == other.distance &&
        ffRef == other.ffRef;
  }

  @override
  int get hashCode {
    return $jf($jc(
        $jc(
            $jc(
                $jc($jc($jc(0, type.hashCode), checkpoints.hashCode),
                    start.hashCode),
                finish.hashCode),
            distance.hashCode),
        ffRef.hashCode));
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'EventsRecord')
          ..add('type', type)
          ..add('checkpoints', checkpoints)
          ..add('start', start)
          ..add('finish', finish)
          ..add('distance', distance)
          ..add('ffRef', ffRef))
        .toString();
  }
}

class EventsRecordBuilder
    implements Builder<EventsRecord, EventsRecordBuilder> {
  _$EventsRecord? _$v;

  String? _type;
  String? get type => _$this._type;
  set type(String? type) => _$this._type = type;

  ListBuilder<CheckpointStruct>? _checkpoints;
  ListBuilder<CheckpointStruct> get checkpoints =>
      _$this._checkpoints ??= new ListBuilder<CheckpointStruct>();
  set checkpoints(ListBuilder<CheckpointStruct>? checkpoints) =>
      _$this._checkpoints = checkpoints;

  CheckpointStructBuilder? _start;
  CheckpointStructBuilder get start =>
      _$this._start ??= new CheckpointStructBuilder();
  set start(CheckpointStructBuilder? start) => _$this._start = start;

  CheckpointStructBuilder? _finish;
  CheckpointStructBuilder get finish =>
      _$this._finish ??= new CheckpointStructBuilder();
  set finish(CheckpointStructBuilder? finish) => _$this._finish = finish;

  int? _distance;
  int? get distance => _$this._distance;
  set distance(int? distance) => _$this._distance = distance;

  DocumentReference<Object?>? _ffRef;
  DocumentReference<Object?>? get ffRef => _$this._ffRef;
  set ffRef(DocumentReference<Object?>? ffRef) => _$this._ffRef = ffRef;

  EventsRecordBuilder() {
    EventsRecord._initializeBuilder(this);
  }

  EventsRecordBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _type = $v.type;
      _checkpoints = $v.checkpoints?.toBuilder();
      _start = $v.start.toBuilder();
      _finish = $v.finish.toBuilder();
      _distance = $v.distance;
      _ffRef = $v.ffRef;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(EventsRecord other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$EventsRecord;
  }

  @override
  void update(void Function(EventsRecordBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  EventsRecord build() => _build();

  _$EventsRecord _build() {
    _$EventsRecord _$result;
    try {
      _$result = _$v ??
          new _$EventsRecord._(
              type: type,
              checkpoints: _checkpoints?.build(),
              start: start.build(),
              finish: finish.build(),
              distance: distance,
              ffRef: ffRef);
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'checkpoints';
        _checkpoints?.build();
        _$failedField = 'start';
        start.build();
        _$failedField = 'finish';
        finish.build();
      } catch (e) {
        throw new BuiltValueNestedFieldError(
            r'EventsRecord', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: always_put_control_body_on_new_line,always_specify_types,annotate_overrides,avoid_annotating_with_dynamic,avoid_as,avoid_catches_without_on_clauses,avoid_returning_this,deprecated_member_use_from_same_package,lines_longer_than_80_chars,no_leading_underscores_for_local_identifiers,omit_local_variable_types,prefer_expression_function_bodies,sort_constructors_first,test_types_in_equals,unnecessary_const,unnecessary_new,unnecessary_lambdas
