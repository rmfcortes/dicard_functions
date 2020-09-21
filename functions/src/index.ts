import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin'

import { ClientToken, Item, Order } from './interfaces';

admin.initializeApp()

const conekta = require('conekta')
const cors = require('cors')({origin: true})

conekta.api_version = '2.0.0'
conekta.locale = 'es'

exports.request = functions.https.onRequest((request, response) => {
    cors(request, response, async () => {
        response.set('Access-Control-Allow-Origin', '*')
        response.set('Access-Control-Allow-Credentials', 'true')
        console.log(request.body);
        if (!request.body.origen) {
            const subdominio = request.path
            const manifestVal = await admin.database().ref(`manifest/${subdominio}`).once('value')
            const manifest = manifestVal ? manifestVal.val() : null
            if (manifest) return response.status(200).send(manifest)
            else return response.status(400).send(null)
        }
        
        const data = request.body.data
        const key = await getKey(data.id, 'secret')
        console.log(key);
        conekta.api_key = key
        if (request.body.origen === 'newCard') {
            return newCard(data.client)
            .then(client => response.status(200).send(client))
            .catch(err => response.status(400).send('No pudimos completar el registro ' + err))
        } else if (request.body.origen === 'cargo') {
            return doCharge(data.order, data.idConekta)
            .then(() => response.status(200).send('Cargo autorizado'))
            .catch((err: any) => response.status(400).send('No pudimos hacer el cargo ' + err))
        } else if (request.body.origen === 'key') {
            return getKey(data.id, 'public')
            .then(id => response.status(200).send(id))
            .catch((err: any) => response.status(400).send(err))
        }
        return null
    })
})

function getKey(idHost: string, type: string): Promise<string> {
    return new Promise((resolve, reject) => {
      return admin.database().ref(`id_conek/${idHost}/${type}`).once('value')
      .then((res: any) => res ? res.val() : '')
      .then(key => resolve(key))
      .catch(err => reject(err))
    })
}

function newCard(client: ClientToken) {
    if (!client.idConekta) return createUser(client)
    return addCard(client.idConekta, client.token)
}

function createUser(client: ClientToken) {
    return new Promise(async (resolve, reject) => {
        try {
            conekta.Customer.create({
                'name': client.name,
                'email': client.email,
                'payment_sources': [{
                    'type': 'card',
                    'token_id': client.token
                }]
            })
            .then((customer: any) => {
                const newCliente = {
                    idCard: customer.toObject().default_payment_source_id,
                    idConekta: customer.toObject().id
                }
                resolve(newCliente)
            })
            .catch((err: any) => {
                console.log(err)
                reject(err)
            })
        } catch (error) {
            console.log(error)
            reject(error)
        }
    });
}

function addCard(idConekta: string, token: string) {
    return new Promise((resolve, reject) => {
        conekta.Customer.find(idConekta, function(_err: any, _customer: any) {
            _customer.createPaymentSource({
                type: 'card',
                token_id: token
            }, function(erre: any, res: any) {
                const newCliente = {
                    idCard: res.id,
                    idConekta: idConekta
                }
                resolve(newCliente)
            })
        })
    })
}

function doCharge(order: Order, idConekta: string) {
    const items: Item[] = []
    return new Promise((resolve, reject) => {        
        conekta.Customer.find(idConekta)
        .then((cliente: any) => {
            cliente.update({
                default_payment_source_id: order.payment.id
            },
            function (err: any, customer: any){
                if (err) {
                    console.log(err);
                    reject(err)
                    return
                }
                for (const producto of order.products) {
                    const item: Item = {
                        id: producto.id,
                        name: producto.name,
                        unit_price: Math.round(producto.total + Number.EPSILON) * 100,
                        quantity: 1
                    }
                    items.push(item)
                }
                if (order.tip && order.tip > 0) {
                    const tip: Item =  {
                        id: 'tip',
                        name: 'tip',
                        unit_price: Math.round(order.tip + Number.EPSILON) * 100,
                        quantity: 1
                    }
                    items.push(tip)
                }
                if (order.comision && order.comision > 0) {
                    const comision: Item =  {
                        id: 'comision',
                        name: 'comision',
                        unit_price: Math.round(order.comision + Number.EPSILON) * 100,
                        quantity: 1
                    }
                    items.push(comision)
                }
                if (order.delivery_cost && order.delivery_cost > 0) {
                    const deliver: Item =  {
                        id: 'deliver',
                        name: 'deliver',
                        unit_price: Math.round(order.delivery_cost + Number.EPSILON) * 100,
                        quantity: 1
                    }
                    items.push(deliver)
                }
                console.log(items);
                conekta.Order.create({
                    currency: 'MXN',
                    customer_info: {
                        customer_id: idConekta
                    },
                    line_items: items,
                    charges: [{
                        payment_method: {
                            type: 'default'
                          } 
                    }]
                })
                .then((result: any) => {
                    console.log('Cargo autorizado');
                    console.log(result);
                    console.log(result.toObject());
                    resolve(true)
                })
                .catch((erra: any) => {
                    console.log('Error');
                    console.log(erra);
                    console.log(erra.details[0].message)
                    reject(erra.details[0].message)
                })
            })
        })
    })
}

