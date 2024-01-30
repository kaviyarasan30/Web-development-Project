//import port number for server running
const port = 4000;
// import dependencieses 
const express = require("express"); //using this express we can create the app instance 
const app = express();
//intialize the mongoose package 
const mongoose = require("mongoose");
//intailize the  json web token
const jwt = require("jsonwebtoken");
//intailize the multer,multer which is used to store image in backend folder that will be uploaded in admin panel
const multer = require("multer");
//include path for express server,using the path get acceses to backend directory in your express app
const path = require("path");
//intailize the cros
const cors = require("cors");
const { error } = require("console");

app.use(express.json()); //with the help off express.josn whatevere request wil be get from the response automaticly pass through the json
app.use(cors());

//Database Connection with MongoDB
mongoose.connect("mongodb+srv://kavi8707:Kavi8707@cluster0.xkwwszp.mongodb.net/e-commerce", {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        connectTimeoutMS: 30000,
    })
    .then(() => {
        console.log("Connected to MongoDB");
    })
    .catch((error) => {
        console.error("Error connecting to MongoDB:", error);
    });


//Api creation

app.get("/", (req, res) => {
    res.send("Express App is Running")
})

//Image storage Engine

const storage = multer.diskStorage({
    destination: './upload/images',
    filename: (req, file, cb) => {
        return cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`)
    }
})

const upload = multer({ storage: storage })

// Creating upload endpoit for image
app.use('/images', express.static('upload/images'))
app.post("/upload", upload.single('product'), (req, res) => {
    res.json({
        success: 1,
        image_url: `http://localhost:${port}/images/${req.file.filename}`
    })
})

// to creating end point to can add  the product to the mongoo atls , whenever we upload any object to the mondoobd to creat on schema 

// Schema for Creating Products

const Product = mongoose.model("Product", {
        id: {
            type: Number,
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        image: {
            type: String,
            required: true,
        },
        category: {
            type: String,
            required: true,
        },
        new_price: {
            type: Number,
            required: true,
        },
        old_price: {
            type: Number,
            required: true,
        },
        date: {
            type: Date,
            default: Date.now,
        },
        avilable: {
            type: Boolean,
            default: true,
        },

    })
    //api endpoint for add data to the dbase 

app.post('/addproduct', async(req, res) => {
    //logic for to give auto id to the product by the dbase
    let products = await Product.find({});
    let id;
    if (products.length > 0) {
        let last_product_array = products.slice(-1);
        let last_product = last_product_array[0];
        id = last_product.id + 1;
    } else {
        id = 1;
    }
    const product = new Product({
        id: id,
        name: req.body.name,
        image: req.body.image,
        category: req.body.category,
        new_price: req.body.new_price,
        old_price: req.body.old_price,
    });
    console.log(product);
    //save product to the dbase
    await product.save();
    console.log("Saved");
    res.json({
        success: true,
        name: req.body.name,
    })
})

//Creating API for deleting products,//in mongooes to delete the products in database using findonedelete function
app.post('/removeproduct', async(req, res) => {
    await Product.findOneAndDelete({ id: req.body.id });
    console.log("removed");
    res.json({
        success: true,
        name: req.body.name,
    })
})

// Shema creating for User model

const Users = mongoose.model('Users', {
        name: {
            type: String,
        },
        email: {
            type: String,
            unique: true,
        },
        password: {
            type: String,
        },
        cartData: {
            type: Object,
        },
        date: {
            type: Date,
            default: Date.now,
        }
    })
    //Creating endpoint for registering the user

app.post('/signup', async(req, res) => {
    let check = await Users.findOne({ email: req.body.email });
    if (check) {
        return res.status(400).json({ success: false, error: "existing user found with same email address" })
    }
    let cart = {}
    for (let i = 0; i < 300; i++) {
        cart[i] = 0;
    }
    const user = new Users({
        name: req.body.username,
        email: req.body.email,
        password: req.body.password,
        cartData: cart,
    })

    await user.save();

    //jwt authentication

    const data = {
        user: {
            id: user.id
        }
    }
    const token = jwt.sign(data, 'secret_ecom');
    res.json({ success: true, token })
})

// creating endpoint for user login

app.post('/login', async(req, res) => {
    let user = await Users.findOne({ email: req.body.email });
    if (user) {
        const passCompare = req.body.password == user.password;
        if (passCompare) {
            const data = {
                user: {
                    id: user.id
                }
            }
            const token = jwt.sign(data, 'secret_ecom');
            res.json({ success: true, token });
        } else {
            res.json({ success: false, error: "Wrong Password" });
        }
    } else {
        res.json({ success: false, error: "Wrong email id" });
    }
})

//Creating API for get all products
app.get('/allproducts', async(req, res) => {
    let products = await Product.find({});
    console.log("All Products Fetched");
    res.send(products);
})

// creating end point for new collection data 

app.get('/newcollections', async(req, res) => {
    let products = await Product.find({});
    let newcollection = products.slice(1).slice(-8);
    console.log("NewCollection Fetched");
    res.send(newcollection);
})

// Creating end point for popular in  women category 

app.get('/popularinwomen', async(req, res) => {
    let products = await Product.find({ category: "Women" });
    let popular_in_women = products.slice(0, 4);
    console.log("Popular in women fetched ");
    res.send(popular_in_women);
})

// to creating middelwear to fetch user details from the auth-token to database

const fetchUser = async(req, res, next) => {
    const token = req.header('auth-token');
    if (!token) {
        res.status(401).send({ error: "Please authenticate using valid token" })
    } else {
        try {
            const data = jwt.verify(token, 'secret_ecom');
            req.user = data.user;
            next();
        } catch (error) {
            res.status(401).send({ errors: "Please authenticate using valid token " })
        }
    }

}


//creating endpoint for adding cart data to the database (or) mongooes database

app.post('/addtocart', fetchUser, async(req, res) => {
    console.log("added", req.body.itemId);
    let userData = await Users.findOne({ _id: req.user.id });
    userData.cartData[req.body.itemId] += 1;
    await Users.findOneAndUpdate({ _id: req.user.id }, { cartData: userData.cartData });
    res.send("Added")
})

//creating endpoint to remove product from cartdata

app.post('/removefromcart', fetchUser, async(req, res) => {
        console.log("removed", req.body.itemId);
        let userData = await Users.findOne({ _id: req.user.id });
        if (userData.cartData[req.body.itemId] > 0)
            userData.cartData[req.body.itemId] -= 1;
        await Users.findOneAndUpdate({ _id: req.user.id }, { cartData: userData.cartData });
        res.send("Removed")

    })
    // creating endpoint to get cartdata from the database once's the user login based on the,local storage auth-token 
app.post('/getcart', fetchUser, async(req, res) => {
    console.log('GetCart');
    let userData = await Users.findOne({ _id: req.user.id });
    res.json(userData.cartData);
})


app.listen(port, (error) => {
    if (!error) {
        console.log("Server Runnig on Port : " + port)
    } else {
        console.log("Error : " + error)
    }
})