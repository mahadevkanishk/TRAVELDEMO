

const express    =  require("express");
      path       =  require("path");
      bodyParser =  require("body-parser");
      multer     =  require("multer");
      fs         =  require('fs');
      methodOverride = require('method-override');



      var app        = express();

var mongoose = require('mongoose');

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(methodOverride("_method"));

// ======== //

// redefining paths //

app.use(express.static(path.join(__dirname, '/public')));
app.use("*/user", express.static(__dirname + "/public"));
app.use("*/user/:id/editprofile", express.static(__dirname + "/public"));
app.use("*/newtrip", express.static(__dirname + "/public"));
app.use("*/userinfo", express.static(__dirname + "/public"));
app.use("*/showpage", express.static(__dirname + "/public"));
app.use("*/showpage/:id/:tname", express.static(__dirname + "/public"));
app.use("*/user/:id/:tname", express.static(__dirname + "/public"));
app.use("*/delete/:id/:k/:tname", express.static(__dirname + "/public"));






// ======== //


app.set('view engine', 'ejs');
// mongoose.connect('mongodb://localhost/user');
mongoose.connect('mongodb://monkhop:monkhop@cluster0-shard-00-00.mshx6.mongodb.net:27017,cluster0-shard-00-01.mshx6.mongodb.net:27017,cluster0-shard-00-02.mshx6.mongodb.net:27017/user?ssl=true&replicaSet=atlas-3q84u9-shard-0&authSource=admin&retryWrites=true&w=majority')

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

app.get("/moments.ejs",function(req,res){
    res.render('moments');
});

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
  
    
    user.findById(req.params.id).populate('tripdata').exec(function(err,data){
        if(err){
            console.log(err);
            res.send("there is a error");
        }
        else{
            
            
           
            res.render('userhome',{user : data});
        }
    });
});
app.get("/newtrip/:id",function(req,res){
    var user_id = req.params.id;
    res.render("newtrip",{user_id : user_id});
});

app.get("/showpage/:id/:tname/",function(req,res){

    
    var tripname = req.params.tname;
    user.findById(req.params.id).populate('tripdata').exec(function(err,user){
        if(err){
            console.log(err);
            res.send("there is a error");
        }
        else{
            
            
            
            res.render('showpage',{user : user, tripname : tripname});
        }
    });
    
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
       
        data.proff      =  obj1.proff;
        data.purpose    =  obj1.purpose;
        data.imgprofile =  obj1.img;
        data.save(function(err,datao){
            
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
        
        

        imgobj.data        =  fs.readFileSync(path.join(__dirname + '/public/uploads/trips/' + req.files[i].filename));
        imgobj.contentType = 'image/png'; 
        imgarr.push(imgobj);
       
        
            

    }

    
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
    
    user.create(info,function(err,npa){
        if(err){
            console.log("error in saving to databsae");
        }
        else 
        
        res.redirect('/userinfo/'+ npa._id);

        
    });
});

app.post("/search",function(req,res){
  
    var usearch = req.body.search;
    user.findOne({name : usearch},function(err,datas){
    
       
        if( datas === null ){
            res.render("errorpage");
        }
        else if (usearch === datas.name) {
            if(datas.userstatus=== true){
                
                res.render("errorpage2");
            } 
            else
            res.redirect('/user/' + datas._id)
        }
        else{
            console.log(err);
        }
       

    })


})

app.post("/member",function(req,res){
    var checkn = req.body.your_name;
    var checkp = req.body.your_pass;
    user.findOneAndUpdate({name : checkn, pass: checkp},{userstatus : true},function(err,datap){
        
        if ( datap === null) 
            res.render("errorpage3"); 
        else if ((checkn === datap.name ) && (checkp === datap.pass)){
            res.redirect('/user/' + datap._id);
            
        }
            
        else 
            console.log(err);
        });
    
});  



// edit, update and delete routes

app.get("/user/:id/editp",function(req,res){
    user.findById(req.params.id,function(err,dataep){
        if(err){
            console.log(err);
        }
        else{
            res.render("profile",{user : dataep});
        }
    })
})

app.put("/user/:id/editprofile/update",uploadprofile.single('imagep'),function(req,res){
    // console.log(req.body);
    var obj1 = {

        proff : req.body.proff,
        purpose : req.body.purpose,
        pass : req.body.pass,
        name : req.body.name,
        
        imgprofile : {
            data: fs.readFileSync(path.join(__dirname + '/public/uploads/profile/' + req.file.filename)),
            contentType: 'image/png'
        }
    }

    user.findByIdAndUpdate(req.params.id, obj1 , function(err,dataed){
        if(err){
            console.log(err);

        }
        else{
            res.redirect("/user/" + req.params.id);
        }
    })
})



app.get("/user/:id/:tname/edit", function(req,res){
    


    
    var tripname = req.params.tname;
    user.findById(req.params.id).populate('tripdata').exec(function(err,user){
        if(err){
            console.log(err);
            res.send("there is a error");
        }
        else{
            
            
            
            res.render('edit',{user : user, tripname : tripname});
        }
    });

    
    

})

app.put("/user/:id/:tname/:k/update",upload.array('image'),function(req,res){
    var k = req.params.k;
    var ttname = req.body.tname;
    var ttdesc =  req.body.tdesc;
    
    
    var imgarr2 = [];

    for(var i =0; i < req.files.length; i++){
        var imgobj2 = {
            data : Buffer,
            contentType : String
        };
        imgobj2.data        =  fs.readFileSync(path.join(__dirname + '/public/uploads/trips/' + req.files[i].filename));
        imgobj2.contentType = 'image/png'; 
        imgarr2.push(imgobj2);
        
    }
    
    user.findById(req.params.id).populate('tripdata').exec(function(req,user1){
        user1.tripdata[k].img.push(...imgarr2);
        user1.save(function(err,dd){
            console.log("good till here");
            if(err){
                console.log(err);
            }
            else{
                tripdata.findByIdAndUpdate(user1.tripdata[k],{ img : user1.tripdata[k].img , tname :  ttname , tdesc :  ttdesc} , function(err,data){

                  if(err){
                  console.log(err);
                   }
                  else{
                   
                   res.redirect("/user/" + user1._id);
                   }
    
               })
                
            }
        });
    })
    
    
})

app.delete("/delete/:id/:i/:tname",function(req,res){
    var i= req.params.i;
    console.log(i);

user.findById(req.params.id).populate('tripdata').exec(function(err,userd){
    if(err){
        console.log(err);
    }
    else{
        
        tripdata.findByIdAndDelete(userd.tripdata[i],function(err,datad){
            if(err){
              console.log(err);
            }
            else{
              res.redirect("/user/" + req.params.id);
            }
          })
      
    }

    })
    


})

app.listen(3000,function(){
    console.log("server is ON");
});



