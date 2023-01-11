// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'user_event_struct.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

Serializer<UserEventStruct> _$userEventStructSerializer =
    new _$UserEventStructSerializer();

class _$UserEventStructSerializer
    implements StructuredSerializer<UserEventStruct> {
  @override
  final Iterable<Type> types = const [UserEventStruct, _$UserEventStruct];
  @override
  final String wireName = 'UserEventStruct';

  @override
  Iterable<Object?> serialize(Serializers serializers, UserEventStruct object,
      {FullType specifiedType = FullType.unspecified}) {
    final result = <Object?>[
      'firestoreUtilData',
      serializers.serialize(object.firestoreUtilData,
          specifiedType: const FullType(FirestoreUtilData)),
    ];
    Object? value;
    value = object.event;
    if (value != null) {
      result
        ..add('event')
        ..add(serializers.serialize(value,
            specifiedType: const FullType(
                DocumentReference, const [const FullType.nullable(Object)])));
    }
    value = object.currentCheckpoint;
    if (value != null) {
      result
        ..add('current_checkpoint')
        ..add(serializers.serialize(value, specifiedType: const FullType(int)));
    }
    return result;
  }

  @override
  UserEventStruct deserialize(
      Serializers serializers, Iterable<Object?> serialized,
      {FullType specifiedType = FullType.unspecified}) {
    final result = new UserEventStructBuilder();

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
        case 'current_checkpoint':
          result.currentCheckpoint = serializers.deserialize(value,
              specifiedType: const FullType(int)) as int?;
          break;
        case 'firestoreUtilData':
          result.firestoreUtilData = serializers.deserialize(value,
                  specifiedType: const FullType(FirestoreUtilData))!
              as FirestoreUtilData;
          break;
      }
    }

    return result.build();
  }
}

class _$UserEventStruct extends UserEventStruct {
  @override
  final DocumentReference<Object?>? event;
  @override
  final int? currentCheckpoint;
  @override
  final FirestoreUtilData firestoreUtilData;

  factory _$UserEventStruct([void Function(UserEventStructBuilder)? updates]) =>
      (new UserEventStructBuilder()..update(updates))._build();

  _$UserEventStruct._(
      {this.event, this.currentCheckpoint, required this.firestoreUtilData})
      : super._() {
    BuiltValueNullFieldError.checkNotNull(
        firestoreUtilData, r'UserEventStruct', 'firestoreUtilData');
  }

  @override
  UserEventStruct rebuild(void Function(UserEventStructBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  UserEventStructBuilder toBuilder() =>
      new UserEventStructBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is UserEventStruct &&
        event == other.event &&
        currentCheckpoint == other.currentCheckpoint &&
        firestoreUtilData == other.firestoreUtilData;
  }

  @override
  int get hashCode {
    return $jf($jc($jc($jc(0, event.hashCode), currentCheckpoint.hashCode),
        firestoreUtilData.hashCode));
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'UserEventStruct')
          ..add('event', event)
          ..add('currentCheckpoint', currentCheckpoint)
          ..add('firestoreUtilData', firestoreUtilData))
        .toString();
  }
}

class UserEventStructBuilder
    implements Builder<UserEventStruct, UserEventStructBuilder> {
  _$UserEventStruct? _$v;

  DocumentReference<Object?>? _event;
  DocumentReference<Object?>? get event => _$this._event;
  set event(DocumentReference<Object?>? event) => _$this._event = event;

  int? _currentCheckpoint;
  int? get currentCheckpoint => _$this._currentCheckpoint;
  set currentCheckpoint(int? currentCheckpoint) =>
      _$this._currentCheckpoint = currentCheckpoint;

  FirestoreUtilData? _firestoreUtilData;
  FirestoreUtilData? get firestoreUtilData => _$this._firestoreUtilData;
  set firestoreUtilData(FirestoreUtilData? firestoreUtilData) =>
      _$this._firestoreUtilData = firestoreUtilData;

  UserEventStructBuilder() {
    UserEventStruct._initializeBuilder(this);
  }

  UserEventStructBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _event = $v.event;
      _currentCheckpoint = $v.currentCheckpoint;
      _firestoreUtilData = $v.firestoreUtilData;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(UserEventStruct other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$UserEventStruct;
  }

  @override
  void update(void Function(UserEventStructBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  UserEventStruct build() => _build();

  _$UserEventStruct _build() {
    final _$result = _$v ??
        new _$UserEventStruct._(
            event: event,
            currentCheckpoint: currentCheckpoint,
            firestoreUtilData: BuiltValueNullFieldError.checkNotNull(
                firestoreUtilData, r'UserEventStruct', 'firestoreUtilData'));
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: always_put_control_body_on_new_line,always_specify_types,annotate_overrides,avoid_annotating_with_dynamic,avoid_as,avoid_catches_without_on_clauses,avoid_returning_this,deprecated_member_use_from_same_package,lines_longer_than_80_chars,no_leading_underscores_for_local_identifiers,omit_local_variable_types,prefer_expression_function_bodies,sort_constructors_first,test_types_in_equals,unnecessary_const,unnecessary_new,unnecessary_lambdas
