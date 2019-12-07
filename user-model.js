var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Product = require('./product-model');
var Review = require('./review-model');

var UserSchema = new Schema(
  {
    id: Number,
    name: String,
    username: String,
    password: String,
    email: String,
    photo:String,
    date:String,
    deleted_at:Number,
  },
  { 
  	timestamps: true,
  	toJSON: { virtuals: true }
  }
);

UserSchema.virtual('purchases', {
  ref: 'Product', // The model to use
  localField: 'id', 
  foreignField: 'purchaser_id', 
  justOne: false,
});
// products based on seller
UserSchema.virtual('products',{
  ref: 'Product',
  localField:'id',
  foreignField:'seller_id',
  justOne: false,
})


UserSchema.virtual('receivedReviews', {
  ref: 'Review', // The model to use
  localField: 'id', 
  foreignField: 'seller_id', });

UserSchema.virtual('sold', {
  ref: 'Product',
  localField:'id',
  foreignField:'seller_id',
  justOne: false,
});
UserSchema.virtual('currentListings', {
  ref: 'Product',
  localField:'id',
  foreignField:'seller_id',
  justOne: false,
});

module.exports = mongoose.model('User', UserSchema);