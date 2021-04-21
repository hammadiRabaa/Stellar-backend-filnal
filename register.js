require('dotenv/config')
var User = require('./usermodel');
var Transaction = require('./transactionmodel');
var bcrypt = require('bcryptjs');
const express = require('express');
const app = express();

var bodyparser = require('body-parser');
var StellarSdk = require('stellar-sdk');

var pair = StellarSdk.Keypair.random();
var request = require('request');
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));

const port = 8080
var server = new StellarSdk.Server('https://horizon-testnet.stellar.org');//connect to stellar
const client = require('twilio')(process.env.ACCOUNT_SID, process.env.AUTH_TOKEN)
var dbconnect = require('./mongodb_connect.js');
//sign to receive code  if not exists done
app.post('/sign', async (req, res) => {
  const { phone } = req.body;
  console.log(phone);

  let user = await User.findOne({ phone });
  if (user) {
    return res.status(404).json({
      statusCode: 404,
      method: req.method,
      message: 'phone number already taken ',
      idtransaction: '123456 failed',
      ResultCode: 20,
    })
  }

  else {
    client
      .verify
      .services(process.env.SERVICE_ID)
      .verifications
      .create({
        to: `+${req.body.phone}`,
        channel: req.query.channel === 'call' ? 'call' : 'sms'
      })
      .then(data => {
        res.status(200).send({
          message: "Verification is sent!!",
          phone: req.query.phone,
          data
        })
      })

  }


});
//veriy phone and code if ok add user to DB done
app.post('/verify', async (req, res) => {

  if (req.body.phone && (req.body.code).length === 6 && req.body.password) {
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(req.body.password, salt);

    // user = new User({
    //   phone: req.body.phone,
    //   address: pair.publicKey(),
    //   seed: pair.secret(),
    //   password: hashPassword,
    //   balace : balance,
    //    admin: true
    // });

    client
      .verify
      .services(process.env.SERVICE_ID)
      .verificationChecks
      .create({
        to: `+${req.body.phone}`,
        code: req.body.code,
        password: req.body.password
      })



    // await user.save();
    console.log("register");


    request.get({
      url: 'https://friendbot.stellar.org',
      qs: { addr: pair.publicKey() },
      json: true
    }, function (error, response, body) {
      if (error || response.statusCode !== 200) {
        console.error('ERROR!', error || body);
        return res.status(404).json({
          statusCode: req.statusCode,
          method: req.method,
          message: ' wrong',
          idtransaction: '123456 failed',
          ResultCode: 20,



        });


      }

      else {

        console.log('SUCCESS! You have a new account :)\n', body);



        var server = new StellarSdk.Server('https://horizon-testnet.stellar.org');
        // the JS SDK uses promises for most actions, such as retrieving an account
        server.loadAccount(pair.publicKey()).then(async function (account) {
          console.log('Balances for account: ' + pair.publicKey());




          account.balances.forEach(async function (balance) {



            user = new User({
              phone: req.body.phone,
              address: pair.publicKey(),
              seed: pair.secret(),
              password: hashPassword,
              balance: balance.balance,
              admin: true
            });

            await user.save();

            return res.status(200).json({
              statusCode: req.statusCode,
              method: req.method,
              message: 'account created',
              'balance': balance,
              idtransaction: '123456 sucess',
              ResultCode: 0,

            });



          });


        }).catch(function (err) {
          console.error(err);
          res.status(500).send('Something broke!');
        });
      }
    });

  } else {
    return res.status(404).json({
      statusCode: req.statusCode,
      method: req.method,
      message: ' code wrong',
      idtransaction: '123456 failed',
      ResultCode: 20,



    });

  }
});

//login with phone and pass done 
app.post('/login', (req, res, next) => {
  User.findOne({
    phone: req.body.phone,

  },
    function (err, user) {
      if (err) console.log(err);
      if (!user) {
        messages = 'sorry account with specified phone number doesnt exist';
        return res.status(404).json({
          statusCode: 404,
          method: req.method,
          message: 'Not found',
          idtransaction: '123456 failed',
          ResultCode: 20,
        });
      }
      else if (user) {

        var pass = bcrypt.compareSync(req.body.password, user.password);
        if (!pass) {
          return res.status(404).json({
            statusCode: 404,
            method: req.method,
            message: 'password or phone wrong',
            idtransaction: '123456 failed',
            ResultCode: 20,
          });
        }
        else if (pass) {



          var userid = req.body.phone;

          var server = new StellarSdk.Server('https://horizon-testnet.stellar.org');
          var promise = server.loadAccount(user.address).then(function (account) {
            //console.log('Balances for account: ' + pair.publicKey());
            account.balances.forEach(function (balance) {
              console.log('Type:', balance.asset_type, ', Balance:', balance.balance);
              bal = balance.balance;
              console.log(userid + "your balance:" + bal);
              var update = userid + " your balance:" + bal;
              console.log(update)

              return res.status(200).json({
                statusCode: 200,
                method: req.method,
                message: 'user found',
                idtransaction: '123456 success',
                ResultCode: 0,
                'adress': user.address,
                'balance': balance,

              });

            });
          }).catch(function (err) {
            console.error(err);
          });
        }
      }
    }


  )
});




//send money to another account
//seems as 
//receiver's phone //amount 
//test if receiver's phone exists 

//load account phone 
//test if amount <= balance 
//send from phone to receiver's phone 
//save the transaction on table transaction
//done

app.post('/sendmoney', async (req, res) => {
  var dbconnect = require('./mongodb_connect.js');
  user_seed = '';
  user_address = '';

  User.findOne({
    phone: req.body.phone
  }



    , function (err, user) {
      if (user) {
        user_seed = user.seed;
        user_address = user.address;
        console.log(user_seed);
        console.log(user.address);
      }
    });





  User.findOne({
    phone: req.body.destinationId

  },




    function (err, user1) {

      if (err) throw err;

      if (!user1) {

        messages = 'sorry account with specified phone number doesnt exist';
        return res.status(404).json({
          statusCode: 404,
          method: req.method,
          message: 'Not found',
          idtransaction: '123456 failed',
          ResultCode: 20,
        });
      }
      else if (user1) {
        user1_address = user1.address

        console.log(user1.seed);


        console.log(req.body.amount);
        const StellarSdk = require('stellar-sdk')
        StellarSdk.Networks.TESTNET;
        var server = new StellarSdk.Server('https://horizon-testnet.stellar.org');
        var sourceKeys = StellarSdk.Keypair.fromSecret(user_seed);
        var destinationId = user1.address;
        var transaction;
        server.loadAccount(destinationId).catch(StellarSdk.NotFoundError, function (error) {
          console.log("Transaction failed");
          throw new Error('The destination account does not exist!');

        })
          .then(function () {
            return server.loadAccount(sourceKeys.publicKey());
          })
          .then(function (sourceAccount) {
            // Start building the transaction.
            transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
              fee: StellarSdk.BASE_FEE,
              networkPassphrase: StellarSdk.Networks.TESTNET
            })
              .addOperation(StellarSdk.Operation.payment({
                destination: destinationId,
                asset: StellarSdk.Asset.native(),
                amount: req.body.amount
              }))
              .addMemo(StellarSdk.Memo.text('Test Transaction'))
              .setTimeout(180)//moins
              .build();
            fee: StellarSdk.BASE_FEE,

              transaction.sign(sourceKeys);
            return server.submitTransaction(transaction);
          })
          .then(function (result) {

            return res.status(200).json({
              statusCode: 200,
              method: req.method,
              message: 'transaction done',
              idtransaction: '123456 success',
              ResultCode: 0,
              result: result,


            });






          }).then(async function () {
            transactionTable = new Transaction({
              sender: req.body.phone,
              receiver: req.body.destinationId,
              amount: req.body.amount,


            });
            server.loadAccount(user_address).then(async function (account) {
              account.balances.forEach(function (balance) {
                console.log('Type:', balance.asset_type, ', Balance:', balance.balance);
                
                bal = balance.balance;
                var update = req.body.phone + " your balance:" + bal;
 
                console.log(update);
 
                console.log(user_address);
//sender 
                User.findOne({
                  phone: req.body.phone 
                }
                  , async function (err, user) {
                    if (user) {
                      user.balance = bal;

                      await user.save();
                    }
                  });
//update balance receiver
                  User.findOne({
                    phone: req.body.destinationId 
                  },
  
                  bal2= balance.balance

                    , async function (err, user1) {
                      if (user1) {
                        user1.bal2 = bal2 + parseInt(req.body.amount);
  
                        await user1.save();
                      }
                      console.log(bal2);
                    });
  



              });






            }).catch(function (err) {
              console.error(err);
            });


            server.loadAccount(user1_address).then(async function (account) {
              account.balances.forEach(function (balance) {
                console.log('Type:', balance.asset_type, ', Balance:', balance.balance);
                
                bal = balance.balance;
                var update = req.body.destinationId + " your balance:" + bal;
 
                console.log(update);
 
                console.log(user1_address);
//sender 
                User.findOne({
                  phone: req.body.phone 
                }
                  , async function (err, user) {
                    if (user) {
                      user.balance = bal;

                      await user.save();
                    }
                  });
//update balance receiver
                  
  



              });






            }).catch(function (err) {
              console.error(err);
            });


            //
            await transactionTable.collection.dropIndexes("transactionTable.receiver", "transactionTable.sender", "transactionTable.amount");
            return await transactionTable.save();


          })
          .catch(function (error) {
            console.error('Something went wrong!', error);
          });

      }

    })


});
// get balance
app.get('/getbalance', async (req, res) => {
  var dbconnect = require('./mongodb_connect.js');
   
  User.findOne({
    phone: req.body.phone
  }

    ,async function (err, user) {
      if (user) {
        return res.status(200).json({
          statusCode: 200,
          method: req.method,
          message: 'balance',
          idtransaction: '123456 success',
          ResultCode: 20,
          balance:user.balance,
        });
      }

    });

});
// get transactions 
app.get('/gettransaction', async (req, res) => {
  var dbconnect = require('./mongodb_connect.js');
   
  Transaction.findOne({
    sender: req.body.phone
  }



    ,async function (err, transaction) {
      if (transaction) {



        const filter = {sender : req.body.phone};
const all = await Transaction.find(filter);


        return res.status(200).json({
          statusCode: 200,
          method: req.method,
          message: 'transactions',
          idtransaction: '123456 success',
          ResultCode: 20,
          transaction:all,
        });
      }

    });

});


// create a trustline to anchorX asset 


//issue an asset 


 //front


 









// listen to the server at 8080 port

app.listen(port, () => {
  console.log(`Server is running at ${port}`)
})
