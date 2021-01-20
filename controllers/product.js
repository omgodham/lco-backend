const Product = require('../models/product');
const formidable = require('formidable');
const fs = require('fs');//file system
const _ = require('lodash');


//Middleware to get product by id
exports.getProductById = (req,res,next,id) => {
        Product.findById(id)
        .populate('category')
        .exec((err,product)=>{
            if(err){
                return res.status(400).json({
                    error:'product not found'
                })
            }
            req.product = product;
            next();
        })
}

//Create Product 
exports.createProduct = (req,res) => {
    let form = new formidable.IncomingForm();
    form.keepExtensions = true;
    form.parse(req,(err,fields,file) => {
        if(err){
            return res.status(400).json({
                error:'cannot create product'
            })
        }
               // const {name,description,price,category,stock} = fields;

        // if(!name || !description || !price || !category || !stock){
        //     return res.status(400).json({
        //         error:'Input all fields'
        //     })
        // }
        let product = new Product(fields);
        
        if(file.photo){
            if(file.photo.size > 3000000){
                return res.status(400).json({
                    error:'file size is to big'
                })
            }
           product.photo.data = fs.readFileSync(file.photo.path);
           product.photo.contentType = file.photo.type;
        }
        console.log(product);

        product.save((err,product)=> {
            if(err){
                return res.status(400).json({
                    error:'Not able to save product',
                    err:err
                })
            }
            res.json(product);
        });
    });
}

//get product
exports.getProduct = (req,res) => {
    req.product.photo = undefined;
    return res.json(req.product);
}

//remove product
exports.deleteProduct = (req,res) =>{
    let product = req.product;
    product.remove().exec((err,deletedProduct) => {
        if(err){
            return res.status(400).json({
                err:'unable to delete product'
            })
        }
        res.json({
            message:'deleted successfully',
            deletedProduct});
    });
}

//update product

exports.updateProduct = (req,res) => {

    let form = new formidable.IncomingForm();
    form.keepExtensions = true;

    form.parse(req,(err,fields,file) => {
        if(err){
            return res.status(400).json({
                error:'cannot create product'
            })
        }
        let product = req.product;
        product = _.extend(product,fields);
        console.log(product);

        if(file.photo){
            if(file.photo.size > 3000000){
                return res.status(400).json({
                    error:'file size is to big'
                })
            }
           product.photo.data = fs.readFileSync(file.photo.path);
           product.photo.contentType = file.photo.type;
        }
        // console.log(product);

        product.save((err,product)=> {
            if(err){
                return res.status(400).json({
                    error:'Not able to update product',
                    err:err
                })
            }
            res.json(product);
        });
    });
}

//Middleware to get Photo
exports.photo = (req,res,next) => {
 if(req.product.photo.data){
    res.set('Content-Type',req.product.photo.contentType);
   return res.send(req.product.photo.data); 
 }  
 next();
}

//Get All Products
exports.getAllProducts = (req,res) => {
    let limit = req.query.limit ? parseInt(req.query.limit) : 8;
    let sortBy = req.query.sortBy ? req.query.sortBy : '_id';
    Product.find()
    .select('-photo')
    .sort([[sortBy,'asc']])
    .limit(limit)
    .exec((err,products) =>{
    if(err){
        return res.status(400).json({
            error:'not found any products'
        })
    }
    res.json(products);
})
}

//get all categories from product
exports.getAllUniqueCategories = (req,res) =>{
Product.distinct('category',{},(err,categories) =>{ //distinct gives only categories not all product object
    if(err){
        return res.status(400).json({
            error:'not able to get all categories from product'
        });
    }
    res.json(categories);
});
}

//middleware to update stock
exports.updateStock = (req,res,next) =>{
 let myOperations = req.order.products.map( prod => {
     return {
         updateOne:{
         filter:{_id:prod._id},
         update:{$inc :{stock:-prod.count,sold:+prod.count}}
     }
     }
 });
    Product.bulkWrite(myOperations,{},(err,products)=>{
        if(err){
            return res.status(400).json({
                error:'not able to update stock'
            })
        }
        next();
    });   
}