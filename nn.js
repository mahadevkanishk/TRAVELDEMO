

const express    =  require("express");
      path       =  require("path");
      bodyParser =  require("body-parser");
      multer     =  require("multer");
      fs         =  require('fs');



      var app        = express();

var mongoose = require('mongoose');

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

// ======== //

// redefining paths //

app.use(express.static(path.join(__dirname, '/public')));
app.use("*/user", express.static(__dirname + "/public"));
app.use("*/newtrip", express.static(__dirname + "/public"));
app.use("*/userinfo", express.static(__dirname + "/public"));
app.use("*/showpage", express.static(__dirname + "/public"));


// app.use("*/user/vendor", express.static(__dirname + "/public/vendor"));


// ======== //


app.set('view engine', 'ejs');
mongoose.connect('mongodb://monkhop:monkhop@cluster0-shard-00-00.mshx6.mongodb.net:27017,cluster0-shard-00-01.mshx6.mongodb.net:27017,cluster0-shard-00-02.mshx6.mongodb.net:27017/monkhop?ssl=true&replicaSet=atlas-3q84u9-shard-0&authSource=admin&retryWrites=true&w=majority');
mongoose.pluralize(null);




var user_Schema= new mongoose.Schema({

name : String,
email : String,
pass : String,
proff : String,
userstatus : Boolean,
purpose : String,


imgprofile :
    {
      data: Buffer,
      contentType: String
    },

tripdata : [{
       type : mongoose.Schema.Types.ObjectId,
       ref  : 'tripdata' 
}]

});

var trip_Schema= new mongoose.Schema({

    
    tname: String,
    tdesc: String,
    img:[
    {
      data: Buffer,
      contentType: String
    }]
});

var tripdata = mongoose.model("tripdata",trip_Schema);
var user = mongoose.model("user", user_Schema);    





// middlewares //

var  imagestorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './public/uploads/trips')

    },
    filename: (req, file, cb) => {
        cb(null, file.originalname  )
    }
});
 
var upload = multer({ storage: imagestorage });

var  profileimagestorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './public/uploads/profile')

    },
    filename: (req, file, cb) => {
        cb(null, file.originalname  )
    }
});
 
var uploadprofile = multer({ storage: profileimagestorage });






// routes start here //

app.get("/",function(req,res){
    res.render('moments');
});
// app.get("/index.ejs",function(req,res){
//     res.render('index');
// });
// app.get("/contact-us.ejs",function(req,res){
//     res.render('contact-us');
// });
app.get("/moments.ejs",function(req,res){
    res.render('moments');
});
// app.get("/priyam.ejs",function(req,res){
//     res.render('priyam');
// });
app.get("/signup.ejs",function(req,res){
    res.render('signup');
});
app.get("/signin.ejs",function(req,res){
    res.render('signin');
});
app.get("/userinfo/:id",function(req,res){
    var user_id= req.params.id;
    user.findById(user_id,function(err,data){

        if(err){
            console.log(err);
        }
        else{
            res.render('userinfo',{user : data, user_id : user_id});
        }
    });
    
});
app.get("/user/:id",function(req,res){
  
    var user_id= req.params.id ;
    user.findById(req.params.id).populate('tripdata').exec(function(err,dataimg){
        if(err){
            console.log(err);
            res.send("there is a error");
        }
        else{
            
            
            // console.log(dataimg.tripdata[0].img[0].contentType);
            res.render('userhome',{user : dataimg});
        }
    });
});
app.get("/newtrip/:id",function(req,res){
    var user_id = req.params.id;
    res.render("newtrip",{user_id : user_id});
});

app.get("/showpage/:id",function(req,res){
   
    user.findById(req.params.id,function(err,user){
      
    if(err){
        console.log(err)
    }
    else{
        res.render("showpage",{user : user})
    }

   })
    
})






app.get("/logout/:id",function(req,res){
    var id1= req.params.id;
    user.findByIdAndUpdate( id1, {userstatus : false } , function(err,dataus){
        if (err){
            console.log(err);
        }
        else{
            
            console.log(dataus.userstatus);
        }


    })

    res.redirect("/user/" + id1);
});





// post routes start here!!

app.post('/userinfo/:id',uploadprofile.single('proimage'),function(req,res){
  
    var obj1 = {

        proff : req.body.proff,
        purpose : req.body.purpose,
        
        img: {
            data: fs.readFileSync(path.join(__dirname + '/public/uploads/profile/' + req.file.filename)),
            contentType: 'image/png'
        }
    }

    user.findById(req.params.id,function(err,data){

        if(err){
            console.log(err);
        }
        else{
        // console.log(data);
        data.proff      =  obj1.proff;
        data.purpose    =  obj1.purpose;
        data.imgprofile =  obj1.img;
        // console.log(data);
        data.save(function(err,datao){
            // console.log(datao.userstatus);
            res.render('userhome',{user : data});
        })

        }




    });
   

});


app.post("/newtrip/:id",upload.array('image'),function(req,res){

    
    var imgarr = [];
    

    for(var i =0; i<req.files.length; i++){
        
        var imgobj = {
            data : Buffer,
            contentType : String
        };
        
        console.log("okay till here");

        imgobj.data        =  fs.readFileSync(path.join(__dirname + '/public/uploads/trips/' + req.files[i].filename));
        imgobj.contentType = 'image/png'; 
        imgarr.push(imgobj);
        // console.log("okay till here");

        
            

    }

    console.log(imgarr);

    var obj = {


        tname :  req.body.tname,
        tdesc :  req.body.tdesc,
        img   :  imgarr
        
    }

    
    tripdata.create(obj ,function(err,data){
        if(err){
            console.log("error in saving to databsae");
        }
        
        else {
        user.findById(req.params.id,function(err,founduser){

            if(err){
                console.log(err);
            }
            else{
                
                founduser.tripdata.push(data);
                founduser.save(function(err,fulldata){
                    if(err){
                        console.log(err);
                    }
                    else{
                        
                        res.redirect("/user/" + req.params.id);
                        
                        // user.findById(req.params.id).populate('tripdata').exec(function(err,user){
                        //     if(err){
                        //         console.log(err);
                        //         res.send("there is a error");
                        //     }
                        //     else{
                                
                                
                                
                        //         res.render('userhome',{user : user});
                        //     }
                        // });

                        
                    }
                });
            }


        });

    }
        
    });
    
    

});






app.post("/newmember",function(req,res){
    
    (req.body).userstatus = 'true' ;
    var info = req.body;
    // console.log(req.body);
    
    user.create(info,function(err,npa){
        if(err){
            console.log("error in saving to databsae");
        }
        else 
        // console.log(npa);
        res.redirect('/userinfo/'+ npa._id);

        
    });
});

app.post("/search",function(req,res){
  
    var usearch = req.body.search;
    user.findOne({name : usearch},function(err,datas){
       if(datas.userstatus=== true){
           res.send("sorry the user is currently updating his page");
       } 
       else{
        if( datas === null ){
            res.send("no user found");
        }
        else if (usearch === datas.name) {
            
            res.redirect('/user/' + datas._id)
        }
        else{
            console.log(err);
        }
       }

    })


})

app.post("/member",function(req,res){
    var checkn = req.body.your_name;
    var checkp = req.body.your_pass;
    user.findOneAndUpdate({name : checkn, pass: checkp},{userstatus : true},function(err,datap){
        // datap.userstatus = 'true';
        // console.log(datap);
        if ( datap === null) 
            res.send(" wrong credentials or invalid login ID");   
        else if ((checkn === datap.name ) && (checkp === datap.pass)){
            res.redirect('/user/' + datap._id);
            
        }
            
        else 
            console.log(err);
        });
    
});   

app.listen(3000,function(){
    console.log("server is ON");
});



