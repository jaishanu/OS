import express from "express";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { Client } from 'pg';
import bodyParser from 'body-parser';
import nodemailer from 'nodemailer';
import cookieParser from 'cookie-parser';

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
var email='';

app.use(express.json());       
const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'one',
    password: 'JANUunaj2410@',
    port: 5432,
});
client.connect();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
app.use(express.static(__dirname+'/public'));


//send home page
app.get('/',function(req,res){
  res.sendFile(__dirname+'/index.html');
});
//send set password page
app.get('/setpassword/:id',function(req,res){
  res.render(__dirname+'/public/setpassword.ejs',{email:req.params.id});
});
//send register email page
app.get('/solution',function(req,res){
  res.sendFile(__dirname+'/public/solution.html');
});
app.get('/logout/:id',function(req,res){
    res.redirect('/');
});
app.post("/home/admlogin",function(req,res){
  const query='select * from users';
  client.query(query,(err,res1)=>{
    res.render(__dirname+'/public/admpage.ejs',{
    data:res1.rows
  });
  });
});
//retrieve email and password and enter dashboard, else redirect to home page
app.post('/home',function(req,res){
  req.body.password=req.body.password.substring(0, req.body.password.length - 1);
  const query2 = `
  SELECT *
  FROM users
  where email=$1;
  `;
  client.query(query2,[req.body.email], (err, res1) => {
    if (err) {
        console.error(err);
        return;
    }
    if(res1.rows.length && res1.rows[0].password==req.body.password){
      req.body.password="";
      res.render(__dirname+'/public/dashboard.ejs',{
          email:res1.rows[0].email
      });
    }
    else if(res1.rows.length){
      res.redirect('/');
    }
    else{
      res.sendFile(__dirname+'/public/solution.html')
    }
  });
});
// retrieve email and send set password link then enter home page, else same page i.e solution
app.post('/email',function(req,res){
  const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "jaishanu2410@gmail.com",
    pass: "jxxqtrjnkribbynw",
  },
});
  email=req.body.email;
  const mailOptions = {
    from: 'jaishanu2410@gmail.com',
    to: email,
    subject: 'Set password',
    text: 'Set password:',
    html:"<a href='/setpassword/"+email+"'>click here</a>"
  };
  transporter.sendMail(mailOptions, function(error, info){
    if (error) {
      console.log(error);
      res.redirect('/solution');
    } 
    else{
      res.redirect('/');
    }
  });
});
//retrieve password and redirect to home page else to set password.html
app.post('/setpassword/:id',function(req,res){
  const query1='select * from users where password=$1';
  client.query(query1,[req.body.fpassword],(err,res2)=>{
    if (res2.rows.length){
      res.sendFile(__dirname+'/public/setpassword.html');
    }
  });
  if(req.body.fpassword==req.body.spassword){
     const query2 = `
    insert into 
    users (email,password)
    values($1,$2);
    `;
    client.query(query2,[req.params.id,req.body.fpassword], (err, res1) => {
      if (err) {
        console.error(err);
        return;
      }
      else{
        res.redirect('/');
      }
    });
  } 
  else{
        res.sendFile(__dirname+'/public/setpassword.html');
      }
});
app.post("/job/:id",function(req,res){
  const query='select * from users where email=$1';
  client.query(query,[req.body.email],(err,res1)=>{
      if (res1.rows.length==1 && req.body.fname!='' && req.body.lname!='' && req.body.age!=''){      
        const query1='update users set firstname=$1,lastname=$2,age=$3,'+req.params.id+'=true where email=$4';
        client.query(query1,[req.body.fname,req.body.lname,req.body.age,req.body.email],(err1,res2)=>{
          res.redirect("/");
        });
      }
      else if(res1.rows.length){
        res.render(__dirname+'/public/dashboard.ejs',{
          email:req.body.email
        });
      }
  });
  res.redirect("/");
});

var port = process.env.PORT||3000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});