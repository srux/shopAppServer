
var mongoose = require('mongoose');
var express = require('express');
var bodyParser = require('body-parser');
var logger = require('morgan');
var cors = require('cors');
var fileUpload = require('express-fileupload');

var Product = require('./product-model');
var Category = require('./category-model');
var User = require('./user-model');
var Review = require('./review-model');

//setup database connection
// mongodb+srv://ants:<password>@cluster0-ucard.mongodb.net/test?retryWrites=true&w=majority

// mongodb://ants:<password>@cluster0-shard-00-00-ucard.mongodb.net:27017,cluster0-shard-00-01-ucard.mongodb.net:27017,cluster0-shard-00-02-ucard.mongodb.net:27017/test?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin&retryWrites=true&w=majority

var connectionString = 'mongodb+srv://ants:admin@cluster0-ucard.mongodb.net/ANTS?retryWrites=true&w=majority';

mongoose.connect(connectionString,{ useNewUrlParser: true });
var  db = mongoose.connection;
db.once('open', () => console.log('Database connected'));
db.on('error', () => console.log('Database error'));

//setup express server
var app = express();
app.use(cors());
app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: true })); 

app.use(fileUpload());
app.use(logger('dev'));
app.use(express.static('public'))

//setup routes
var router = express.Router();

router.get('/testing', (req, res) => {
  res.send('<h1>Testing is working</h1>')
})

//===products===
router.get('/products', (req, res) => {

	Product.find({deleted_at: null})
	.populate({
		path:'review',
		populate:'user'
	})
	.then((products) => {
	    return res.json(products);
	});

})

router.get('/products/:id', (req, res) => {

	Product.findOne({id:req.params.id,deleted_at: null })

	.populate({
		path:'review',
		populate:'user'
	})
	.then((product) => {
	    return res.json(product);
	});
})

router.post('/products', (req, res) => {

	var product = new Product();
	product.id = Date.now();
	
	var data = req.body;
	//console.log(data);
	Object.assign(product,data);
	
	product.save()
	.then((product) => {
	  	return res.json(product);
	});
});

router.delete('/products/:id', (req, res) => {

	Product.deleteOne({ id: req.params.id })
	.then(() => {
		return	Review.deleteOne({ prod_id: req.params.id })	
	})
	.then(()=>res.json('deleted'))
});

router.put('/products/:id', (req, res) => {

	Product.findOne({id:req.params.id})
	.then((product) => {
		var data = req.body;
		Object.assign(product,data);
		return product.save()	
	})
	.then((product) => {
		return res.json(product);
	});	

});
//===category===
router.get('/categories', (req, res) => {

	Category.find()
	.then((categories) => {

	    return res.json(categories);
	});

})

// router.get('/categories/:id', (req, res) => {

// 	Category.findOne({id:req.params.id})
// 	.populate('products')
// 	.then((category) => {

// 	    return res.json(category);
// 	});

// })

router.get('/categories/:name', (req, res) => {

	Category.findOne({name:req.params.name})
	.populate('products')
	.then((category) => {

	    return res.json(category);
	});

})
//===user===
router.get('/users', (req, res) => {

	User.find({deleted_at: null })
	
	.then((users) => {
	    return res.json(users);
	});

})

router.get('/users/:id', (req, res) => {


	User.findOne({id:req.params.id})
	.populate('purchases')
	.populate('products')//based on seller
	.populate({
		path:'receivedReviews',
		populate: 'product'})
	.populate('reviews')
	.populate({
		path:'sold',
		match: { purchaser_id: {$ne: null}}
	})
	.populate({
		path:'currentListings',
		match: { purchaser_id: null}
	})
	.then((user) => {
	    return res.json(user);
	});
})

// router.get('/users/:id/products', (req, res) => {


// 	Product.find({user_id:req.params.id})
// 	.populate('Products')
// 	.then((products) => {
// 	    return res.json(products);
// 	});

// })

router.post('/users', (req, res) => {

	var user = new User();
	user.id = Date.now();
	
	var data = req.body;
	Object.assign(user,data);
	
	user.save()
	.then((user) => {
	  	return res.json(user);
	});
});

router.delete('/users/:id', (req, res) => {

	// User.deleteOne({ id: req.params.id })
	// .then(() => {
	// 	return res.json('deleted');
	// });

	User.findOne({id:req.params.id})
	.then((user) => {

		user.deleted_at = Date.now()
		return user.save()	
	})
	.then((user) => {

		return Product.updateMany({ seller_id: user.id }, { deleted_at: Date.now() })
	})
	.then((bla) => {

		console.log(bla)
		return res.json(bla.nModified);
	});	
});

router.put('/users/:id', (req, res) => {

	User.findOne({id:req.params.id})
	.then((user) => {
		var data = req.body;
		Object.assign(user,data);
		return user.save()	
	})
	.then((user) => {
		return res.json(user);
	});	

});

router.post('/authenticate', (req, res) => {
	var {username,password} = req.body;
	var credential = {username,password,deleted_at:null}
	User.findOne(credential)
	.then((user) => {
	    return res.json(user);
	});
});

//===photo upload ====
router.post('/upload', (req, res) => {

	var files = Object.values(req.files);
	var uploadedFile = files[0];

	var newName = Date.now() + uploadedFile.name;

	uploadedFile.mv('public/'+ newName, function(){
		res.send(newName)
	})
	
});

//=== multiple photo upload ===

router.post('/uploads', (req, res) => {

	


	if(req.files){
		var files = Object.values(req.files)
		var uploadedFiles = files[0];
		uploadedFiles = Array.isArray(uploadedFiles) ? uploadedFiles : [uploadedFiles] //turning a single file to an array

		var promises = []


		for(let i=0;i<uploadedFiles.length;i++){
			let uploadedFile = uploadedFiles[i]

			let newName = Date.now() + '_' + uploadedFile.name;

			console.log(newName)
			
			// if(uploadedFiles.length>1){
			let promise = new Promise(function(resolve, reject) {
				uploadedFile.mv('public/'+ newName, function(){
					resolve(newName);
				})	  
			})
			promises.push(promise)
			
		}

		Promise.all(promises).then(function(fileNames) {
			res.send(fileNames)
	
		})
	}else{
		res.send([])
	}
	
	
});


//=== Review Product====
router.post('/reviews', (req, res) => {

	var review = new Review();
	review.id = Date.now();
	
	var data = req.body;
	Object.assign(review,data);
	
	review.save()
	.then((review) => {
	  	return res.json(review);
	});
});

router.delete('/reviews/:id', (req, res) => {

	Review.deleteOne({ id: req.params.id })
	.then(() => {
		return res.json('deleted');
	});
});

app.use('/api', router);

// launch our backend into a port
const apiPort = 80;
app.listen(apiPort, () => console.log('Listening on port '+apiPort));