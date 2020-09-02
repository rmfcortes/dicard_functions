import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin'

admin.initializeApp()

const cors = require('cors')({origin: true})


exports.request = functions.https.onRequest((request, response) => {
    cors(request, response, async () => {
        response.set('Access-Control-Allow-Origin', '*')
        response.set('Access-Control-Allow-Credentials', 'true')
        const subdominio = request.path
        const manifestVal = await admin.database().ref(`manifest/${subdominio}`).once('value')
        const manifest = manifestVal ? manifestVal.val() : null
        if (manifest) response.status(200).send(manifest)
        else response.status(400).send(null)
    })
})