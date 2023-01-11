import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/foundation.dart';

Future initFirebase() async {
  if (kIsWeb) {
    await Firebase.initializeApp(
        options: FirebaseOptions(
            apiKey: "AIzaSyB4UhTUrA4hdG0KrAsNOWeIJQFXSwRwTqc",
            authDomain: "suivi-brm.firebaseapp.com",
            projectId: "suivi-brm",
            storageBucket: "suivi-brm.appspot.com",
            messagingSenderId: "753686199868",
            appId: "1:753686199868:web:f3b8a6e429c9706ea68d39"));
  } else {
    await Firebase.initializeApp();
  }
}
