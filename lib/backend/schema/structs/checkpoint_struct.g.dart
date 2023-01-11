// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'checkpoint_struct.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

Serializer<CheckpointStruct> _$checkpointStructSerializer =
    new _$CheckpointStructSerializer();

class _$CheckpointStructSerializer
    implements StructuredSerializer<CheckpointStruct> {
  @override
  final Iterable<Type> types = const [CheckpointStruct, _$CheckpointStruct];
  @override
  final String wireName = 'CheckpointStruct';

  @override
  Iterable<Object?> serialize(Serializers serializers, CheckpointStruct object,
      {FullType specifiedType = FullType.unspecified}) {
    final result = <Object?>[
      'firestoreUtilData',
      serializers.serialize(object.firestoreUtilData,
          specifiedType: const FullType(FirestoreUtilData)),
    ];
    Object? value;
    value = object.position;
    if (value != null) {
      result
        ..add('position')
        ..add(serializers.serialize(value, specifiedType: const FullType(int)));
    }
    value = object.city;
    if (value != null) {
      result
        ..add('city')
        ..add(serializers.serialize(value,
            specifiedType: const FullType(String)));
    }
    value = object.location;
    if (value != null) {
      result
        ..add('location')
        ..add(serializers.serialize(value,
            specifiedType: const FullType(LatLng)));
    }
    return result;
  }

  @override
  CheckpointStruct deserialize(
      Serializers serializers, Iterable<Object?> serialized,
      {FullType specifiedType = FullType.unspecified}) {
    final result = new CheckpointStructBuilder();

    final iterator = serialized.iterator;
    while (iterator.moveNext()) {
      final key = iterator.current! as String;
      iterator.moveNext();
      final Object? value = iterator.current;
      switch (key) {
        case 'position':
          result.position = serializers.deserialize(value,
              specifiedType: const FullType(int)) as int?;
          break;
        case 'city':
          result.city = serializers.deserialize(value,
              specifiedType: const FullType(String)) as String?;
          break;
        case 'location':
          result.location = serializers.deserialize(value,
              specifiedType: const FullType(LatLng)) as LatLng?;
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

class _$CheckpointStruct extends CheckpointStruct {
  @override
  final int? position;
  @override
  final String? city;
  @override
  final LatLng? location;
  @override
  final FirestoreUtilData firestoreUtilData;

  factory _$CheckpointStruct(
          [void Function(CheckpointStructBuilder)? updates]) =>
      (new CheckpointStructBuilder()..update(updates))._build();

  _$CheckpointStruct._(
      {this.position,
      this.city,
      this.location,
      required this.firestoreUtilData})
      : super._() {
    BuiltValueNullFieldError.checkNotNull(
        firestoreUtilData, r'CheckpointStruct', 'firestoreUtilData');
  }

  @override
  CheckpointStruct rebuild(void Function(CheckpointStructBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  CheckpointStructBuilder toBuilder() =>
      new CheckpointStructBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is CheckpointStruct &&
        position == other.position &&
        city == other.city &&
        location == other.location &&
        firestoreUtilData == other.firestoreUtilData;
  }

  @override
  int get hashCode {
    return $jf($jc(
        $jc($jc($jc(0, position.hashCode), city.hashCode), location.hashCode),
        firestoreUtilData.hashCode));
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'CheckpointStruct')
          ..add('position', position)
          ..add('city', city)
          ..add('location', location)
          ..add('firestoreUtilData', firestoreUtilData))
        .toString();
  }
}

class CheckpointStructBuilder
    implements Builder<CheckpointStruct, CheckpointStructBuilder> {
  _$CheckpointStruct? _$v;

  int? _position;
  int? get position => _$this._position;
  set position(int? position) => _$this._position = position;

  String? _city;
  String? get city => _$this._city;
  set city(String? city) => _$this._city = city;

  LatLng? _location;
  LatLng? get location => _$this._location;
  set location(LatLng? location) => _$this._location = location;

  FirestoreUtilData? _firestoreUtilData;
  FirestoreUtilData? get firestoreUtilData => _$this._firestoreUtilData;
  set firestoreUtilData(FirestoreUtilData? firestoreUtilData) =>
      _$this._firestoreUtilData = firestoreUtilData;

  CheckpointStructBuilder() {
    CheckpointStruct._initializeBuilder(this);
  }

  CheckpointStructBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _position = $v.position;
      _city = $v.city;
      _location = $v.location;
      _firestoreUtilData = $v.firestoreUtilData;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(CheckpointStruct other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$CheckpointStruct;
  }

  @override
  void update(void Function(CheckpointStructBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  CheckpointStruct build() => _build();

  _$CheckpointStruct _build() {
    final _$result = _$v ??
        new _$CheckpointStruct._(
            position: position,
            city: city,
            location: location,
            firestoreUtilData: BuiltValueNullFieldError.checkNotNull(
                firestoreUtilData, r'CheckpointStruct', 'firestoreUtilData'));
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: always_put_control_body_on_new_line,always_specify_types,annotate_overrides,avoid_annotating_with_dynamic,avoid_as,avoid_catches_without_on_clauses,avoid_returning_this,deprecated_member_use_from_same_package,lines_longer_than_80_chars,no_leading_underscores_for_local_identifiers,omit_local_variable_types,prefer_expression_function_bodies,sort_constructors_first,test_types_in_equals,unnecessary_const,unnecessary_new,unnecessary_lambdas
