// import * as functions from 'firebase-functions';


const functions = require('firebase-functions')
const admin = require('firebase-admin')

admin.initializeApp(functions.config().firebase);

const stripe = require('stripe')(functions.config().stripe.testkey)



exports.stripeCharge = functions.database
                                .ref('/payments/{userId}/{paymentId}')
                                .onWrite((change: any,context: any)=> {
                                    const payment = change.after.val();
                                    const userId = context.params.userId;
                                    const paymentId = context.params.paymentId;
  

  // checks if payment exists or if it has already been charged
  if (!payment || payment.charge) return;

  return admin.database()
              .ref(`/users/${userId}`)
              .once('value')
              .then((snapshot: any) => {
                  return snapshot.val();
               })
               .then((customer: any) => {

                 const amount = payment.amount;
                 const idempotency_key = paymentId;  // prevent duplicate charges
                 const source = payment.token.id;
                 const currency = 'usd';
                 const charge = {amount, currency, source};


                 return stripe.charges.create(charge, { idempotency_key });

               })

               .then((charge: any) => {
                admin.database()
                .ref(`/payments/${userId}/${paymentId}/charge`)
                .set(charge);
                return true;
                })


});