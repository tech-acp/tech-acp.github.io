import '../backend/backend.dart';
import '../flutter_flow/flutter_flow_theme.dart';
import '../flutter_flow/flutter_flow_util.dart';
import '../flutter_flow/flutter_flow_widgets.dart';
import '../flutter_flow/custom_functions.dart' as functions;
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

class EventPageWidget extends StatefulWidget {
  const EventPageWidget({
    Key? key,
    this.registrationReference,
  }) : super(key: key);

  final DocumentReference? registrationReference;

  @override
  _EventPageWidgetState createState() => _EventPageWidgetState();
}

class _EventPageWidgetState extends State<EventPageWidget> {
  LatLng? currentUserLocationValue;
  final _unfocusNode = FocusNode();
  final scaffoldKey = GlobalKey<ScaffoldState>();

  @override
  void initState() {
    super.initState();
    getCurrentUserLocation(defaultLocation: LatLng(0.0, 0.0), cached: true)
        .then((loc) => setState(() => currentUserLocationValue = loc));
    WidgetsBinding.instance.addPostFrameCallback((_) => setState(() {}));
  }

  @override
  void dispose() {
    _unfocusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    context.watch<FFAppState>();
    if (currentUserLocationValue == null) {
      return Container(
        color: FlutterFlowTheme.of(context).primaryBackground,
        child: Center(
          child: SizedBox(
            width: 50,
            height: 50,
            child: CircularProgressIndicator(
              color: FlutterFlowTheme.of(context).primaryColor,
            ),
          ),
        ),
      );
    }

    return StreamBuilder<RegistrationsRecord>(
      stream: RegistrationsRecord.getDocument(widget.registrationReference!),
      builder: (context, snapshot) {
        // Customize what your widget looks like when it's loading.
        if (!snapshot.hasData) {
          return Center(
            child: SizedBox(
              width: 50,
              height: 50,
              child: CircularProgressIndicator(
                color: FlutterFlowTheme.of(context).primaryColor,
              ),
            ),
          );
        }
        final eventPageRegistrationsRecord = snapshot.data!;
        return Title(
            title: 'EventPage',
            color: FlutterFlowTheme.of(context).primaryColor,
            child: Scaffold(
              key: scaffoldKey,
              backgroundColor: FlutterFlowTheme.of(context).primaryBackground,
              appBar: PreferredSize(
                preferredSize: Size.fromHeight(100),
                child: AppBar(
                  backgroundColor: FlutterFlowTheme.of(context).primaryBtnText,
                  automaticallyImplyLeading: true,
                  actions: [],
                  flexibleSpace: FlexibleSpaceBar(
                    title: Padding(
                      padding: EdgeInsetsDirectional.fromSTEB(0, 10, 0, 0),
                      child: Row(
                        mainAxisSize: MainAxisSize.max,
                        mainAxisAlignment: MainAxisAlignment.center,
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          Image.asset(
                            'assets/images/cropped-ACP-300x170.png',
                            width: 160,
                            height: 91,
                            fit: BoxFit.fill,
                          ),
                        ],
                      ),
                    ),
                    centerTitle: true,
                    expandedTitleScale: 1.0,
                  ),
                  elevation: 2,
                ),
              ),
              body: SafeArea(
                child: GestureDetector(
                  onTap: () =>
                      FocusScope.of(context).requestFocus(_unfocusNode),
                  child: Column(
                    mainAxisSize: MainAxisSize.max,
                    children: [
                      Padding(
                        padding: EdgeInsetsDirectional.fromSTEB(0, 10, 0, 0),
                        child: Row(
                          mainAxisSize: MainAxisSize.max,
                          children: [
                            FFButtonWidget(
                              onPressed: () async {
                                context.pop();
                              },
                              text: 'Accueil',
                              icon: Icon(
                                Icons.arrow_back_sharp,
                                color: Color(0xFF606060),
                                size: 15,
                              ),
                              options: FFButtonOptions(
                                width: 130,
                                height: 30,
                                color: FlutterFlowTheme.of(context)
                                    .primaryBackground,
                                textStyle: FlutterFlowTheme.of(context)
                                    .subtitle2
                                    .override(
                                      fontFamily: 'Poppins',
                                      color: Color(0xFF606060),
                                    ),
                                borderSide: BorderSide(
                                  color: Colors.transparent,
                                  width: 1,
                                ),
                                borderRadius: BorderRadius.circular(8),
                              ),
                            ),
                          ],
                        ),
                      ),
                      Expanded(
                        child: Padding(
                          padding: EdgeInsetsDirectional.fromSTEB(10, 0, 10, 0),
                          child: FutureBuilder<EventsRecord>(
                            future: EventsRecord.getDocumentOnce(
                                eventPageRegistrationsRecord.event!),
                            builder: (context, snapshot) {
                              // Customize what your widget looks like when it's loading.
                              if (!snapshot.hasData) {
                                return Center(
                                  child: SizedBox(
                                    width: 50,
                                    height: 50,
                                    child: CircularProgressIndicator(
                                      color: FlutterFlowTheme.of(context)
                                          .primaryColor,
                                    ),
                                  ),
                                );
                              }
                              final columnEventsRecord = snapshot.data!;
                              return Column(
                                mainAxisSize: MainAxisSize.max,
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceAround,
                                crossAxisAlignment: CrossAxisAlignment.center,
                                children: [
                                  Row(
                                    mainAxisSize: MainAxisSize.max,
                                    mainAxisAlignment:
                                        MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(
                                        columnEventsRecord.start.city!,
                                        style: FlutterFlowTheme.of(context)
                                            .bodyText1,
                                      ),
                                      FFButtonWidget(
                                        onPressed: () async {
                                          if (functions.validateStep(
                                              currentUserLocationValue!,
                                              columnEventsRecord
                                                  .start.location!)) {
                                            final registrationsUpdateData =
                                                createRegistrationsRecordData(
                                              status: 'in_progress',
                                              currentCheckpoint: -1,
                                            );
                                            await eventPageRegistrationsRecord
                                                .reference
                                                .update(
                                                    registrationsUpdateData);
                                          } else {
                                            await showDialog(
                                              context: context,
                                              builder: (alertDialogContext) {
                                                return AlertDialog(
                                                  title: Text(
                                                      'Checkpoint non validé'),
                                                  content: Text(
                                                      'Vous devez être à moins de 1 km du départ pour commencer l\'épreuve.'),
                                                  actions: [
                                                    TextButton(
                                                      onPressed: () =>
                                                          Navigator.pop(
                                                              alertDialogContext),
                                                      child: Text('Ok'),
                                                    ),
                                                  ],
                                                );
                                              },
                                            );
                                          }
                                        },
                                        text: 'Démarrer',
                                        options: FFButtonOptions(
                                          width: 130,
                                          height: 40,
                                          color: FlutterFlowTheme.of(context)
                                              .primaryColor,
                                          textStyle:
                                              FlutterFlowTheme.of(context)
                                                  .subtitle2
                                                  .override(
                                                    fontFamily: 'Poppins',
                                                    color: Colors.white,
                                                  ),
                                          borderSide: BorderSide(
                                            color: Colors.transparent,
                                            width: 1,
                                          ),
                                          borderRadius:
                                              BorderRadius.circular(8),
                                        ),
                                      ),
                                    ],
                                  ),
                                  Builder(
                                    builder: (context) {
                                      final checkpoints = columnEventsRecord
                                          .checkpoints!
                                          .toList();
                                      return ListView.builder(
                                        padding: EdgeInsets.zero,
                                        shrinkWrap: true,
                                        scrollDirection: Axis.vertical,
                                        itemCount: checkpoints.length,
                                        itemBuilder:
                                            (context, checkpointsIndex) {
                                          final checkpointsItem =
                                              checkpoints[checkpointsIndex];
                                          return Padding(
                                            padding:
                                                EdgeInsetsDirectional.fromSTEB(
                                                    0, 0, 0, 10),
                                            child: Row(
                                              mainAxisSize: MainAxisSize.max,
                                              mainAxisAlignment:
                                                  MainAxisAlignment
                                                      .spaceBetween,
                                              children: [
                                                Text(
                                                  checkpointsItem.city!,
                                                  style: FlutterFlowTheme.of(
                                                          context)
                                                      .bodyText1,
                                                ),
                                                if (eventPageRegistrationsRecord
                                                        .currentCheckpoint! >=
                                                    checkpointsIndex)
                                                  Icon(
                                                    Icons.check_circle_outline,
                                                    color: Color(0xFF15D064),
                                                    size: 35,
                                                  ),
                                                if (eventPageRegistrationsRecord
                                                        .currentCheckpoint! <
                                                    checkpointsIndex)
                                                  FFButtonWidget(
                                                    onPressed: functions
                                                            .disableValidateCheckpoint(
                                                                eventPageRegistrationsRecord
                                                                    .currentCheckpoint!,
                                                                checkpointsIndex)
                                                        ? null
                                                        : () async {
                                                            if (functions.validateStep(
                                                                currentUserLocationValue!,
                                                                checkpointsItem
                                                                    .location!)) {
                                                              final registrationsUpdateData =
                                                                  createRegistrationsRecordData(
                                                                currentCheckpoint:
                                                                    checkpointsIndex,
                                                              );
                                                              await eventPageRegistrationsRecord
                                                                  .reference
                                                                  .update(
                                                                      registrationsUpdateData);
                                                            } else {
                                                              await showDialog(
                                                                context:
                                                                    context,
                                                                builder:
                                                                    (alertDialogContext) {
                                                                  return AlertDialog(
                                                                    title: Text(
                                                                        'Checkpoint non validé'),
                                                                    content: Text(
                                                                        'Vous devez être à moins de 1 km du checkpoint pour le valider.'),
                                                                    actions: [
                                                                      TextButton(
                                                                        onPressed:
                                                                            () =>
                                                                                Navigator.pop(alertDialogContext),
                                                                        child: Text(
                                                                            'Ok'),
                                                                      ),
                                                                    ],
                                                                  );
                                                                },
                                                              );
                                                            }
                                                          },
                                                    text: 'Valider',
                                                    options: FFButtonOptions(
                                                      width: 130,
                                                      height: 40,
                                                      color:
                                                          FlutterFlowTheme.of(
                                                                  context)
                                                              .primaryColor,
                                                      textStyle:
                                                          FlutterFlowTheme.of(
                                                                  context)
                                                              .subtitle2
                                                              .override(
                                                                fontFamily:
                                                                    'Poppins',
                                                                color: Colors
                                                                    .white,
                                                              ),
                                                      borderSide: BorderSide(
                                                        color:
                                                            Colors.transparent,
                                                        width: 1,
                                                      ),
                                                      borderRadius:
                                                          BorderRadius.circular(
                                                              8),
                                                    ),
                                                  ),
                                              ],
                                            ),
                                          );
                                        },
                                      );
                                    },
                                  ),
                                  Row(
                                    mainAxisSize: MainAxisSize.max,
                                    mainAxisAlignment:
                                        MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(
                                        columnEventsRecord.start.city!,
                                        style: FlutterFlowTheme.of(context)
                                            .bodyText1,
                                      ),
                                      FFButtonWidget(
                                        onPressed: !functions
                                                .allCheckpointsValidated(
                                                    columnEventsRecord
                                                        .checkpoints!
                                                        .toList(),
                                                    eventPageRegistrationsRecord
                                                        .currentCheckpoint!)
                                            ? null
                                            : () async {
                                                if (functions.validateStep(
                                                    currentUserLocationValue!,
                                                    columnEventsRecord
                                                        .finish.location!)) {
                                                  await showDialog(
                                                    context: context,
                                                    builder:
                                                        (alertDialogContext) {
                                                      return AlertDialog(
                                                        title: Text(
                                                            'Félicitations !'),
                                                        content: Text(
                                                            'Vous avez terminé l\'évènement !'),
                                                        actions: [
                                                          TextButton(
                                                            onPressed: () =>
                                                                Navigator.pop(
                                                                    alertDialogContext),
                                                            child: Text('Ok'),
                                                          ),
                                                        ],
                                                      );
                                                    },
                                                  );

                                                  final registrationsUpdateData =
                                                      createRegistrationsRecordData(
                                                    status: 'completed',
                                                    currentCheckpoint:
                                                        functions.getFinishStep(
                                                            columnEventsRecord
                                                                .checkpoints!
                                                                .toList()),
                                                  );
                                                  await eventPageRegistrationsRecord
                                                      .reference
                                                      .update(
                                                          registrationsUpdateData);
                                                } else {
                                                  await showDialog(
                                                    context: context,
                                                    builder:
                                                        (alertDialogContext) {
                                                      return AlertDialog(
                                                        title: Text(
                                                            'Arrivée non validée'),
                                                        content: Text(
                                                            'Vous devez vous trouver à moins de 1 km pour valider l\'arrivée.'),
                                                        actions: [
                                                          TextButton(
                                                            onPressed: () =>
                                                                Navigator.pop(
                                                                    alertDialogContext),
                                                            child: Text('Ok'),
                                                          ),
                                                        ],
                                                      );
                                                    },
                                                  );
                                                }
                                              },
                                        text: 'Terminer',
                                        options: FFButtonOptions(
                                          width: 130,
                                          height: 40,
                                          color: FlutterFlowTheme.of(context)
                                              .primaryColor,
                                          textStyle:
                                              FlutterFlowTheme.of(context)
                                                  .subtitle2
                                                  .override(
                                                    fontFamily: 'Poppins',
                                                    color: Colors.white,
                                                  ),
                                          borderSide: BorderSide(
                                            color: Colors.transparent,
                                            width: 1,
                                          ),
                                          borderRadius:
                                              BorderRadius.circular(8),
                                        ),
                                      ),
                                    ],
                                  ),
                                  if (responsiveVisibility(
                                    context: context,
                                    phone: false,
                                    tablet: false,
                                    tabletLandscape: false,
                                    desktop: false,
                                  ))
                                    Text(
                                      currentUserLocationValue!.toString(),
                                      style: FlutterFlowTheme.of(context)
                                          .bodyText1,
                                    ),
                                ],
                              );
                            },
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ));
      },
    );
  }
}
