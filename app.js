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
const { runInNewContext } = require('vm');
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(cookieParser());
app.set('view engine', 'ejs');
app.get('/', (req, res) => {
    res.redirect('posts');
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
        return res.redirect('/login')
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
    const user = await userModel.findOne({ email });
    if (!user) return res.status(400).send("User Not Founnd")

    bcrypt.compare(password, user.password, (err, result) => {
        if (result) {
            const token = jwt.sign({ email: user.email, user: user._id, name: user.name }, 'shhhh')
            res.cookie("token", token)
            return res.redirect('/profile')
        } else {
            return res.redirect('/login')
        }

    });


})


// Logout Setup 


app.get('/logout', (req, res) => {
    res.cookie("token", "");
    res.redirect('/profile')
})

//Profile Route 

app.get('/profile', isLoggedIn, async (req, res) => {
    const user = await userModel.findOne({ email: req.user.email }).populate("posts");
    res.render("profile", { user })
})


//Post creation

app.post('/post', isLoggedIn, async (req, res) => {
    try {
        let user = await userModel.findOne({ email: req.user.email });
        console.log("User data from post request : ", user);

        //save it in db

        let newPost = await postModel.create(
            {
                content: req.body.content,
                user: user._id
            });
        //user ky array main push krien post ko 
        user.posts.push(newPost._id);
        await user.save();
        // await user.populate('posts');
        // res.render('profile', { user });
        res.redirect('/posts')
    } catch (error) {
        console.error(error)
    }
})

// All posts page 

app.get('/posts', isLoggedIn, async (req, res) => {
    const allPosts = await postModel.find().populate('user', 'name');

    // console.log("All posts : ", allPosts.reverse())
    res.render('posts', { allPosts })
})

// Delete the posts

app.get('/delete/:id', async (req, res) => {
    const delPost = await postModel.findOne({_id:req.params.id});
    console.log("post for deletion: ", delPost)
    let  deletedPost = await postModel.findByIdAndDelete(delPost);
    return res.redirect('/profile');
})

//Like feature

app.get('/like/:id', isLoggedIn, async (req, res) => {
    let post = await postModel.findOne({ _id: req.params.id }).populate('user');
    console.log("USer data : ", post)
    if (post.likes.indexOf(req.user._id) === -1) {
        post.likes.push(req.user.id);
    } else {
        post.likes.splice(post.likes.indexOf(req.user.userId), 1)
    }
    console.log(req.params.id);

    await post.save();
    if (post) console.log("Liked");
    res.redirect('/profile')
})


//Edit the post 
app.post('/edit/:id',async(req,res)=>{
    const post = await postModel.findOne({_id:req.params.id}).populate('user');
    return res.render('edit')
})
app.listen(3000, () => {
    console.log("listening at 3000");

})