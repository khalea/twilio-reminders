const http = require('http');

const keys = require('../keys.js');
let gcpAdminFile = keys.gcpAdminJSON();

// Web portal for sending reminders out to a subscriber list with Twilio SMS & Google Firebase.

// Firebase Config
var admin = require("firebase-admin");
var serviceAccount = gcpAdminFile;
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://twilio-reminders.firebaseio.com"
});
let db = admin.firestore();

// Routing dictates what kind of http requests we respond to & how.
// The Router() object manages routing.
var router = require('express').Router();
// bodyParser reads Twilio's webhook request, which is URL Encoded
var bodyParser = require('body-parser');
// Here we set the app to use URL encoding for parsing
router.use(bodyParser.urlencoded({ extended: false }));

const MessagingResponse = require('twilio').twiml.MessagingResponse;

router.post('/sms', (req, res) => {
  
    // Access the message body and the number it was sent from.
    console.log(req.body.From);
    console.log(req.body);

    const twiml = new MessagingResponse();

    if (req.body.Body.trim().toLowerCase() == 'enroll') {
        let newSub = db.collection('subscribers').doc();
        let setSub = newSub.set({
            phoneNumber: req.body.From
        });
        twiml.message('Now enrolled. Reply STOP to remove.');
    } else if (req.body.Body.trim().toLowerCase() == 'stop') {
        
        // Remove user from subscription list ('subscribers')
        let userToRm = db.collection('subscribers').where('phoneNumber', '==', req.body.From);
        userToRm.get().then(function(querySnapshot) {
            querySnapshot.forEach(function(doc) {
                doc.ref.delete();
            })
        });
        
        twiml.message('You have been unsubscribed.');
    } else {
        twiml.message('We cannot recognize your response.');
    }

  res.writeHead(200, {'Content-Type': 'text/xml'});
  res.end(twiml.toString());
});

http.createServer(router).listen(1337, () => {
  console.log('Express server listening on port 1337');
});