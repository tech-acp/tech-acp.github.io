import 'dart:convert';
import 'dart:typed_data';

import '../../flutter_flow/flutter_flow_util.dart';

import 'api_manager.dart';

export 'api_manager.dart' show ApiCallResponse;

const _kPrivateApiFunctionName = 'ffPrivateApiCall';

class NominatimSearchCall {
  static Future<ApiCallResponse> call({
    String? city = '',
  }) {
    return ApiManager.instance.makeApiCall(
      callName: 'Nominatim Search',
      apiUrl: 'https://nominatim.openstreetmap.org/search',
      callType: ApiCallType.GET,
      headers: {},
      params: {
        'format': "json",
        'city': city,
        'limit': 1,
        'country': "fr",
      },
      returnBody: true,
      encodeBodyUtf8: false,
      decodeUtf8: false,
      cache: false,
    );
  }

  static dynamic latitude(dynamic response) => getJsonField(
        response,
        r'''$[0].lat''',
      );
  static dynamic longitude(dynamic response) => getJsonField(
        response,
        r'''$[0].lon''',
      );
}

class GetCityFromLocationCall {
  static Future<ApiCallResponse> call({
    String? lat = '',
    String? lon = '',
  }) {
    return ApiManager.instance.makeApiCall(
      callName: 'Get City From Location',
      apiUrl: 'https://nominatim.openstreetmap.org/reverse',
      callType: ApiCallType.GET,
      headers: {},
      params: {
        'lat': lat,
        'lon': lon,
        'format': "json",
      },
      returnBody: true,
      encodeBodyUtf8: false,
      decodeUtf8: false,
      cache: false,
    );
  }

  static dynamic city(dynamic response) => getJsonField(
        response,
        r'''$.address.city''',
      );
  static dynamic village(dynamic response) => getJsonField(
        response,
        r'''$.address.village''',
      );
  static dynamic town(dynamic response) => getJsonField(
        response,
        r'''$.address.town''',
      );
  static dynamic suburb(dynamic response) => getJsonField(
        response,
        r'''$.address.suburb''',
      );
}

class ApiPagingParams {
  int nextPageNumber = 0;
  int numItems = 0;
  dynamic lastResponse;

  ApiPagingParams({
    required this.nextPageNumber,
    required this.numItems,
    required this.lastResponse,
  });

  @override
  String toString() =>
      'PagingParams(nextPageNumber: $nextPageNumber, numItems: $numItems, lastResponse: $lastResponse,)';
}

String _serializeList(List? list) {
  list ??= <String>[];
  try {
    return json.encode(list);
  } catch (_) {
    return '[]';
  }
}

String _serializeJson(dynamic jsonVar) {
  jsonVar ??= {};
  try {
    return json.encode(jsonVar);
  } catch (_) {
    return '{}';
  }
}
