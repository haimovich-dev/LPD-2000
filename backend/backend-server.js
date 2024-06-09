const express = require('express');
const wsserver = require('express-ws');
const session = require('express-session');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const mysql = require('mysql2');
const fs = require('fs');

const app = express();
wsserver(app);//sets up express-ws on the specified app [ express() ]

const PORT = 3000;

function dbConnection(){
    //use this function to connect to the database, contains
    //all the configurations required to establish connection
    //RETURNS mysql.createConnection() object 
    const connection = mysql.createConnection({
        host:'localhost',
        user: 'nodejs',
        password: 'kinneret-DB-P@sS',
        database: 'LPD2000DB'
    });
    return connection;
}
async function getLicensePlate(base64str){
    let license_plate_number;

    //creat form data for post request
    let body = new FormData();
    body.append("upload", base64str);
    body.append("regions", "il");

    //fetch data from external api
    const res = await fetch("https://api.platerecognizer.com/v1/plate-reader/",{
        method: "POST",
        headers:{
            "Authorization" : `Token ${process.env.PLATE_RECOGNIZER_TOKEN}`,
            "Content-Type" : "multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW",
        },
        body: body
    })
    const json = await res.json();

    try{
        license_plate_number = JSON.stringify(json["results"][0]["plate"]);
    }catch(err){
        license_plate_number = null;
    }
    return license_plate_number;
}
function updateSuspectStatus(license_plate){

    license_plate = license_plate.slice(1,-1);

    const connection = dbConnection();
    connection.connect((err)=>{
        if(err){
            console.log("detection func >",err);
            return;
        }else{
            console.log(`${new Date().toISOString()} > [ UPDATING SUSPECTS TABLE ACCORDING TO THE LICENSE PLATE NUMBER ]`);
            const query1 = `SELECT suspect_id,license_plate FROM suspects`;
            connection.query(query1,(err,results)=>{
                if(err){
                    console.log("detection func > ",err);
                    return;
                }else{
                    let suspectID = null;
                    for(let i = 0;i<results.length;i++){
                        if(results[i]['license_plate']==license_plate){
                            suspectID = results[i]['suspect_id'];
                            break;
                        }
                    }
                    if(suspectID==null){
                        console.log(`${new Date().toISOString()} > [ ! SUSPECT WITH ${license_plate} NUMBER WAS NOT FOUND ! ]`);
                    }else{
                        const query2 = `UPDATE suspects SET is_spotted = 1 WHERE suspect_id = ${suspectID}`;
                        connection.query(query2,(err,results)=>{
                            if(err){
                                console.log("updating func query > ",err);
                                return;
                            }else{
                                console.log(`${new Date().toISOString()} > [ ! SUSPECT WITH ID: ${suspectID} WAS DETECTED ! ]`);
                                return;
                            }
                        })
                    }
                }
            })
        }
        //connection.close();
        console.log(`${new Date().toISOString()} > [ UPDATING SUSPECTS PROCESS FINISHED ]`);
    })
}

// MIDDLEWARE

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(session({
    secret:'kinneretSecret',
    cookie: {maxAge:100000000},
    saveUninitialized: false
}));

/*
========================================
    PUBLIC SIDE WITH ALL ACTIONS
========================================
*/

app.get('/contact', (req, res)=>{
    res.sendFile('/contact.html', { root: __dirname + '/../' });
})
app.post('/contact',(req,res)=>{
    
    const firstName = req.body.first_name;
    const lastName = req.body.last_name;
    const emailAddress = req.body.email_address;
    const phoneNumber = req.body.phone_number;
    const text = req.body.text;

const data = `
========================================
First Name: ${firstName}
Last Name: ${lastName}
Email Address: ${emailAddress}
Phone Number: ${phoneNumber}
Text: ${text}
========================================
`;

    fs.appendFile("../contacts/contact-forms.txt",data,(err)=>{
        if(err){
            console.log(err);
            res.sendStatus(400);
            return;
        }else{
            console.log("[RECEIVED A CONTACT FORM]");
            res.sendStatus(200);
        }
    })
})
app.get('/login', (req, res)=>{
    res.sendFile('/login.html', { root: __dirname + '/../' });
})
app.post('/login',(req,res)=>{
    
    if(req.session.auth){
        (req.session.isAdmin==1)?res.redirect('/admin'):res.redirect('/images');
        console.log(`${new Date().toISOString()} > [${req.sessionID} EXISTED]`);
        return;
    }

    //get user credentials
    const username = req.body.username;
    const password = crypto.createHash('sha512').update(req.body.password).digest('hex');
    
    //connect to mysql LPD2000DB database
    const connection = dbConnection();
    //check user credentials
    connection.connect((err)=>{
        if(err){
            console.log("error occured!");
            return;
        }
        console.log(`${new Date().toISOString()} > [DATABASE CONNECTION POST:{/login} OPENED]`);
        //sending mysql query and handling results
        const query = `SELECT password_hash,isAdmin,user_id FROM users WHERE username = ?;`;
        var results;
        connection.query(query,[username],(err,result)=>{
            if(err){
                console.log("Error sending query");
                return;
            }
            if(result.length==0){
                connection.end();
                console.log(`${new Date().toISOString()} > [DATABASE CONNECTION POST:{/login} CLOSED]`);
                res.redirect('/login');
                return;
            }
            const hash = result[0]["password_hash"];
            const privilege = result[0]["isAdmin"];
            const userID = result[0]["user_id"];

            if(hash==password){
                req.session.auth = true;
                req.session.user_id = userID;
                req.session.isAdmin = privilege;
                console.log(`${new Date().toISOString()} > [${req.sessionID} SESSION CREATED]`);
                if(privilege==1){
                    console.log(`${new Date().toISOString()} > [ADMIN HAS AUTHORIZED]`);
                    res.redirect('/admin');
                }else{
                    res.redirect('/suspects');
                }
            }else{
                connection.end();
                console.log(`${new Date().toISOString()} > [DATABASE CONNECTION POST:{/login} CLOSED]`);
                res.redirect('/login');
                return;
            }
            //closing connection
            connection.end();
            console.log(`${new Date().toISOString()} > [DATABASE CONNECTION POST:{/login} CLOSED]`);
        })
    })

})

/*
========================================
    ADMIN SIDE WITH ALL ACTIONS
========================================
*/

app.get('/admin', (req, res)=>{
    //check session if exists the redirects to admin.html else redirects to login
    if(req.session.auth&&req.session.isAdmin==1){
        res.sendFile('/admin.html', { root: __dirname + '/../' });
        return;
    }
    res.redirect('/login');
})
app.post('/admin',(req,res)=>{
    if(!req.session.auth&&req.session.isAdmin!=1){
        return;
    }
    const connection = dbConnection();
    connection.connect((err)=>{
        if(err){
            console.log("database connect post(/admin)",err);
            return;
        }
        console.log(`${new Date().toISOString()} > [DATABASE CONNECTION POST:{/admin} OPENED]`);
        const query = "SELECT user_id,first_name,last_name,ssn,username,phone_number,email_address,isAdmin FROM users;";
        connection.query(query,(err,results)=>{
            if(err){
                console.log(err);
                return;
            }
            res.json(results);
            console.log(`${new Date().toISOString()} > [USERS DATABASE SENT SUCCESSFULLY]`);
            connection.end();
            console.log(`${new Date().toISOString()} > [DATABASE CONNECTION POST:{/admin} CLOSED]`);
        })
    });
})
app.post('/admin/adduser', (req,res)=>{
    //check if session exists, if not break the process
    if(!req.session.auth){
        return;
    }else{
        console.log(`${new Date().toISOString()} > [ADDING NEW USER PROCESS STARTED]`);

        //get all the values from the form
        const firstName = req.body.firstname;
        const lastName = req.body.lastname;
        const ssn = req.body.ssn;
        const username = req.body.username;
        const password = crypto.createHash('sha512').update(ssn).digest('hex');
        const phoneNumber = req.body.phonenumber;
        const emailAddress = req.body.emailaddress;
        const privilege = Number(req.body.privilege);

        //connect to database
        const connection = dbConnection();

        connection.connect((err)=>{
            if(err){
                console.log(err);
                return;
            }
            console.log(`${new Date().toISOString()} > [DATABASE CONNECTION POST:{/admin/adduser} OPENED]`);

            const query2 = `INSERT INTO users (first_name,last_name,ssn,username,password_hash,phone_number,email_address,isAdmin) VALUES ('${firstName}','${lastName}','${ssn}','${username}','${password}','${phoneNumber}','${emailAddress}',${privilege})`;
            var results;
            //send insert query to users table
            connection.query(query2,(err,results)=>{
                if(err){
                    console.log(err);
                    return;
                }
                //close database connection
                console.log(`${new Date().toISOString()} > [NEW USER ADDED]`);
                connection.end();
                console.log(`${new Date().toISOString()} > [DATABASE CONNECTION POST:{/admin/adduser} CLOSED]`);
            })    
        })
    }        
    //after process is finished redirect back to admin page
    res.redirect('/admin');
})
app.post('/admin/edituser',(req,res)=>{
    if(!req.session.auth){
        return;
    }else{
        console.log(`${new Date().toISOString()} > [EDIT USER PROCESS STARTED]`);

        //get all the values from the form
        const userid = Number(req.body.userID);
        const firstName = req.body.firstname;
        const lastName = req.body.lastname;
        const ssn = req.body.ssn;
        const username = req.body.username;
        const phoneNumber = req.body.phonenumber;
        const emailAddress = req.body.emailaddress;
        const privilege = Number(req.body.privilege);

        //connect to database
        const connection = dbConnection();

        connection.connect((err)=>{
            if(err){
                console.log(err);
                return;
            }
            console.log(`${new Date().toISOString()} > [DATABASE CONNECTION POST:{/admin/edituser} OPENED]`);
            const query = `UPDATE users SET first_name = '${firstName}',last_name = '${lastName}',ssn = '${ssn}',username = '${username}',phone_number = '${phoneNumber}',email_address = '${emailAddress}',isAdmin = ${privilege} WHERE user_id = ${userid};`;
            var results;
            //send insert query to users table
            connection.query(query,(err,results)=>{
                if(err){
                    console.log(err);
                    return;
                }
                //close database connection
                console.log(`${new Date().toISOString()} > [USER HAS BEEN UPDATED]`);
                connection.end();
                console.log(`${new Date().toISOString()} > [DATABASE CONNECTION POST:{/admin/edituser} CLOSED]`);
            })
        });
        //after process is finished redirect back to admin page
        res.redirect('/admin');
    }
})
app.post('/admin/userdelete',(req,res)=>{
    if(!req.session.auth){
        return;
    }else{
        console.log(`${new Date().toISOString()} > [DELETING USER PROCESS STARTED]`);
        const selectedUserID =req.body.selected_user_id;
        if(selectedUserID==1){
            req.redirect('/admin');
            return;
        }else{
            const connection = dbConnection();
            connection.connect((err)=>{
                if(err){
                    console.log(err);
                    return;
                }
                console.log(`${new Date().toISOString()} > [DATABASE CONNECTION POST:{/admin/userdelete} OPENED]`);
                const query = `DELETE FROM users WHERE user_id = ${selectedUserID}`;
                connection.query(query,(err,results)=>{
                    if(err){
                        console.log(err);
                        return;
                    }
                    console.log(`${new Date().toISOString()} > [USER ${selectedUserID} DELETED]`);
                    connection.end();
                    console.log(`${new Date().toISOString()} > [DATABASE CONNECTION POST:{/admin/userdelete} CLOSED]`);
                })
            })
            res.redirect('/admin');
        }
    }
})
app.post('/admin/searchuser',(req,res)=>{
    if(!req.session.auth&&req.session.privilege!=1){
        return;
    }else{
        console.log(`${new Date().toISOString()} > [SEARCHING USER PROCESS STARTED]`);
        const userSSN = req.body.ssnSearch;

        const connection = dbConnection();
        connection.connect((err)=>{
            if(err){
                console.log(err);
                return;
            }else{
                console.log(`${new Date().toISOString()} > [DATABASE CONNECTION POST:{/admin/serachuser} OPENED]`);
                const query = `SELECT user_id,first_name,last_name,ssn,username,phone_number,email_address,isAdmin FROM users WHERE ssn = '${userSSN}'`;
                connection.query(query,(err,results)=>{
                    if(err){
                        console.log(err);
                        return;
                    }else{
                        res.json(results);
                        console.log(`${new Date().toISOString()} > [QUERY FOR ${userSSN} FOUND]`);
                        return;
                    }
                })
            }
            connection.end();
            console.log(`${new Date().toISOString()} > [DATABASE CONNECTION POST:{/admin/serachuser} CLOSED]`);
        })
    }
})

/*
========================================
    USER SIDE WITH ALL ACTIONS
========================================
*/

// SUSPECTS TAB WITH ALL ACTIONS

app.get('/suspects', (req, res)=>{
    //check session if exists the redirects to suspects.html else redirects to login
    if(req.session.auth&&req.session.isAdmin==0){
        res.sendFile('/suspects.html', { root: __dirname + '/../' });
        return;
    }
    res.redirect('/login');
})
app.post('/suspects', (req,res)=>{
    if(!req.session.auth){
        return;
    }else{
        const userID = req.session.user_id;
        console.log(`${new Date().toISOString()} > [RETRIEVING SUSPECTS DATA FOR USER:${userID} STARTED]`);

        const connection = dbConnection();
        connection.connect((err)=>{
            if(err){
                console.log(err);
                return;
            }else{
                console.log(`${new Date().toISOString()} > [DATABASE CONNECTION POST:{/suspects} OPENED]`);
                const query = `SELECT suspect_id,first_name,last_name,ssn,license_plate,is_spotted FROM suspects WHERE user_id = ${userID};`;
                connection.query(query,(err,results)=>{
                    if(err){
                        console.log(err);
                        return;
                    }
                    res.json(results);
                    console.log(`${new Date().toISOString()} > [SUSPECTS DATABASE FOR USER ${userID} SENT SUCCESSFULLY]`);
                    connection.end();
                    console.log(`${new Date().toISOString()} > [DATABASE CONNECTION POST:{/suspects} CLOSED]`);
                })
            }
        })
    }
})
app.post('/suspects/addsuspect', (req,res)=>{
    if(!req.session.auth){
        return;
    }else{
        const userID = req.session.user_id;

        const firstName = req.body.firstname;
        const lastName =req.body.lastname;
        const ssn = req.body.ssn;
        const licensePlate = req.body.licenseplate;

        console.log(`${new Date().toISOString()} > [RETRIEVING SUSPECTS DATA FOR USER:${userID} STARTED]`);

        //res.json({"error":200});

        const connection = dbConnection();
        connection.connect((err)=>{
            if(err){
                console.log(err);
                return;
            }else{
                console.log(`${new Date().toISOString()} > [DATABASE CONNECTION POST:{/suspects/addsuspect} OPENED]`);
                const query = `INSERT INTO suspects (user_id, first_name, last_name, ssn, license_plate) VALUES (${userID},'${firstName}','${lastName}','${ssn}','${licensePlate}')`;
                connection.query(query,(err,results)=>{
                    if(err){
                        console.log(err);
                        return;
                    }else{
                        console.log(`${new Date().toISOString()} > [NEW SUSPECT FOR USER:${userID} ADDED]`);
                        connection.end();
                        console.log(`${new Date().toISOString()} > [DATABASE CONNECTION POST:{/suspects/addsuspect} CLOSED]`);
                    }
                })
            }
        })
        res.redirect('/suspects');
    }
})
app.post('/suspects/editsuspect', (req,res)=>{
    if(!req.session.auth){
        return;
    }else{
        console.log(`${new Date().toISOString()} > [EDIT SUSPECT PROCESS STARTED]`);

        const suspectID = req.body.suspectID;
        const firstName = req.body.firstname;
        const lastName = req.body.lastname;
        const ssn = req.body.ssn;
        const licensePlate = req.body.licenseplate;

        const connection = dbConnection();

        connection.connect((err)=>{
            if(err){
                console.log(err);
                return;
            }
            console.log(`${new Date().toISOString()} > [DATABASE CONNECTION POST:{/suspects/editsuspect} OPENED]`);
            const query = `UPDATE suspects SET first_name = '${firstName}',last_name = '${lastName}',ssn = '${ssn}',license_plate = '${licensePlate}' WHERE suspect_id = ${suspectID};`;
            var results;
            //send insert query to suspects table
            connection.query(query,(err,results)=>{
                if(err){
                    console.log(err);
                    return;
                }
                //close database connection
                console.log(`${new Date().toISOString()} > [SUSPECT HAS BEEN UPDATED]`);
                connection.end();
                console.log(`${new Date().toISOString()} > [DATABASE CONNECTION POST:{/suspects/editsuspect} CLOSED]`);
            })
        });
        //after process is finished redirect back to admin page
        res.redirect('/suspects');
    }
})
app.post('/suspects/searchsuspect', (req,res)=>{
    if(!req.session.auth){
        return;
    }else{
        console.log(`${new Date().toISOString()} > [SEARCHING SUSPECT PROCESS STARTED]`);
        const suspectsSSN = req.body.ssnSearch;

        const connection = dbConnection();
        connection.connect((err)=>{
            if(err){
                console.log(err);
                return;
            }else{
                console.log(`${new Date().toISOString()} > [DATABASE CONNECTION POST:{/suspects/serachuser} OPENED]`);
                const query = `SELECT suspect_id,first_name,last_name,ssn,license_plate,is_spotted FROM suspects WHERE ssn = '${suspectsSSN}'`;
                connection.query(query,(err,results)=>{
                    if(err){
                        console.log(err);
                        return;
                    }else{
                        res.json(results);
                        console.log(`${new Date().toISOString()} > [QUERY FOR ${suspectsSSN} FOUND]`);
                        return;
                    }
                })
            }
            connection.end();
            console.log(`${new Date().toISOString()} > [DATABASE CONNECTION POST:{/suspects/serachuser} CLOSED]`);
        })
    }
})
app.post('/suspects/deletesuspect', (req,res)=>{
    if(!req.session.auth){
        return;
    }else{

        const selectedSuspectID =req.body.selected_suspect_id;
        console.log(`${new Date().toISOString()} > [DELETE SUSPECT WITH ID ${selectedSuspectID} PROCESS STARTED]`);

        const connection = dbConnection();
        connection.connect((err)=>{
            if(err){
                console.log(err);
                return;
            }else{
                console.log(`${new Date().toISOString()} > [DATABASE CONNECTION POST:{/suspects/deletesuspect} OPENED]`);
                const query = `DELETE FROM suspects WHERE suspect_id = ${selectedSuspectID}`;
                connection.query(query,(err,results)=>{
                    if(err){
                        console.log(err);
                        return;
                    }else{
                        console.log(`${new Date().toISOString()} > [SUSPECT ${selectedSuspectID} DELETED]`);
                        connection.end();
                        console.log(`${new Date().toISOString()} > [DATABASE CONNECTION POST:{/suspects/deletesuspect} CLOSED]`);
                    }
                })
                res.redirect('/suspects');
            }
        })
    }
})

// CAMERA TAB WITH ALL ACTIONS

var WebSocketProxy = null;// a variable to store the camera socket so the user will be able toretreive info from it

app.get('/camera', (req, res)=>{
    //check session if exists the redirects to camera.html else redirects to login
    if(req.session.auth&&req.session.isAdmin==0){
        res.sendFile('/camera.html', { root: __dirname + '/../' });
        console.log(`${new Date().toISOString()} > [ USER ACCESSED CAMERA PAGE ]`);
        return;
    }
    res.redirect('/login');
})
app.ws('/cameraStream', (ws, req)=>{
    console.log(`${new Date().toISOString()} > [ STREAM WebSockets CAMERA CONNECTED ]`);
    WebSocketProxy = ws;
})
app.ws('/userStream', (ws, req)=>{
    console.log(`${new Date().toISOString()} > [ STREAM WebSockets USER CONNECTED ]`);

    if(WebSocketProxy!=null){
        WebSocketProxy.on("message",(msg)=>{
            ws.send(msg);
        });
    }else{
        ws.send("1");
    }

    ws.on('close',()=>{
        console.log(`${new Date().toISOString()} > [ STREAM WebSockets USER DISCONNECTED ]`);
        ws.close();
    })

    ws.on('message',async (msg)=>{
        //call a function that will return detected license plate from image,
        // or null if no license plate.
        let base_64_frame_buffer = msg.toString('base64');
        let licensePlate = await getLicensePlate(base_64_frame_buffer);

        if(licensePlate!=null){
            updateSuspectStatus(licensePlate);
            ws.send(`2${licensePlate}`);
        }else{
            ws.send(`3No License Plate Was Detected`);
            console.log(`${new Date().toISOString()} > [ NO LICENSE PLATE DETECTED ]`);
            return;
        }
    })
})


// ACCOUNT TAB WITH ALL ACTIONS

app.get('/account', (req, res)=>{
    //check session if exists the redirects to camera.html else redirects to login
    if(req.session.auth&&req.session.isAdmin==0){
        res.sendFile('/account.html', { root: __dirname + '/../' });
        return;
    }
    res.redirect('/login');
})
app.post('/account', (req, res)=>{
    if(!req.session.auth){
        return;
    }else{
        const userID = req.session.user_id;
        console.log(`${new Date().toISOString()} > [RETRIEVING USER ${userID} DATA PROCESS STARTED]`);
        
        const connection = dbConnection();
        connection.connect((err)=>{
            if(err){
                console.log(err);
                return;
            }else{
                console.log(`${new Date().toISOString()} > [DATABASE CONNECTION POST:{/account} OPENED]`);
                const query = `SELECT first_name,last_name,ssn,username,phone_number,email_address FROM users WHERE user_id = ${userID};`;
                connection.query(query,(err,results)=>{
                    if(err){
                        console.log(err);
                        return;
                    }else{
                        res.json(results);
                        console.log(`${new Date().toISOString()} > [USER ${userID} DATA SENT SUCCESSFULLY]`);
                        connection.end();
                        console.log(`${new Date().toISOString()} > [DATABASE CONNECTION POST:{/account} CLOSED]`);
                    }
                })
            }
        })
    }
})
app.post('/account/changePhoneNumber', (req,res)=>{
    if(!req.session.auth){
        return;
    }else{
        const userID = req.session.user_id;
        const newPhoneNumber = req.body.phonenumber;

        console.log(`${new Date().toISOString()} > [CHANGING PHONE NUMBER FOR USER:${userID} STARTED]`);

        const connection = dbConnection();
        connection.connect((err)=>{
            if(err){
                console.log(err);
                return;
            }else{
                console.log(`${new Date().toISOString()} > [DATABASE CONNECTION POST:{/account/changePhoneNumber} OPENED]`);
                const query = `UPDATE users SET phone_number = '${newPhoneNumber}' WHERE user_id = ${userID}`;
                var results;
                connection.query(query,(err,results)=>{
                    if(err){
                        console.log(err);
                        return;
                    }
                    console.log(`${new Date().toISOString()} > [PHONE NUMBER FOR USER:${userID} HAS BEEN UPDATED]`);
                    connection.end();
                    console.log(`${new Date().toISOString()} > [DATABASE CONNECTION POST:{/account/changePhoneNumber} CLOSED]`);
                })
            }
        })
        res.redirect('/account');
    }
})
app.post('/account/changeEmailAddress', (req,res)=>{
    if(!req.session.auth){
        return;
    }else{
        const userID = req.session.user_id;
        const newEmailAddress = req.body.emailaddress;

        console.log(`${new Date().toISOString()} > [CHANGING EMAIL ADDRESS FOR USER:${userID} STARTED]`);

        const connection = dbConnection();

        connection.connect((err)=>{
            if(err){
                console.log(err);
                return;
            }else{
                console.log(`${new Date().toISOString()} > [DATABASE CONNECTION POST:{/account/changeEmailAddress} OPENED]`);
                const query = `UPDATE users SET email_address = '${newEmailAddress}' WHERE user_id = ${userID}`;
                var results;
                connection.query(query,(err,results)=>{
                    if(err){
                        console.log(err);
                        return;
                    }
                    console.log(`${new Date().toISOString()} > [EMAIL ADDRESS FOR USER:${userID} HAS BEEN UPDATED]`);
                    connection.end();
                    console.log(`${new Date().toISOString()} > [DATABASE CONNECTION POST:{/account/changeEmailAddress} CLOSED]`);
                })
            }
        })
        res.redirect('/account');
    }
})
app.post('/account/changePassword', (req,res)=>{
    if(!req.session.auth){
        return;
    }else{
        const userID = req.session.user_id;
        const currentPassword = req.body.currentPassword;
        const newPassword = req.body.newPassword;

        console.log(`${new Date().toISOString()} > [CHANGING PASSWORD FOR USER:${userID} STARTED]`);

        const connection1 = dbConnection();
        connection1.connect((err)=>{
            if(err){
                console.log(err);
                return;
            }else{
                console.log(`${new Date().toISOString()} > [DATABASE CONNECTION POST:{/account/changePassword} OPENED]`);
                const query1 = `SELECT password_hash FROM users WHERE user_id = ${userID}`;
                connection1.query(query1,(err,results)=>{
                    if(err){
                        console.log(err);
                        return;
                    }else{
                        const result = results[0]["password_hash"];
                        const currentEncrypted = crypto.createHash('sha512').update(currentPassword).digest('hex');
                        
                        if(result !== currentEncrypted){
                            res.json(JSON.stringify({"error":406})).end();
                            console.log(`${new Date().toISOString()} > [RECEIVED PASSWORD DOESN'T MATCHES THE CURRENT PASSWORD FOR USER ${userID}]`);
                        }
                        console.log(`${new Date().toISOString()} > [RECEIVED PASSWORD MATCHES THE CURRENT PASSWORD FOR USER ${userID}]`);
                    }
                })
            }
            connection1.end();
            console.log(`${new Date().toISOString()} > [DATABASE CONNECTION POST:{/account/changePassword} CLOSED]`);
        })
        const connection2 = dbConnection();
        connection2.connect((err)=>{
            if(err){
                console.log(err);
                return;
            }else{
                const newEncrypted = crypto.createHash('sha512').update(newPassword).digest('hex');
                console.log(`${new Date().toISOString()} > [DATABASE CONNECTION POST:{/account/changePassword} OPENED]`);
                const query2 = `UPDATE users SET password_hash = '${newEncrypted}' WHERE user_id = ${userID}`;
                    connection2.query(query2,(err,results)=>{
                        if(err){
                            console.log(err);
                            return;
                        }else{
                            console.log(`${new Date().toISOString()} > [PASSWORD FOR USER ${userID} HAS CHANGED SUCCESSFULLY]`);
                        }
                    });
                res.json(JSON.stringify({"error":200})).end();
                connection2.end();
                console.log(`${new Date().toISOString()} > [DATABASE CONNECTION POST:{/account/changePassword} CLOSED]`);
            }
        })
    }
})

// UNIVERSAL

app.get('/logout', (req, res)=>{
    req.session.destroy();
    console.log(`${new Date().toISOString()} > [${req.sessionID} SESSION DESTROYED]`);
    res.redirect('/login');
})

// LISTENER

app.listen(PORT, () => {
    console.log(`${new Date().toISOString()} > [SERVER IS LISTENING ON localhost:${PORT}]`);
});