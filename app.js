const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const postModel = require('./models/post')
const userModel = require('./models/user');
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
const user = require('./models/user');
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(cookieParser());
app.set('view engine', 'ejs');
app.get('/', (req, res) => {
    res.render('register');
})

// Register setup

app.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
        console.log("User Already Exists")
        return res.status(409).json({ error: 'Already exists' });
    }
    bcrypt.genSalt(10, (err, salt) => {

        bcrypt.hash(password, salt, async (err, hash) => {
            const newUser = await userModel.create({
                name,
                email,
                password: hash
            })

            if (newUser) console.log("User successfully created");

            const token = jwt.sign({ email: email, userId: newUser._id }, 'shhhh')
            res.cookie('token', token);
            console.log("User Created Successfully")
            res.redirect('/login')

        })
    })

})

// Creating middleware 

async function isLoggedIn(req, res, next) {
    if (!req.cookies || !req.cookies.token) {
        return res.send("Token required")
    }
    try {
        let data = jwt.verify(req.cookies.token, 'shhhh');
        req.user = data;
        next();
    } catch (error) {
        res.status(403).json({ mesage: "Invalid Token " })
    }

}

// Login Route setup

app.get('/login', (req, res) => {
    res.render('login.ejs');
})

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    console.log("email : ", email)
    const user = await userModel.findOne({ email });
    if (!user) return res.status(400).send("User Not Founnd")

    bcrypt.compare(password, user.password, (err, result) => {
        console.log("result :", result)
        if (result) {
            const token = jwt.sign({ email: user.email, user: user._id, name: user.name }, 'shhhh')
            console.log("Token : ", token)
            res.cookie("token", token)
            return res.redirect('/dashboard')
        } else {
            return res.redirect('/login')
        }

    });


})


// Logout Setup 


app.get('/logout', (req, res) => {
    res.cookie("token", "");
    res.redirect('/')
})

//Profile Route 

app.get('/profile', isLoggedIn, async (req, res) => {
    try {
        console.log("Data from token : ", req.user);
        
        res.render('profile', { name: req.user.name });
    } catch (error) {
        return res.send("error in profile catch part : ", userData)
    }

})

app.listen(3000, () => {
    console.log("listening at 3000");

})