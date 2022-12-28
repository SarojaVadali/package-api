const mysql = require('mysql');
const express= require('express');
var cors=require('cors');
const app=express();
const multer=require('multer');
var path = require('path');
const validator = require("validator");
const docusign = require('docusign-esign');
const bodyparser=require('body-parser');
app.use(express.static(path.join(__dirname+'/uploads')));
app.use(bodyparser.json());
app.use(cors());
const signingViaEmailModule=require('./signingviaemail');
const jwtAuth=require('./jwtConsole');
const  listEnvelope = require("./listEnvelopes");
const  {getEnvelope}  = require("./envelopeInfo");
const { use } = require('chai');


var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads')
    },
    filename: function (req, file, cb) { debugger;  
        //console.log(file.fieldname);
        cb(null, file.fieldname + '-' + Date.now() + '' + path.extname(file.originalname));
      //cb(null, Date.now() + path.extname(file.originalname)) //Appending extension
    }
  })
  
  //const upload=multer({storage:storage}).single('file');
  const multipleUpload = multer({ storage: storage }).array('files');
  const upload=multer({storage:storage});

var mysqlCon=mysql.createConnection({
    host:'localhost',
    user: 'christauser',//'root',
    password:'password1!', //'Password1',
    database:'christadevdb',
    multipleStatements:true
});

mysqlCon.connect((err)=>{
    if(!err)
    console.log('DB Connection succeded.');
    else
    console.log('DB connection failed \n Error : '+ JSON.stringify(err,undefined,2));
});

app.listen(3000,()=>console.log('Express server is running at port no:3000'));

//Get all packages
app.get('/packageapi/GetAllPackages',(req,res)=>{
mysqlCon.query('Select * from PackageList',(err, rows, fields)=>{
    if(!err)
        res.send({
            message : 'success',
            data: rows
        });
    else
        console.log(err);
})
});

//Get package by ID
// app.get('/packageapi/GetPackageById/:id',(req,res)=>{
//     mysqlCon.query('Select * from PackageList where PackageId=?',[req.params.id],(err, rows, fields)=>{
//         if(!err)
//             res.send(rows);
//         else
//             console.log(error);
//     })
// });

//Delete package by ID
app.delete('/packageapi/DeletePackageById/:id',(req,res)=>{
    let pId=req.params.id;
    //mysqlCon.query('Delete from PackageList where PackageId=?',[pId],(err, rows, fields)=>{
mysqlCon.query('Delete from packagedoclist where PackageId=?;Delete from PackageList where PackageId=?',[pId,pId],(err, rows, fields)=>{
        if(!err)
            res.send({
                message : 'success'
            });
        else
            console.log(err);
    })
});

//Upload Files
// app.post('/packageapi/UploadFiles',upload.array('files',50),(req,res)=>{
//     console.log('upload started');
//     if(req.files){
//         req.files.forEach(file => {
//             console.log(file.filename + " 1");
//             console.log(file.originalname + " 2")
//         });
//     }
   
//     let fileNames=[]
//     req.files.forEach(file => {
//         fileNames.push(file.path);
//     });
//     let pId=17;

//     mysqlCon.connect(function(err) { // create a single connection to execute all the queries
//         req.files.forEach(file => { //use let instead of var to prevent issues with closures in asynchronous code
//             console.log(file.fileName);
//             mysqlCon.query(`INSERT INTO PackageDocList (PackageId,DocName,OriginalDocName,DocPath,CreatedBy,CreatedOn)
//                  VALUES (${pId}, '${file.filename}', '${file.originalname}','${file.path}','Christa',now() )`, function (err, result) {
//                 if(err) throw err;
//                 console.log('File names saved.')
//             });
//         });
//     })

// });

//Getting AccessKey
app.post('/packageapi/GetAccessKey',(req,res)=>{
    console.log('Fetching access key ..');
    const demoDocsPath = path.resolve(__dirname, "./uploads");
    const doc2File = "01 Cover Sheet.pdf";
    const doc3File = "02 Trust Advisory.pdf";
    const envelopeArgs = {
        signerEmail: 's.vadali@ampliforce.com',
        signerName: 'Saroja',
        ccEmail: 's.vellanki@ampliforce.com',
        ccName: 'Sriram',
        status: "sent",        
        doc2File: path.resolve(demoDocsPath, doc2File),
        doc3File: path.resolve(demoDocsPath, doc3File)
      };
      jwtAuth.main(envelopeArgs);
    // let userkeys=[];
    // //userkeys = 
    // jwtAuth.authenticate(), function (err, result){
    //     console.log(result);
    //     if(err) throw err;
    // }
    });

//Listing Envelopes
// app.post('/packageapi/ListEnvelopes',(req,res)=>{
//     console.log("Listing envelopes started ..");
// });

//Tracking envelope status
app.post('/packageapi/TrackEnvelopeStatus', async (req,res)=>{
    console.log("Getting envelope status started ..");
    const args = {
        accessToken: 'eyJ0eXAiOiJNVCIsImFsZyI6IlJTMjU2Iiwia2lkIjoiNjgxODVmZjEtNGU1MS00Y2U5LWFmMWMtNjg5ODEyMjAzMzE3In0.AQoAAAABAAUABwCAJBDQkOjaSAgAgIzUMZno2kgCAB0JXY2oK1RDksBC7xYCP6IVAAEAAAAYAAIAAAAFAAAAHQAAAA0AJAAAADAzYTE5MTk5LWFmMmUtNGE4MC04YWZmLWIwZDQ3YjdlMmU1YiIAJAAAADAzYTE5MTk5LWFmMmUtNGE4MC04YWZmLWIwZDQ3YjdlMmU1YhIAAQAAAAYAAABqd3RfYnIjACQAAAAwM2ExOTE5OS1hZjJlLTRhODAtOGFmZi1iMGQ0N2I3ZTJlNWI.s_825LV800CGqR2YU8d4nxEMGsQ0WD16bdxUMew8cMLAe36OAUAWV2S4Yftr0ZyAT7e_w-UsjhHxIOZaGAPyV5trAoL_quZMnc0Zj9QC5g6oQWDagBNKP9W_z-sHq9gBPTP2JWdhMir1V-balo35v7TIZz48QLq_YzaXj4S4Vvpe-aU6TuKI1RqePWizQJLtjt0JK_fO0wn3LM9nW4OUllOI1eJlL1mUxCZdAEWetVW9x6K2i9NZhQcV_hRKyFAkO_GtXNP4DoqQZ1sUumPhLMSq-Ahuczm4pEMrND7RdCMexiOQZ6z4lCQw-DXQBZeIsb0-QbPFHNv27yqCnZ5JjQ',
        basePath: 'https://demo.docusign.net/restapi ',
        accountId: 'f3051414-5709-4d8a-8ff4-b03dbadb4269',
        envelopeId: '419f313c-1515-43c0-9c3b-71ecaaa69420'
    };
    let results = null;
    
    try {
        results = await envelopeInfo.getEnvelope(args);
    } catch (error) {
        console.log('error started..');
        const errorBody = error && error.response && error.response.body;
        // we can pull the DocuSign error code and message from the response body
        const errorCode = errorBody && errorBody.errorCode
        const errorMessage = errorBody && errorBody.message;
        // In production, may want to provide customized error messages and
        // remediation advice to the user.
       // res.render('pages/error', {err: error, errorCode, errorMessage});
    }

    console.log(results);

});
    
//Insert a package
app.post('/packageapi/AddPackage',upload.array('files',50),(req,res)=>{
    let package=req.body;
    // if(req.files){
    //     req.files.forEach(file => {
    //         console.log(file.filename + " 1");
    //         console.log(file.originalname + " 2")
    //     });
    // }  

     var sql="set @PackageId=?; set @Buyer1Name=?;set @Buyer1Email=?;set @Buyer2Name=?;set @Buyer2Email=?;\
    set @BrokerName=?; set @BrokerEmail=?; set @DocCount=?;set @DocPath=?; set @PackageStatus=?;\
    set @CreatedBy=?;set @ModifiedBy=?; \
    call AddOrEditPackage(@PackageId,@Buyer1Name,@Buyer1Email,@Buyer2Name,@Buyer2Email,\
        @BrokerName,@BrokerEmail,@DocCount,@DocPath,@PackageStatus,@CreatedBy,@ModifiedBy);";

    mysqlCon.query(sql,[package.PackageId,package.Buyer1Name,package.Buyer1Email,package.Buyer2Name,
        package.Buyer2Email,package.BrokerName,package.BrokerEmail,package.DocCount,
        package.DocPath,package.PackageStatus,package.CreatedBy,package.ModifiedBy],(err, rows, fields)=>{
        if(!err)
            rows.forEach(element => {
                console.log(element);
                if(element.constructor == Array){
                    let pId=element[0].PackageId;
                    console.log('file upload started');
                    req.files.forEach(file => { //use let instead of var to prevent issues with closures in asynchronous code
                        console.log(file.fileName);
                        mysqlCon.query(`INSERT INTO PackageDocList (PackageId,DocName,OriginalDocName,DocPath,CreatedBy,CreatedOn)
                             VALUES (${pId}, '${file.filename}', '${file.originalname}','${file.path}','Christa',now() )`, function (err, result) {
                            if(err) throw err;
                            console.log('File names saved.')
                        });
                    });

                    //Make API call here -- START
                    // const demoDocsPath = path.resolve(__dirname, "./uploads");
                    // const doc2File = "01 Cover Sheet.pdf";
                    // const doc3File = "02 Trust Advisory.pdf";

                    // const envelopeArgs = {
                    //     signerEmail: validator.escape('saroja241@gmail.com'),
                    //     signerName: validator.escape('Saroja'),
                    //     ccEmail: validator.escape('s.vadali@ampliforce.com'),
                    //     ccName: validator.escape('Ampli'),
                    //     status: "sent",
                    //     doc2File: path.resolve(demoDocsPath, doc2File),
                    //     doc3File: path.resolve(demoDocsPath, doc3File),
                    //     // signerEmail: validator.escape(body.signerEmail),
                    //     // signerName: validator.escape(body.signerName),
                    //     // ccEmail: validator.escape(body.ccEmail),
                    //     // ccName: validator.escape(body.ccName),
                    //     // status: "sent",
                    //     // doc2File: path.resolve(demoDocsPath, doc2File),
                    //     // doc3File: path.resolve(demoDocsPath, doc3File), 
                    //   };

                    //   let accountIdVal='f3051414-5709-4d8a-8ff4-b03dbadb4269';
                    //   let basePathVal='https://demo.docusign.net';

                    // const args = {
                    //     // accessToken: req.user.accessToken,
                    //     // basePath: req.session.basePath,
                    //     // accountId: req.session.accountId,
                    //     envelopeArgs: envelopeArgs,
                    //   };

                    // let results = null; 
                    // try {                        
                    //     results =  this.signingViaEmailModule.sendEnvelope(args);
                    //   } catch (error) {
                    //     const errorBody = error && error.response && error.response.body;
                    //     // we can pull the DocuSign error code and message from the response body
                    //     const errorCode = errorBody && errorBody.errorCode;
                    //     const errorMessage = errorBody && errorBody.message;
                    //     // In production, may want to provide customized error messages and
                    //     // remediation advice to the user.
                    //     res.render("pages/error", { err: error, errorCode, errorMessage });
                    //   }
                    //   if (results) {
                    //     req.session.envelopeId = results.envelopeId; // Save for use by other examples
                    //   }
                    //Make API call here -- END
                 res.send({
                    message : 'success',
                    data : pId
                 });
                }
            });
        else
            console.log(err);
    })
});

//Update package
app.put('/packageapi/UpdatePackage',(req,res)=>{
    let package=req.body;
    var sql="set @PackageId=?; set @Buyer1Name=?;set @Buyer1Email=?;set @Buyer2Name=?;set @Buyer2Email=?;\
    set @BrokerName=?; set @BrokerEmail=?; set @DocCount=?;set @DocPath=?;set @PackageStatus=?; \
    set @CreatedBy=?;set @ModifiedBy=?; \
    call AddOrEditPackage(@PackageId,@Buyer1Name,@Buyer1Email,@Buyer2Name,@Buyer2Email,\
        @BrokerName,@BrokerEmail,@DocCount,@DocPath,@PackageStatus,@CreatedBy,@ModifiedBy);";
        mysqlCon.query(sql,[package.PackageId,package.Buyer1Name,package.Buyer1Email,package.Buyer2Name,
            package.Buyer2Email,package.BrokerName,package.BrokerEmail,package.DocCount,
            package.DocPath,package.PackageStatus,package.CreatedBy,package.ModifiedBy],(err, rows, fields)=>{
            if(!err)
                rows.forEach(element => {
                    if(element.constructor == Array)
                     res.send({
                        message : 'success'
                     });
                });
            else
                console.log(err);
        })
});